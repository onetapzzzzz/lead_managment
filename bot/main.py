"""
Telegram Bot для системы управления лидами
Использует aiogram 3.x для работы с Telegram Bot API
Работает через HTTP API Next.js приложения
"""

import asyncio
import os
import secrets
import string
from typing import Optional

from aiogram import Bot, Dispatcher, F
from aiogram.filters import Command, CommandStart
from aiogram.types import (
    InlineKeyboardButton,
    Message,
    CallbackQuery,
    WebAppInfo,
)
from aiogram.utils.keyboard import InlineKeyboardBuilder
import aiohttp
from dotenv import load_dotenv


def generate_cuid():
    """Генерирует CUID-подобный ID"""
    alphabet = string.ascii_lowercase + string.digits
    return 'c' + ''.join(secrets.choice(alphabet) for _ in range(24))


# Загружаем переменные окружения
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'), override=True)

# Конфигурация
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN") or "7778919356:AAH0Uo7WraLEkqHQccEWRZTMm_TrAuRQx9Y"
WEB_APP_URL = os.getenv("WEB_APP_URL", "https://boardtraff.shop")
API_URL = WEB_APP_URL + "/api"

print(f"🤖 Bot Token: {BOT_TOKEN[:20]}...")
print(f"🌐 Web App URL: {WEB_APP_URL}")
print(f"📡 API URL: {API_URL}")

# Инициализация бота и диспетчера
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()


async def api_request(method: str, endpoint: str, data: dict = None):
    """Выполняет запрос к API"""
    url = f"{API_URL}{endpoint}"
    async with aiohttp.ClientSession() as session:
        try:
            if method == "GET":
                async with session.get(url, params=data) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    return None
            elif method == "POST":
                async with session.post(url, json=data) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    return None
        except Exception as e:
            print(f"API Error: {e}")
            return None


async def get_or_create_user(telegram_id: str, username: Optional[str], full_name: Optional[str]):
    """Получает или создаёт пользователя через API"""
    # Сначала пробуем получить пользователя
    result = await api_request("GET", "/user/get", {"userId": telegram_id})
    
    if result and "id" in result:
        return result
    
    # Если не нашли, делаем запрос который создаст пользователя
    # API /user/get автоматически создаёт пользователя если его нет
    result = await api_request("GET", "/user/get", {"userId": telegram_id})
    return result


async def get_user_stats(telegram_id: str):
    """Получает статистику пользователя через API"""
    result = await api_request("GET", "/user/dashboard", {"userId": telegram_id})
    if result and "stats" in result:
        return result["stats"]
    return None


@dp.message(CommandStart())
async def cmd_start(message: Message):
    """Обработчик команды /start"""
    print(f"📨 Received /start from user {message.from_user.id}")
    user = message.from_user
    if not user:
        return

    telegram_id = str(user.id)
    username = user.username
    full_name = f"{user.first_name or ''} {user.last_name or ''}".strip() or None

    try:
        db_user = await get_or_create_user(telegram_id, username, full_name)
        if db_user:
            print(f"✅ User {telegram_id} registered via API")
        else:
            print(f"⚠️ Could not register user {telegram_id}, but continuing...")
    except Exception as e:
        print(f"❌ Error with API: {e}")

    keyboard = InlineKeyboardBuilder()
    app_url = f"{WEB_APP_URL}?tgWebAppStartParam={telegram_id}"
    
    # Главная кнопка - открыть приложение
    if WEB_APP_URL.startswith("https://"):
        keyboard.row(
            InlineKeyboardButton(
                text="🚀 ОТКРЫТЬ ПРИЛОЖЕНИЕ",
                web_app=WebAppInfo(url=app_url)
            )
        )
    else:
        keyboard.row(
            InlineKeyboardButton(
                text="🚀 ОТКРЫТЬ ПРИЛОЖЕНИЕ",
                callback_data=f"open_app_{telegram_id}"
            )
        )
    
    # Каждая кнопка на отдельной строке для большего размера
    keyboard.row(
        InlineKeyboardButton(text="📤 Загрузить лиды", callback_data="upload_leads")
    )
    keyboard.row(
        InlineKeyboardButton(text="🛒 Маркетплейс", callback_data="marketplace")
    )
    keyboard.row(
        InlineKeyboardButton(text="📥 Мои лиды", callback_data="my_leads")
    )
    keyboard.row(
        InlineKeyboardButton(text="📊 Статистика", callback_data="stats"),
        InlineKeyboardButton(text="💰 Баланс", callback_data="balance")
    )

    welcome_text = (
        f"👋 Привет, {user.first_name or 'друг'}!\n\n"
        "Добро пожаловать в систему управления лидами!\n\n"
        "Здесь ты можешь:\n"
        "• Загружать лиды и получать поинты\n"
        "• Покупать лиды на маркетплейсе\n"
        "• Отслеживать статистику и баланс\n\n"
        "Нажми кнопку ниже, чтобы открыть приложение:"
    )
    
    await message.answer(welcome_text, reply_markup=keyboard.as_markup())


