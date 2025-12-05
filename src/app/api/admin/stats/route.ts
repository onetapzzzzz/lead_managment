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
    // Общая статистика
    const [
      totalUsers,
      totalLeads,
      totalTransactions,
      leadsInMarket,
      archivedLeads,
      totalPurchases,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.lead.count(),
      prisma.transaction.count(),
      prisma.lead.count({ where: { status: "in_market" } }),
      prisma.lead.count({ where: { isArchived: true } }),
      prisma.leadPurchase.count(),
    ]);

    // Статистика за последние 24 часа
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [
      newUsersToday,
      newLeadsToday,
      purchasesToday,
      transactionsToday,
    ] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: last24h } } }),
      prisma.lead.count({ where: { createdAt: { gte: last24h } } }),
      prisma.leadPurchase.count({ where: { createdAt: { gte: last24h } } }),
      prisma.transaction.count({ where: { createdAt: { gte: last24h } } }),
    ]);

    // Статистика за последние 7 дней
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [
      newUsersWeek,
      newLeadsWeek,
      purchasesWeek,
    ] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: last7d } } }),
      prisma.lead.count({ where: { createdAt: { gte: last7d } } }),
      prisma.leadPurchase.count({ where: { createdAt: { gte: last7d } } }),
    ]);

    // Сумма балансов
    const balanceAgg = await prisma.user.aggregate({
      _sum: { balance: true },
    });

    // Статистика по статусам лидов
    const leadsByStatus = await prisma.lead.groupBy({
      by: ["status"],
      _count: true,
    });

    // Топ пользователей по загрузкам
    const topUploaders = await prisma.user.findMany({
      take: 5,
      orderBy: {
        uploadedLeads: { _count: "desc" },
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        telegramId: true,
        balance: true,
        _count: {
          select: { uploadedLeads: true },
        },
      },
    });

    // Топ покупателей
    const topBuyers = await prisma.user.findMany({
      take: 5,
      orderBy: {
        purchasedLeads: { _count: "desc" },
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        telegramId: true,
        balance: true,
        _count: {
          select: { purchasedLeads: true },
        },
      },
    });

    // Последние транзакции
    const recentTransactions = await prisma.transaction.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { username: true, fullName: true, telegramId: true },
        },
      },
    });

    return NextResponse.json({
      overview: {
        totalUsers,
        totalLeads,
        totalTransactions,
        leadsInMarket,
        archivedLeads,
        totalPurchases,
        totalBalance: balanceAgg._sum.balance || 0,
      },
      today: {
        newUsers: newUsersToday,
        newLeads: newLeadsToday,
        purchases: purchasesToday,
        transactions: transactionsToday,
      },
      week: {
        newUsers: newUsersWeek,
        newLeads: newLeadsWeek,
        purchases: purchasesWeek,
      },
      leadsByStatus: leadsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      topUploaders: topUploaders.map((u) => ({
        ...u,
        uploadsCount: u._count.uploadedLeads,
      })),
      topBuyers: topBuyers.map((u) => ({
        ...u,
        purchasesCount: u._count.purchasedLeads,
      })),
      recentTransactions,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Ошибка получения статистики" },
      { status: 500 }
    );
  }
}

