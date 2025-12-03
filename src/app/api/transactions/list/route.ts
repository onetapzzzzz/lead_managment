import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leadsQuerySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = leadsQuerySchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    });

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

    const skip = (params.page - 1) * params.limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: params.limit,
      }),
      prisma.transaction.count({
        where: { userId: user.id },
      }),
    ]);

    return NextResponse.json({
      transactions: transactions.map((transaction) => ({
        id: transaction.id,
        amount: transaction.amount,
        type: transaction.type,
        createdAt: transaction.createdAt.toISOString(),
        leadId: transaction.leadId,
      })),
      total,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Неверные данные запроса" },
        { status: 400 }
      );
    }
    console.error("Error in /api/transactions/list:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

