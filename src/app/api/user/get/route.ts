import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { userGetSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = userGetSchema.parse({
      userId: searchParams.get("userId") || undefined,
    });

    // Для демо используем первого пользователя или создаём его
    let user = await prisma.user.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: "demo_user",
          balance: 1000,
        },
      });
    }

    if (params.userId && params.userId !== user.id) {
      user = await prisma.user.findUnique({
        where: { id: params.userId },
      });

      if (!user) {
        return NextResponse.json(
          { error: "Пользователь не найден" },
          { status: 404 }
        );
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

