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

    const niche = searchParams.get("niche");
    const region = searchParams.get("region");
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

    // Лиды в маркетплейсе (in_market), не архивные, не свои
    const whereCondition: any = {
      status: "in_market",
      isArchived: false,
      purchaseCount: { lt: MAX_PURCHASES },
      OR: [
        { ownerId: { not: user.id } },
        { ownerId: null },
      ],
    };

    if (niche) {
      whereCondition.niche = niche;
    }
    if (region) {
      whereCondition.region = region;
    }

    // Исключаем уже купленные этим пользователем
    const purchasedLeadIds = await prisma.leadPurchase.findMany({
      where: { buyerId: user.id },
      select: { leadId: true },
    });
    
    if (purchasedLeadIds.length > 0) {
      whereCondition.id = {
        notIn: purchasedLeadIds.map(p => p.leadId),
      };
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where: whereCondition,
        orderBy: [
          { purchaseCount: "asc" }, // Сначала уникальные
          { createdAt: "desc" },
        ],
        skip,
        take: params.limit,
      }),
      prisma.lead.count({
        where: whereCondition,
      }),
    ]);

    return NextResponse.json({
      leads: leads.map((lead) => {
        const price = getLeadPrice(lead.purchaseCount) || 0;
        const status = getPurchaseStatus(lead.purchaseCount);
        
        return {
          id: lead.id,
          phone: lead.phone.slice(0, -4) + "****", // Маскируем последние 4 цифры
          region: lead.region,
          niche: lead.niche,
          comment: lead.comment, // Описание лида
          price: price,
          purchaseCount: lead.purchaseCount,
          purchaseStatus: status.label,
          isUnique: status.isUnique,
          remaining: status.remaining,
          createdAt: lead.createdAt.toISOString(),
        };
      }),
      total,
      userBalance: user.balance,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Неверные данные запроса" },
        { status: 400 }
      );
    }
    console.error("Error in /api/leads/market:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
