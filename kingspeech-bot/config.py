# config.py
import os
from dotenv import load_dotenv

load_dotenv()

# Все настройки через переменные окружения
SPREADSHEET_ID = os.getenv("SPREADSHEET_ID")
SHEET_NAME = os.getenv("SHEET_NAME", "KingSpeechLeads")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

def _parse_chat_id(val):
    if val is None:
        return None
    try:
        return int(val)
    except Exception:
        return val  # allow strings like '@channelusername'

MANAGER_CHAT_ID = _parse_chat_id(os.getenv("MANAGER_CHAT_ID"))

# Настройки для пересылки лидов в чат рабочей группы (fallback на MANAGER_CHAT_ID)
WORKGROUP_CHAT_ID = _parse_chat_id(os.getenv("WORKGROUP_CHAT_ID") or os.getenv("MANAGER_CHAT_ID"))  # Chat ID рабочей группы

# Валидация обязательных переменных
if not TELEGRAM_BOT_TOKEN:
    raise ValueError("TELEGRAM_BOT_TOKEN не установлен в переменных окружения")
if not SPREADSHEET_ID:
    raise ValueError("SPREADSHEET_ID не установлен в переменных окружения")