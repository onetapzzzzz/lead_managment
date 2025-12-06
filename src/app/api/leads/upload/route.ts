import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const leadUploadSchema = z.object({
  phone: z.string().regex(/^\+7\d{10}$/, "Телефон должен быть в формате +7XXXXXXXXXX"),
  name: z.string().min(2, "Имя должно быть минимум 2 символа"),
  comment: z.string().min(10, "Комментарий должен быть минимум 10 символов"),
  region: z.string().optional(),
  niche: z.string().optional(),
  userId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = leadUploadSchema.parse(body);

    // Получаем пользователя по telegramId
    let user = data.userId
      ? await prisma.user.findFirst({ where: { telegramId: data.userId } })
      : await prisma.user.findFirst({ orderBy: { createdAt: "desc" } });

    if (!user) {
      if (data.userId) {
        user = await prisma.user.create({
          data: {
            telegramId: data.userId,
            balance: 5, // Начальный баланс
          },
        });
      } else {
        return NextResponse.json(
          { error: "Требуется авторизация" },
          { status: 401 }
        );
      }
    }

    // Проверяем на дубликат
    const existingLead = await prisma.lead.findFirst({
      where: { phone: data.phone },
    });

    if (existingLead) {
      return NextResponse.json(
        { error: "Этот номер уже существует в базе" },
        { status: 400 }
      );
    }

    // Формируем комментарий с именем
    const fullComment = `👤 ${data.name}\n${data.comment}`;

    const lead = await prisma.lead.create({
      data: {
        phone: data.phone,
        name: data.name,
        comment: fullComment,
        region: data.region,
        niche: data.niche || "Окна",
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
      name: (lead as any).name,
      comment: lead.comment,
      region: lead.region,
      niche: lead.niche,
      purchaseCount: lead.purchaseCount,
      createdAt: lead.createdAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return NextResponse.json(
        { error: firstError.message },
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
