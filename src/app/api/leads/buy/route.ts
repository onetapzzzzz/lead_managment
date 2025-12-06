import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leadBuySchema } from "@/lib/validations";
import { getLeadPrice, MAX_PURCHASES } from "@/lib/leadPricing";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = leadBuySchema.parse(body);

    // Получаем пользователя по telegramId или используем первого
    let user = data.userId 
      ? await prisma.user.findFirst({ where: { telegramId: data.userId } })
      : await prisma.user.findFirst({ orderBy: { createdAt: "desc" } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: data.userId || "demo_user",
          balance: 5, // Начальный баланс 5 LC
        },
      });
    }

    // Используем транзакцию для атомарности
    const result = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({
        where: { id: data.leadId },
        include: {
          purchases: {
            where: { buyerId: user.id }
          }
        }
      });

      if (!lead) {
        throw new Error("Лид не найден");
      }

      if (lead.status !== "in_market") {
        throw new Error("Лид недоступен для покупки");
      }

      if (lead.isArchived || lead.purchaseCount >= MAX_PURCHASES) {
        throw new Error("Лид уже в архиве (куплен 3 раза)");
      }

      if (lead.ownerId === user.id) {
        throw new Error("Нельзя купить свой лид");
      }

      // Проверяем, не покупал ли уже этот пользователь этот лид
      if (lead.purchases.length > 0) {
        throw new Error("Вы уже покупали этот лид");
      }

      // Рассчитываем цену по degressive pricing
      const price = getLeadPrice(lead.purchaseCount);
      if (price === null) {
        throw new Error("Лид недоступен для покупки");
      }

      const currentUser = await tx.user.findUnique({
        where: { id: user.id },
      });

      if (!currentUser || currentUser.balance < price) {
        throw new Error(`Недостаточно LC. Нужно: ${price}, у вас: ${currentUser?.balance || 0}`);
      }

      // Списание у покупателя
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: price } },
      });

      // Начисление владельцу (100% — без комиссии) и увеличение счётчика продаж
      if (lead.ownerId && lead.ownerId !== user.id) {
        await tx.user.update({
          where: { id: lead.ownerId },
          data: { 
            balance: { increment: price },
            totalSales: { increment: 1 }, // Увеличиваем счётчик продаж
          },
        });

        // Транзакция для владельца
        await tx.transaction.create({
          data: {
            userId: lead.ownerId,
            amount: price,
            type: "sale_reward",
            description: `Продажа лида ${lead.phone.slice(-4)} (${lead.purchaseCount + 1}-я покупка)`,
          },
        });
      }

      // Определяем новый статус
      const newPurchaseCount = lead.purchaseCount + 1;
      const isNowArchived = newPurchaseCount >= MAX_PURCHASES;
      const newStatus = isNowArchived ? "archived" : "in_market";

      // Обновление лида
      const updatedLead = await tx.lead.update({
        where: { id: lead.id },
        data: {
          purchaseCount: newPurchaseCount,
          isArchived: isNowArchived,
          status: newStatus,
          ownerReward: { increment: price },
        },
      });

      // Запись о покупке
      await tx.leadPurchase.create({
        data: {
          leadId: lead.id,
          buyerId: user.id,
          price: price,
          purchaseNum: newPurchaseCount,
        },
      });

      // Транзакция покупки для покупателя
      await tx.transaction.create({
        data: {
          userId: user.id,
          amount: -price,
          type: "purchase",
          leadId: lead.id,
          description: `Покупка лида ${lead.phone.slice(-4)} за ${price} LC`,
        },
      });

      return { updatedUser, updatedLead, price };
    });

    // Отправляем уведомление через бота (если есть telegramId)
    if (user.telegramId) {
      try {
        await fetch(`${process.env.BOT_API_URL || 'http://localhost:8000'}/notify/purchase`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            telegram_id: user.telegramId,
            lead_phone: result.updatedLead.phone,
            price: result.price,
            new_balance: result.updatedUser.balance,
          }),
        }).catch((error) => {
          console.error("Error sending bot notification:", error);
        });
      } catch (error) {
        console.error("Error sending bot notification:", error);
      }
    }

    return NextResponse.json({
      lead: {
        id: result.updatedLead.id,
        phone: result.updatedLead.phone,
        comment: result.updatedLead.comment,
        region: result.updatedLead.region,
        niche: result.updatedLead.niche,
        purchaseCount: result.updatedLead.purchaseCount,
        isArchived: result.updatedLead.isArchived,
        createdAt: result.updatedLead.createdAt.toISOString(),
        sellerId: result.updatedLead.ownerId, // Для возможности оставить отзыв
      },
      price: result.price,
      balance: result.updatedUser.balance,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Неверные данные запроса" },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Внутренняя ошибка сервера";
    const status = message.includes("не найден") ? 404 : 
                   message.includes("недостаточно") || message.includes("недоступен") || 
                   message.includes("уже") || message.includes("Нельзя") ? 400 : 500;
    console.error("Error in /api/leads/buy:", error);
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
