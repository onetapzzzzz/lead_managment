/**
 * Прокси для отправки уведомлений через Python бота
 * Используется из Next.js API endpoints
 */

import { NextRequest, NextResponse } from "next/server";

const BOT_API_URL = process.env.BOT_API_URL || "http://localhost:8001";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...data } = body;

    const endpoint =
      type === "upload" ? "/notify/upload" : "/notify/purchase";

    const response = await fetch(`${BOT_API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Bot API error: ${response.statusText}`);
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Error sending bot notification:", error);
    // Не прерываем выполнение, если уведомление не отправилось
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}





