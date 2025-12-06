import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createReviewSchema = z.object({
  sellerId: z.string(),
  buyerId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  leadId: z.string().optional(),
});

// Получить отзывы о продавце
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sellerId = searchParams.get("sellerId");

    if (!sellerId) {
      return NextResponse.json(
        { error: "sellerId обязателен" },
        { status: 400 }
      );
    }

    const reviews = await prisma.sellerReview.findMany({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
      include: {
        buyer: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    // Получаем статистику продавца
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        rating: true,
        totalSales: true,
        username: true,
        fullName: true,
      },
    });

    return NextResponse.json({
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        buyer: {
          username: r.buyer.username,
          fullName: r.buyer.fullName,
        },
      })),
      seller: {
        rating: seller?.rating || 5.0,
        totalSales: seller?.totalSales || 0,
        username: seller?.username,
        fullName: seller?.fullName,
      },
      total: reviews.length,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки отзывов" },
      { status: 500 }
    );
  }
}

// Создать отзыв
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createReviewSchema.parse(body);

    // Проверяем, что покупатель существует
    const buyer = await prisma.user.findFirst({
      where: { telegramId: data.buyerId },
    });

    if (!buyer) {
      return NextResponse.json(
        { error: "Покупатель не найден" },
        { status: 404 }
      );
    }

    // Проверяем, что продавец существует
    const seller = await prisma.user.findUnique({
      where: { id: data.sellerId },
    });

    if (!seller) {
      return NextResponse.json(
        { error: "Продавец не найден" },
        { status: 404 }
      );
    }

    // Проверяем, что покупатель покупал у этого продавца
    const hasPurchased = await prisma.leadPurchase.findFirst({
      where: {
        buyerId: buyer.id,
        lead: {
          ownerId: seller.id,
        },
      },
    });

    if (!hasPurchased) {
      return NextResponse.json(
        { error: "Вы не покупали лиды у этого продавца" },
        { status: 403 }
      );
    }

    // Проверяем, нет ли уже отзыва
    const existingReview = await prisma.sellerReview.findFirst({
      where: {
        sellerId: data.sellerId,
        buyerId: buyer.id,
        leadId: data.leadId || null,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "Вы уже оставили отзыв" },
        { status: 400 }
      );
    }

    // Создаём отзыв
    const review = await prisma.sellerReview.create({
      data: {
        sellerId: data.sellerId,
        buyerId: buyer.id,
        rating: data.rating,
        comment: data.comment,
        leadId: data.leadId,
      },
    });

    // Обновляем рейтинг продавца (среднее)
    const allReviews = await prisma.sellerReview.findMany({
      where: { sellerId: data.sellerId },
      select: { rating: true },
    });

    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.user.update({
      where: { id: data.sellerId },
      data: { rating: Math.round(avgRating * 10) / 10 },
    });

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
      },
    });
  } catch (error) {
    console.error("Error creating review:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Неверные данные" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Ошибка создания отзыва" },
      { status: 500 }
    );
  }
}

