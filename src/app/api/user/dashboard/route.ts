import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
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

    const [
      totalUploaded,
      totalPurchased,
      totalInMarket,
      recentUploads,
    ] = await Promise.all([
      prisma.lead.count({
        where: { ownerId: user.id },
      }),
      prisma.leadPurchase.count({
        where: { buyerId: user.id },
      }),
      prisma.lead.count({
        where: { status: "in_market" },
      }),
      prisma.lead.findMany({
        where: { ownerId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalUploaded,
        totalPurchased,
        totalInMarket,
        currentBalance: user.balance,
        conversionRate: totalUploaded > 0 ? (totalPurchased / totalUploaded) * 100 : 0,
      },
      recentUploads: recentUploads.map((lead) => ({
        id: lead.id,
        phone: lead.phone,
        region: lead.region,
        status: lead.status,
        createdAt: lead.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error in /api/user/dashboard:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}