@dp.message(Command("help"))
async def cmd_help(message: Message):
    """Обработчик команды /help"""
    help_text = (
        "📚 Справка по боту\n\n"
        "Доступные команды:\n"
        "/start - Начать работу с ботом\n"
        "/help - Показать эту справку\n"
        "/stats - Моя статистика\n"
        "/balance - Мой баланс\n\n"
        "Используй кнопки для навигации!"
    )
    await message.answer(help_text)


@dp.message(Command("stats"))
async def cmd_stats(message: Message):
    """Обработчик команды /stats"""
    telegram_id = str(message.from_user.id)
    stats = await get_user_stats(telegram_id)
    
    if not stats:
        await message.answer("📊 Статистика недоступна. Нажми /start для регистрации.")
        return
    
    stats_text = (
        "📊 Твоя статистика:\n\n"
        f"📤 Загружено лидов: {stats.get('totalUploaded', 0)}\n"
        f"📥 Куплено лидов: {stats.get('totalPurchased', 0)}\n"
        f"🏪 Всего на маркете: {stats.get('totalInMarket', 0)}\n"
        f"💰 Баланс: {stats.get('currentBalance', 0):.2f} поинтов\n"
    )
    await message.answer(stats_text)


@dp.message(Command("balance"))
async def cmd_balance(message: Message):
    """Обработчик команды /balance"""
    telegram_id = str(message.from_user.id)
    user = await api_request("GET", "/user/get", {"userId": telegram_id})
    
    if not user:
        await message.answer("💰 Баланс недоступен. Нажми /start для регистрации.")
        return
    
    balance_text = f"💰 Твой баланс: {user.get('balance', 0):.2f} поинтов"
    await message.answer(balance_text)


@dp.callback_query(F.data.startswith("open_app_"))
async def callback_open_app(callback: CallbackQuery):
    """Обработчик callback для открытия приложения"""
    telegram_id = callback.data.replace("open_app_", "")
    app_url = f"{WEB_APP_URL}?tgWebAppStartParam={telegram_id}"
    
    await callback.message.answer(f"🔗 Открой приложение по ссылке:\n{app_url}")
    await callback.answer()


@dp.callback_query(F.data == "stats")
async def callback_stats(callback: CallbackQuery):
    """Обработчик callback для статистики"""
    telegram_id = str(callback.from_user.id)
    stats = await get_user_stats(telegram_id)
    
    if not stats:
        await callback.answer("Статистика недоступна", show_alert=True)
        return
    
    stats_text = (
        "📊 Твоя статистика:\n\n"
        f"📤 Загружено лидов: {stats.get('totalUploaded', 0)}\n"
        f"📥 Куплено лидов: {stats.get('totalPurchased', 0)}\n"
        f"🏪 Всего на маркете: {stats.get('totalInMarket', 0)}\n"
        f"💰 Баланс: {stats.get('currentBalance', 0):.2f} поинтов\n"
    )
    await callback.message.answer(stats_text)
    await callback.answer()


