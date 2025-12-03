import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leadsQuerySchema } from "@/lib/validations";
import { getLeadPrice, MAX_PURCHASES, getPurchaseStatus } from "@/lib/leadPricing";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = leadsQuerySchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    });

    const type = searchParams.get("type") || "uploaded"; // uploaded или purchased
    const userId = searchParams.get("userId");

    // Получаем пользователя
    let user = userId
      ? await prisma.user.findFirst({ where: { telegramId: userId } })
      : await prisma.user.findFirst({ orderBy: { createdAt: "desc" } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: userId || "demo_user",
          balance: 0,
        },
      });
    }

    const skip = (params.page - 1) * params.limit;

    if (type === "uploaded") {
      // Загруженные лиды (я их владелец)
      const [leads, total] = await Promise.all([
        prisma.lead.findMany({
          where: { ownerId: user.id },
          orderBy: { createdAt: "desc" },
          skip,
          take: params.limit,
        }),
        prisma.lead.count({
          where: { ownerId: user.id },
        }),
      ]);

      return NextResponse.json({
        leads: leads.map((lead) => {
          const status = getPurchaseStatus(lead.purchaseCount);
          const nextPrice = getLeadPrice(lead.purchaseCount);
          
          return {
            id: lead.id,
            phone: lead.phone,
            region: lead.region,
            niche: lead.niche,
            purchaseCount: lead.purchaseCount,
            purchaseStatus: status.label,
            isUnique: status.isUnique,
            isArchived: lead.isArchived,
            ownerReward: lead.ownerReward,
            nextPrice: nextPrice,
            status: lead.status,
            createdAt: lead.createdAt.toISOString(),
          };
        }),
        total,
        stats: {
          totalUploaded: total,
          totalReward: leads.reduce((sum, l) => sum + l.ownerReward, 0),
          inMarket: leads.filter(l => l.status === "in_market").length,
          archived: leads.filter(l => l.isArchived).length,
        },
      });
    } else {
      // Купленные лиды
      const [purchases, total] = await Promise.all([
        prisma.leadPurchase.findMany({
          where: { buyerId: user.id },
          include: { lead: true },
          orderBy: { createdAt: "desc" },
          skip,
          take: params.limit,
        }),
        prisma.leadPurchase.count({
          where: { buyerId: user.id },
        }),
      ]);

      return NextResponse.json({
        leads: purchases.map((purchase) => ({
          id: purchase.lead.id,
          phone: purchase.lead.phone, // Полный номер для купленных
          region: purchase.lead.region,
          niche: purchase.lead.niche,
          pricePaid: purchase.price,
          purchaseNum: purchase.purchaseNum,
          purchasedAt: purchase.createdAt.toISOString(),
          createdAt: purchase.lead.createdAt.toISOString(),
        })),
        total,
        stats: {
          totalPurchased: total,
          totalSpent: purchases.reduce((sum, p) => sum + p.price, 0),
        },
      });
    }
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Неверные данные запроса" },
        { status: 400 }
      );
    }
    console.error("Error in /api/leads/my:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
