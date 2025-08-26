#!/usr/bin/env python3
"""
Debug bot with detailed logging
"""

import logging
import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from telegram.ext import Application, CommandHandler
from config import TELEGRAM_BOT_TOKEN

# Enable debug logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.DEBUG
)

def start_command(update, context):
    """Start command handler"""
    print(f"Received /start from user {update.effective_user.id}")
    print(f"User: {update.effective_user.first_name} {update.effective_user.last_name}")
    print(f"Username: {update.effective_user.username}")
    
    try:
        update.message.reply_text("Привет! Бот KingSpeech работает! 🎉")
        print("Reply sent successfully")
    except Exception as e:
        print(f"Error sending reply: {e}")

def help_command(update, context):
    """Help command handler"""
    print(f"Received /help from user {update.effective_user.id}")
    update.message.reply_text("Это тестовый бот KingSpeech. Используйте /start для начала.")

def main():
    """Main function"""
    print("Starting Debug KingSpeech Bot...")
    print(f"Token: {TELEGRAM_BOT_TOKEN[:10]}...")
    
    try:
        # Create application
        app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
        print("Application created successfully")
        
        # Add handlers
        app.add_handler(CommandHandler("start", start_command))
        app.add_handler(CommandHandler("help", help_command))
        print("Handlers registered successfully")
        
        print("Bot is starting...")
        print("Send /start to your bot to test it!")
        
        # Start polling
        app.run_polling(drop_pending_updates=True)
        
    except Exception as e:
        print(f"Error in main: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nBot stopped by user")
    except Exception as e:
        print(f"Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