@dp.callback_query(F.data == "balance")
async def callback_balance(callback: CallbackQuery):
    """Обработчик callback для баланса"""
    telegram_id = str(callback.from_user.id)
    user = await api_request("GET", "/user/get", {"userId": telegram_id})
    
    if not user:
        await callback.answer("Баланс недоступен", show_alert=True)
        return
    
    balance_text = f"💰 Твой баланс: {user.get('balance', 0):.2f} поинтов"
    await callback.message.answer(balance_text)
    await callback.answer()


@dp.callback_query(F.data == "upload_leads")
async def callback_upload_leads(callback: CallbackQuery):
    """Обработчик callback для загрузки лидов"""
    telegram_id = str(callback.from_user.id)
    app_url = f"{WEB_APP_URL}/upload?tgWebAppStartParam={telegram_id}"
    
    keyboard = InlineKeyboardBuilder()
    if WEB_APP_URL.startswith("https://"):
        keyboard.row(
            InlineKeyboardButton(
                text="📤 ЗАГРУЗИТЬ ЛИДЫ",
                web_app=WebAppInfo(url=app_url)
            )
        )
        await callback.message.answer(
            "📤 Загрузи свои лиды и получай поинты за каждую продажу!\n\n"
            "Просто вставь текст с телефонами — мы автоматически их распарсим.",
            reply_markup=keyboard.as_markup()
        )
    else:
        await callback.message.answer(f"🔗 Загрузи лиды по ссылке:\n{app_url}")
    await callback.answer()


@dp.callback_query(F.data == "marketplace")
async def callback_marketplace(callback: CallbackQuery):
    """Обработчик callback для маркетплейса"""
    telegram_id = str(callback.from_user.id)
    app_url = f"{WEB_APP_URL}/market?tgWebAppStartParam={telegram_id}"
    
    keyboard = InlineKeyboardBuilder()
    if WEB_APP_URL.startswith("https://"):
        keyboard.row(
            InlineKeyboardButton(
                text="🛒 ОТКРЫТЬ МАРКЕТПЛЕЙС",
                web_app=WebAppInfo(url=app_url)
            )
        )
        await callback.message.answer(
            "🛒 Маркетплейс лидов\n\n"
            "Покупай качественные лиды от других пользователей.\n"
            "Уникальные лиды дороже, после покупок — дешевле!",
            reply_markup=keyboard.as_markup()
        )
    else:
        await callback.message.answer(f"🔗 Открой маркетплейс по ссылке:\n{app_url}")
    await callback.answer()


@dp.callback_query(F.data == "my_leads")
async def callback_my_leads(callback: CallbackQuery):
    """Обработчик callback для моих лидов"""
    telegram_id = str(callback.from_user.id)
    app_url = f"{WEB_APP_URL}/leads?tgWebAppStartParam={telegram_id}"
    
    keyboard = InlineKeyboardBuilder()
    if WEB_APP_URL.startswith("https://"):
        keyboard.row(
            InlineKeyboardButton(
                text="📥 ПОСМОТРЕТЬ МОИ ЛИДЫ",
                web_app=WebAppInfo(url=app_url)
            )
        )
        await callback.message.answer(
            "📥 Твои лиды\n\n"
            "Здесь ты видишь загруженные и купленные лиды.",
            reply_markup=keyboard.as_markup()
        )
    else:
        await callback.message.answer(f"🔗 Посмотри лиды по ссылке:\n{app_url}")
    await callback.answer()


async def send_notification(telegram_id: str, text: str):
    """Отправляет уведомление пользователю"""
    try:
        await bot.send_message(chat_id=int(telegram_id), text=text)
        return True
    except Exception as e:
        print(f"Error sending notification to {telegram_id}: {e}")
        return False


async def main():
    """Главная функция запуска бота"""
    print("🚀 Starting bot...")
    print(f"📱 Bot token: {BOT_TOKEN[:20]}...")
    print(f"🌐 Web App URL: {WEB_APP_URL}")
    print(f"📡 API URL: {API_URL}")
    
    await bot.delete_webhook(drop_pending_updates=True)
    
    print("✅ Bot is running!")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
