import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTelegramWebAppData, parseInitData } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { initData } = body;

    if (!initData) {
      return NextResponse.json(
        { error: "initData обязателен" },
        { status: 400 }
      );
    }

    // Верификация подписи (в продакшене использовать реальный токен бота)
    const botToken = process.env.TELEGRAM_BOT_TOKEN || "demo_token";
    const isValid = verifyTelegramWebAppData(initData, botToken);

    if (!isValid && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Неверная подпись" },
        { status: 401 }
      );
    }

    const parsed = parseInitData(initData);
    
    if (!parsed.user) {
      return NextResponse.json(
        { error: "Данные пользователя не найдены" },
        { status: 400 }
      );
    }

    const telegramId = String(parsed.user.id);
    const username = parsed.user.username || null;
    const fullName = [
      parsed.user.first_name,
      parsed.user.last_name,
    ]
      .filter(Boolean)
      .join(" ") || null;

    // Создаём или обновляем пользователя
    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {
        username,
        fullName,
      },
      create: {
        telegramId,
        username,
        fullName,
        balance: 1000, // Стартовый баланс
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        fullName: user.fullName,
        balance: user.balance,
      },
    });
  } catch (error) {
    console.error("Error in /api/auth/telegram:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}





