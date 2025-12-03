import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leadUploadSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = leadUploadSchema.parse(body);

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

    const lead = await prisma.lead.create({
      data: {
        phone: data.phone,
        comment: data.comment,
        region: data.region,
        ownerId: user.id,
        status: "in_market",
        purchaseCount: 0,
        isArchived: false,
        ownerReward: 0,
      },
    });

    return NextResponse.json({
      id: lead.id,
      phone: lead.phone,
      comment: lead.comment,
      region: lead.region,
      purchaseCount: lead.purchaseCount,
      createdAt: lead.createdAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Неверные данные запроса" },
        { status: 400 }
      );
    }
    console.error("Error in /api/leads/upload:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
