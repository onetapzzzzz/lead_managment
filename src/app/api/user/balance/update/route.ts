import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { balanceUpdateSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = balanceUpdateSchema.parse(body);

    // Для демо используем первого пользователя
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

    const amount = data.type === "deposit" ? data.amount : -data.amount;
    const newBalance = user.balance + amount;

    if (newBalance < 0) {
      return NextResponse.json(
        { error: "Недостаточно средств" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { balance: newBalance },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: data.amount,
        type: data.type,
      },
    });

    return NextResponse.json({
      balance: updatedUser.balance,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Неверные данные запроса" },
        { status: 400 }
      );
    }
    console.error("Error in /api/user/balance/update:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

