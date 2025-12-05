import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const ADMIN_TOKEN = "lead_exchange_admin_token_2024";

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");
  return token?.value === ADMIN_TOKEN;
}

export async function GET(request: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type") || "";
    const userId = searchParams.get("userId") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (userId) where.userId = userId;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: { username: true, fullName: true, telegramId: true },
          },
          lead: {
            select: { phone: true },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    // Агрегация по типам
    const byType = await prisma.transaction.groupBy({
      by: ["type"],
      _sum: { amount: true },
      _count: true,
    });

    return NextResponse.json({
      transactions,
      total,
      pages: Math.ceil(total / limit),
      page,
      summary: byType.reduce((acc, item) => {
        acc[item.type] = {
          count: item._count,
          sum: item._sum.amount || 0,
        };
        return acc;
      }, {} as Record<string, { count: number; sum: number }>),
    });
  } catch (error) {
    console.error("Admin transactions error:", error);
    return NextResponse.json(
      { error: "Ошибка получения транзакций" },
      { status: 500 }
    );
  }
}

