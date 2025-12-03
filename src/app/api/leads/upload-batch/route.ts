import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leadBatchUploadSchema } from "@/lib/validations";
import { parsePhonesFromText } from "@/lib/phoneParser";
import { MAX_PURCHASES } from "@/lib/leadPricing";

// Срок "свежести" лида — 3 месяца
const LEAD_FRESHNESS_MONTHS = 3;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = leadBatchUploadSchema.parse(body);

    // Получаем пользователя
    let user = data.userId
      ? await prisma.user.findFirst({ where: { telegramId: data.userId } })
      : await prisma.user.findFirst({ orderBy: { createdAt: "desc" } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: data.userId || "demo_user",
          balance: 0,
        },
      });
    }

    // Парсим телефоны из текста
    const parsedPhones = parsePhonesFromText(data.rawText);
    const validPhones = parsedPhones.filter((p) =>
      /^\+7\d{10}$/.test(p.normalized)
    );

    // Удаляем дубликаты внутри батча
    const uniquePhones = Array.from(
      new Map(validPhones.map((p) => [p.normalized, p])).values()
    );

    // Дата "свежести" — 3 месяца назад
    const freshnessDate = new Date();
    freshnessDate.setMonth(freshnessDate.getMonth() - LEAD_FRESHNESS_MONTHS);

    // Проверяем существующие лиды в БД (антифрод)
    // Нельзя заливать если:
    // 1. Лид был залит за последние 3 месяца И
    // 2. Лид НЕ в архиве ИЛИ был куплен 3 раза
    const existingLeads = await prisma.lead.findMany({
      where: {
        phone: {
          in: uniquePhones.map((p) => p.normalized),
        },
      },
      select: { 
        phone: true, 
        createdAt: true,
        isArchived: true,
        purchaseCount: true,
        status: true,
      },
    });

    // Фильтруем: можно залить если лид старше 3 месяцев ИЛИ (в архиве И куплен < 3 раз)
    const blockedPhones = new Set(
      existingLeads
        .filter((lead) => {
          const isFresh = lead.createdAt >= freshnessDate;
          const canReupload = lead.isArchived && lead.purchaseCount < MAX_PURCHASES;
          
          // Блокируем если свежий И нельзя перезалить
          return isFresh && !canReupload;
        })
        .map((l) => l.phone)
    );

    const newPhones = uniquePhones.filter(
      (p) => !blockedPhones.has(p.normalized)
    );

    // Считаем сколько было отклонено как дубли
    const duplicatesCount = uniquePhones.length - newPhones.length;

    // Создаём батч
    const batch = await prisma.leadUploadBatch.create({
      data: {
        userId: user.id,
        niche: data.niche,
        region: data.region,
        rawText: data.rawText,
        totalUploaded: uniquePhones.length,
        totalValid: newPhones.length,
        pointsCredited: 0,
        status: "approved",
      },
    });

    // Создаём лиды (цена будет рассчитываться динамически при покупке)
    const leads = await Promise.all(
      newPhones.map((phone) =>
        prisma.lead.create({
          data: {
            phone: phone.normalized,
            region: data.region,
            niche: data.niche,
            comment: data.description, // Описание лида
            ownerId: user.id,
            purchaseCount: 0,
            isArchived: false,
            ownerReward: 0,
            status: "in_market",
            batchId: batch.id,
          },
        })
      )
    );

    // НЕ начисляем поинты за загрузку!
    // Поинты можно получить ТОЛЬКО когда кто-то покупает твой лид
    // Это ключевая механика: мотивация заливать качественные лиды
    
    await prisma.leadUploadBatch.update({
      where: { id: batch.id },
      data: { pointsCredited: 0 }, // Поинты за загрузку = 0
    });

    // Записываем транзакцию (информационную)
    if (newPhones.length > 0) {
      await prisma.transaction.create({
        data: {
          userId: user.id,
          amount: 0, // Поинты не начисляем
          type: "upload_reward",
          description: `Загружено ${newPhones.length} лидов (поинты при продаже)`,
        },
      });
    }

    // Отправляем уведомление через бота
    if (user.telegramId) {
      try {
        await fetch(`${process.env.BOT_API_URL || 'http://localhost:8000'}/notify/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            telegram_id: user.telegramId,
            total_valid: newPhones.length,
            duplicates: duplicatesCount,
          }),
        }).catch((error) => {
          console.error("Error sending bot notification:", error);
        });
      } catch (error) {
        console.error("Error sending bot notification:", error);
      }
    }

    return NextResponse.json({
      batch: {
        id: batch.id,
        totalUploaded: batch.totalUploaded,
        totalValid: batch.totalValid,
        duplicatesRejected: duplicatesCount,
        pointsCredited: 0, // Поинты только при продаже
      },
      leads: leads.map((lead) => ({
        id: lead.id,
        phone: lead.phone,
      })),
      balance: user.balance,
      message: newPhones.length > 0 
        ? `Загружено ${newPhones.length} лидов. Поинты начислятся когда их купят!`
        : "Все номера уже есть в базе",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Неверные данные запроса" },
        { status: 400 }
      );
    }
    console.error("Error in /api/leads/upload-batch:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
