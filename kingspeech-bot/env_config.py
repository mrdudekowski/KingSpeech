# Environment configuration for KingSpeech Bot (@kingspeechbot)
import os
from dotenv import load_dotenv

# Load from .env file
load_dotenv()

# Get the correct token for @kingspeechbot
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
SPREADSHEET_ID = os.getenv('SPREADSHEET_ID')
SHEET_NAME = os.getenv('SHEET_NAME', 'KingSpeechLeads')
MANAGER_CHAT_ID = os.getenv('MANAGER_CHAT_ID', '310075847')
WORKGROUP_CHAT_ID = os.getenv('WORKGROUP_CHAT_ID')

print("=== KingSpeech Bot Configuration ===")
print(f"Bot: @kingspeechbot")
print(f"TELEGRAM_BOT_TOKEN: {TELEGRAM_BOT_TOKEN[:10]}..." if TELEGRAM_BOT_TOKEN else "NOT SET")
print(f"SPREADSHEET_ID: {SPREADSHEET_ID}")
print(f"SHEET_NAME: {SHEET_NAME}")
print(f"MANAGER_CHAT_ID: {MANAGER_CHAT_ID}")
print(f"WORKGROUP_CHAT_ID: {WORKGROUP_CHAT_ID}")
print("===================================")
