import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            fullName: true,
            telegramId: true,
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Лид не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: lead.id,
      phone: lead.phone,
      comment: lead.comment,
      region: lead.region,
      niche: lead.niche,
      purchaseCount: lead.purchaseCount,
      status: lead.status,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
      owner: lead.owner
        ? {
            id: lead.owner.id,
            username: lead.owner.username,
            fullName: lead.owner.fullName,
            telegramId: lead.owner.telegramId,
          }
        : null,
    });
  } catch (error) {
    console.error("Error in /api/leads/[id]:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}



