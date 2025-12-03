"""
HTTP API сервер для бота
Позволяет отправлять уведомления через HTTP запросы из Next.js
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from main import notify_lead_upload, notify_lead_purchase
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Telegram Bot API")


class UploadNotification(BaseModel):
    telegram_id: str
    total_valid: int
    points_credited: int


class PurchaseNotification(BaseModel):
    telegram_id: str
    lead_phone: str
    price: int
    new_balance: int


@app.post("/notify/upload")
async def notify_upload(data: UploadNotification):
    """Эндпоинт для отправки уведомления о загрузке лидов"""
    try:
        await notify_lead_upload(
            data.telegram_id, data.total_valid, data.points_credited
        )
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/notify/purchase")
async def notify_purchase(data: PurchaseNotification):
    """Эндпоинт для отправки уведомления о покупке лида"""
    try:
        await notify_lead_purchase(
            data.telegram_id, data.lead_phone, data.price, data.new_balance
        )
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok"}


if __name__ == "__main__":
    port = int(os.getenv("BOT_API_PORT", "8001"))
    uvicorn.run(app, host="0.0.0.0", port=port)





