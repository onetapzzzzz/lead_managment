import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const withdrawSchema = z.object({
  userId: z.string().min(1, "Требуется userId"),
  amount: z.number().positive("Сумма должна быть положительной"),
  method: z.enum(["card", "phone", "crypto"]).optional().default("card"),
  details: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = withdrawSchema.parse(body);

    // Ищем пользователя по Telegram ID
    const user = await prisma.user.findFirst({
      where: { telegramId: data.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    // Проверяем баланс
    if (user.balance < data.amount) {
      return NextResponse.json(
        { error: `Недостаточно LC. У вас: ${user.balance}, запрошено: ${data.amount}` },
        { status: 400 }
      );
    }

    // Минимальная сумма вывода
    const MIN_WITHDRAW = 1;
    if (data.amount < MIN_WITHDRAW) {
      return NextResponse.json(
        { error: `Минимальная сумма вывода: ${MIN_WITHDRAW} LC` },
        { status: 400 }
      );
    }

    // Выполняем вывод в транзакции
    const result = await prisma.$transaction(async (tx) => {
      // Списываем баланс
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: data.amount } },
      });

      // Создаём транзакцию вывода
      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          amount: -data.amount,
          type: "withdraw",
          description: `Вывод ${data.amount} LC (${data.method})${data.details ? `: ${data.details}` : ""}`,
        },
      });

      return { updatedUser, transaction };
    });

    // Уведомляем администратора о заявке на вывод (можно добавить позже)
    // Пока просто возвращаем успех

    return NextResponse.json({
      success: true,
      message: `Заявка на вывод ${data.amount} LC принята`,
      newBalance: result.updatedUser.balance,
      transactionId: result.transaction.id,
      // Курс: 1 LC = 100 руб
      amountRub: Math.round(data.amount * 100),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error in /api/user/withdraw:", error);
    return NextResponse.json(
      { error: "Ошибка при выводе средств" },
      { status: 500 }
    );
  }
}

// GET - получить историю выводов
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Требуется userId" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { telegramId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    const withdrawals = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: "withdraw",
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      withdrawals: withdrawals.map(w => ({
        id: w.id,
        amount: Math.abs(w.amount),
        description: w.description,
        createdAt: w.createdAt.toISOString(),
      })),
      balance: user.balance,
    });
  } catch (error) {
    console.error("Error in GET /api/user/withdraw:", error);
    return NextResponse.json(
      { error: "Ошибка получения данных" },
      { status: 500 }
    );
  }
}

