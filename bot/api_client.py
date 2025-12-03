"""
API клиент для отправки уведомлений через бота
Используется из Next.js API endpoints
"""

import asyncio
import os
from typing import Optional
import httpx
from dotenv import load_dotenv

load_dotenv()

BOT_API_URL = os.getenv("BOT_API_URL", "http://localhost:8001")
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "7770656216:AAEDsd1gN-xoMOBSGzB9QGTm4kUJvikPKek")


async def notify_lead_upload(telegram_id: str, total_valid: int, points_credited: int):
    """Отправляет уведомление о загрузке лидов через HTTP API бота"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BOT_API_URL}/notify/upload",
                json={
                    "telegram_id": telegram_id,
                    "total_valid": total_valid,
                    "points_credited": points_credited,
                },
                timeout=5.0,
            )
            return response.status_code == 200
    except Exception as e:
        print(f"Error sending notification: {e}")
        return False


async def notify_lead_purchase(
    telegram_id: str, lead_phone: str, price: int, new_balance: int
):
    """Отправляет уведомление о покупке лида через HTTP API бота"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BOT_API_URL}/notify/purchase",
                json={
                    "telegram_id": telegram_id,
                    "lead_phone": lead_phone,
                    "price": price,
                    "new_balance": new_balance,
                },
                timeout=5.0,
            )
            return response.status_code == 200
    except Exception as e:
        print(f"Error sending notification: {e}")
        return False


# Синхронные обёртки для использования из Next.js
def notify_lead_upload_sync(telegram_id: str, total_valid: int, points_credited: int):
    """Синхронная обёртка для notify_lead_upload"""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(
        notify_lead_upload(telegram_id, total_valid, points_credited)
    )


def notify_lead_purchase_sync(
    telegram_id: str, lead_phone: str, price: int, new_balance: int
):
    """Синхронная обёртка для notify_lead_purchase"""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(
        notify_lead_purchase(telegram_id, lead_phone, price, new_balance)
    )

