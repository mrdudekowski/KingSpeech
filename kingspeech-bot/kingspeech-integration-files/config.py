# config.py
import os
from dotenv import load_dotenv

load_dotenv()

# Все настройки через переменные окружения
SPREADSHEET_ID = os.getenv("SPREADSHEET_ID")
SHEET_NAME = os.getenv("SHEET_NAME", "KingSpeechLeads")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
MANAGER_CHAT_ID = int(os.getenv("MANAGER_CHAT_ID", "0"))

# Валидация обязательных переменных
if not TELEGRAM_BOT_TOKEN:
    raise ValueError("TELEGRAM_BOT_TOKEN не установлен в переменных окружения")
if not SPREADSHEET_ID:
    raise ValueError("SPREADSHEET_ID не установлен в переменных окружения")