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
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const where = search
      ? {
          OR: [
            { username: { contains: search } },
            { fullName: { contains: search } },
            { telegramId: { contains: search } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              uploadedLeads: true,
              purchasedLeads: true,
              transactions: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users: users.map((u) => ({
        ...u,
        uploadsCount: u._count.uploadedLeads,
        purchasesCount: u._count.purchasedLeads,
        transactionsCount: u._count.transactions,
      })),
      total,
      pages: Math.ceil(total / limit),
      page,
    });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { error: "Ошибка получения пользователей" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId, balance, role } = await request.json();

    const updateData: Record<string, unknown> = {};
    if (balance !== undefined) updateData.balance = parseFloat(balance);
    if (role !== undefined) updateData.role = role;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Логируем изменение баланса
    if (balance !== undefined) {
      await prisma.transaction.create({
        data: {
          userId,
          amount: parseFloat(balance) - (user.balance || 0),
          type: "admin_adjustment",
          description: "Корректировка баланса администратором",
        },
      });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Admin update user error:", error);
    return NextResponse.json(
      { error: "Ошибка обновления пользователя" },
      { status: 500 }
    );
  }
}

