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
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Строим условие where
    const whereConditions: any[] = [];
    
    if (search) {
      whereConditions.push({
        OR: [
          { username: { contains: search, mode: "insensitive" } },
          { fullName: { contains: search, mode: "insensitive" } },
          { telegramId: { contains: search } },
        ],
      });
    }

    // Фильтр по дате регистрации
    if (dateFrom || dateTo) {
      const dateFilter: any = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.lte = endDate;
      }
      whereConditions.push({ createdAt: dateFilter });
    }

    const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

    // Определяем сортировку
    let orderBy: any = { [sortBy]: sortOrder };
    
    // Для LTV нужна отдельная логика (сортируем в памяти)
    const sortInMemory = ["ltv", "totalSpent", "totalEarned"].includes(sortBy);
    if (sortInMemory) {
      orderBy = { createdAt: "desc" };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: sortInMemory ? 0 : (page - 1) * limit,
        take: sortInMemory ? undefined : limit,
        orderBy,
        include: {
          _count: {
            select: {
              uploadedLeads: true,
              purchasedLeads: true,
              transactions: true,
            },
          },
          transactions: {
            select: {
              amount: true,
              type: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Обрабатываем данные и вычисляем LTV
    let processedUsers = users.map((u) => {
      // Считаем потраченное (покупки) и заработанное (продажи)
      const totalSpent = u.transactions
        .filter(t => t.type === "purchase")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      const totalEarned = u.transactions
        .filter(t => t.type === "sale_reward")
        .reduce((sum, t) => sum + t.amount, 0);
      
      const ltv = totalSpent + totalEarned;

      return {
        id: u.id,
        telegramId: u.telegramId,
        username: u.username,
        fullName: u.fullName,
        role: u.role,
        balance: u.balance,
        rating: (u as any).rating || 5.0,
        totalSales: (u as any).totalSales || 0,
        createdAt: u.createdAt.toISOString(),
        uploadsCount: u._count.uploadedLeads,
        purchasesCount: u._count.purchasedLeads,
        transactionsCount: u._count.transactions,
        totalSpent,
        totalEarned,
        ltv,
      };
    });

    // Сортировка в памяти для LTV полей
    if (sortInMemory) {
      processedUsers.sort((a, b) => {
        const aVal = (a as any)[sortBy] || 0;
        const bVal = (b as any)[sortBy] || 0;
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      });
      
      // Применяем пагинацию после сортировки
      const start = (page - 1) * limit;
      processedUsers = processedUsers.slice(start, start + limit);
    }

    return NextResponse.json({
      users: processedUsers,
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

    // Получаем текущего пользователя
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (balance !== undefined) updateData.balance = parseFloat(balance);
    if (role !== undefined) updateData.role = role;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Логируем изменение баланса
    if (balance !== undefined) {
      const diff = parseFloat(balance) - currentUser.balance;
      if (diff !== 0) {
        await prisma.transaction.create({
          data: {
            userId,
            amount: diff,
            type: "admin_adjustment",
            description: `Корректировка баланса администратором (${diff > 0 ? '+' : ''}${diff.toFixed(1)} LC)`,
          },
        });
      }
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
