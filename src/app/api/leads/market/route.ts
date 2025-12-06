import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLeadPrice, MAX_PURCHASES, getPurchaseStatus } from "@/lib/leadPricing";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Параметры пагинации
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Параметры фильтрации
    const userId = searchParams.get("userId");
    const subcategory = searchParams.get("subcategory");
    const region = searchParams.get("region");
    const city = searchParams.get("city");
    const priceFrom = parseFloat(searchParams.get("priceFrom") || "0");
    const priceTo = parseFloat(searchParams.get("priceTo") || "999999");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const uniqueness = searchParams.get("uniqueness"); // "unique", "1", "2"
    const condition = searchParams.get("condition"); // "new", "secondary"

    // Параметры сортировки
    const sortBy = searchParams.get("sortBy") || "newest";

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

    // Базовое условие: лиды в маркетплейсе, не архивные, не свои
    const whereCondition: any = {
      status: "in_market",
      isArchived: false,
      purchaseCount: { lt: MAX_PURCHASES },
      OR: [
        { ownerId: { not: user.id } },
        { ownerId: null },
      ],
    };

    // Фильтр по подкатегории
    if (subcategory) {
      whereCondition.niche = { contains: subcategory };
    }

    // Фильтр по региону (область)
    if (region) {
      whereCondition.region = region;
    }

    // Фильтр по городу (если добавлено поле city в будущем)
    if (city) {
      whereCondition.city = city;
    }

    // Фильтр по дате добавления
    if (dateFrom) {
      whereCondition.createdAt = { 
        ...whereCondition.createdAt,
        gte: new Date(dateFrom) 
      };
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      whereCondition.createdAt = { 
        ...whereCondition.createdAt,
        lte: endDate 
      };
    }

    // Фильтр по уникальности
    if (uniqueness === "unique") {
      whereCondition.purchaseCount = 0;
    } else if (uniqueness === "1") {
      whereCondition.purchaseCount = 1;
    } else if (uniqueness === "2") {
      whereCondition.purchaseCount = 2;
    }

    // Фильтр по состоянию (новый/вторичка)
    if (condition === "new") {
      whereCondition.purchaseCount = 0;
    } else if (condition === "secondary") {
      whereCondition.purchaseCount = { gt: 0, lt: MAX_PURCHASES };
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

    // Определяем сортировку
    let orderBy: any = [];
    switch (sortBy) {
      case "newest":
        orderBy = [{ createdAt: "desc" }];
        break;
      case "oldest":
        orderBy = [{ createdAt: "asc" }];
        break;
      case "price_high":
        orderBy = [{ purchaseCount: "asc" }]; // Меньше покупок = дороже
        break;
      case "price_low":
        orderBy = [{ purchaseCount: "desc" }]; // Больше покупок = дешевле
        break;
      case "bought_1":
        whereCondition.purchaseCount = 1;
        orderBy = [{ createdAt: "desc" }];
        break;
      case "bought_2":
        whereCondition.purchaseCount = 2;
        orderBy = [{ createdAt: "desc" }];
        break;
      default:
        orderBy = [{ createdAt: "desc" }];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where: whereCondition,
        orderBy,
        skip,
        take: limit,
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              fullName: true,
              rating: true,
              totalSales: true,
            },
          },
        },
      }),
      prisma.lead.count({
        where: whereCondition,
      }),
    ]);

    // Фильтруем по цене на уровне приложения (цена динамическая)
    const leadsWithPrice = leads.map((lead) => {
      const price = getLeadPrice(lead.purchaseCount) || 0;
      const status = getPurchaseStatus(lead.purchaseCount);
      
      return {
        id: lead.id,
        phone: lead.phone.slice(0, -4) + "****", // Маскируем последние 4 цифры
        region: lead.region,
        city: (lead as any).city || null,
        niche: lead.niche,
        subcategory: lead.niche?.replace("Окна: ", "") || "Окна",
        comment: lead.comment,
        price,
        priceRub: Math.round(price * 100), // Примерный курс: 1 LC = 100 руб
        purchaseCount: lead.purchaseCount,
        purchaseStatus: status.label,
        isUnique: status.isUnique,
        remaining: status.remaining,
        condition: lead.purchaseCount === 0 ? "new" : "secondary",
        createdAt: lead.createdAt.toISOString(),
        seller: lead.owner ? {
          id: lead.owner.id,
          username: lead.owner.username,
          name: lead.owner.fullName || lead.owner.username || "Продавец",
          rating: lead.owner.rating || 5.0,
          sales: lead.owner.totalSales || 0,
        } : null,
      };
    });

    // Дополнительная фильтрация по цене
    const filteredLeads = leadsWithPrice.filter((lead) => {
      return lead.price >= priceFrom && lead.price <= priceTo;
    });

    return NextResponse.json({
      leads: filteredLeads,
      total: filteredLeads.length,
      totalInDb: total,
      userBalance: user.balance,
      userBalanceRub: Math.round(user.balance * 100),
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error in /api/leads/market:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
