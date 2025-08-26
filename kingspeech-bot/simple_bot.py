#!/usr/bin/env python3
"""
Simple KingSpeech Bot without complex asyncio
"""

import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from telegram.ext import Application, CommandHandler
from config import TELEGRAM_BOT_TOKEN

def start_command(update, context):
    """Simple start command"""
    update.message.reply_text("Привет! Бот KingSpeech работает! 🎉")

def main():
    """Main function"""
    print("Starting KingSpeech Bot...")
    
    # Create application
    app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    
    # Add handler
    app.add_handler(CommandHandler("start", start_command))
    
    print("Bot is starting...")
    print("Send /start to your bot to test it!")
    
    # Start polling
    app.run_polling(drop_pending_updates=True)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nBot stopped by user")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
