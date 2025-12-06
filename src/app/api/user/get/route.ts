import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const telegramId = searchParams.get("userId"); // Это telegramId
    const username = searchParams.get("username");
    const fullName = searchParams.get("fullName");

    // Если нет telegramId - это не авторизованный запрос
    if (!telegramId) {
      return NextResponse.json(
        { error: "Требуется авторизация через Telegram" },
        { status: 401 }
      );
    }

    // Ищем пользователя по Telegram ID
    let user = await prisma.user.findFirst({
      where: { telegramId: telegramId },
    });

    // Если пользователь не найден - создаём нового
    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: telegramId,
          username: username || null,
          fullName: fullName || null,
          balance: 5, // Начальный баланс 5 LC для новых пользователей
        },
      });
    } else {
      // Обновляем username и fullName если они изменились
      if ((username && username !== user.username) || (fullName && fullName !== user.fullName)) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            username: username || user.username,
            fullName: fullName || user.fullName,
          },
        });
      }
    }

    return NextResponse.json({
      id: user.id,
      telegramId: user.telegramId,
      username: user.username,
      fullName: user.fullName,
      balance: user.balance,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Error in /api/user/get:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
