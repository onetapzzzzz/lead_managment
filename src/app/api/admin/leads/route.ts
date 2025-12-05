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
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { phone: { contains: search } },
        { region: { contains: search } },
        { niche: { contains: search } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          owner: {
            select: { username: true, fullName: true, telegramId: true },
          },
          purchases: {
            include: {
              buyer: {
                select: { username: true, fullName: true, telegramId: true },
              },
            },
          },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    return NextResponse.json({
      leads,
      total,
      pages: Math.ceil(total / limit),
      page,
    });
  } catch (error) {
    console.error("Admin leads error:", error);
    return NextResponse.json(
      { error: "Ошибка получения лидов" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { leadId, status, isArchived } = await request.json();

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (isArchived !== undefined) updateData.isArchived = isArchived;

    const lead = await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
    });

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("Admin update lead error:", error);
    return NextResponse.json(
      { error: "Ошибка обновления лида" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get("id");

    if (!leadId) {
      return NextResponse.json({ error: "Lead ID required" }, { status: 400 });
    }

    // Удаляем связанные покупки
    await prisma.leadPurchase.deleteMany({ where: { leadId } });
    
    // Удаляем связанные транзакции
    await prisma.transaction.deleteMany({ where: { leadId } });

    // Удаляем лид
    await prisma.lead.delete({ where: { id: leadId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin delete lead error:", error);
    return NextResponse.json(
      { error: "Ошибка удаления лида" },
      { status: 500 }
    );
  }
}

