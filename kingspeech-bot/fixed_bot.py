#!/usr/bin/env python3
"""
Fixed KingSpeech Bot - Solves all Windows + asyncio issues
"""

import logging
import sys
import os

# Import environment configuration first
import env_config

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from telegram.ext import Application, CommandHandler, MessageHandler, filters
from config import TELEGRAM_BOT_TOKEN

# Enable detailed logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

logger = logging.getLogger(__name__)

def start_command(update, context):
    """Start command handler - SYNCHRONOUS VERSION"""
    user = update.effective_user
    chat_id = update.effective_chat.id
    
    logger.info(f"Received /start from user {user.id} in chat {chat_id}")
    logger.info(f"User: {user.first_name} {user.last_name} (@{user.username})")
    
    try:
        # Use synchronous version
        update.message.reply_text(
            "Привет! Бот KingSpeech работает! 🎉\n\n"
            "Доступные команды:\n"
            "/start - Начать работу\n"
            "/help - Помощь\n"
            "/test - Тестовая команда"
        )
        logger.info("Start command reply sent successfully")
    except Exception as e:
        logger.error(f"Error sending start reply: {e}")

def help_command(update, context):
    """Help command handler - SYNCHRONOUS VERSION"""
    user = update.effective_user
    logger.info(f"Received /help from user {user.id}")
    
    try:
        update.message.reply_text(
            "Это тестовый бот KingSpeech.\n\n"
            "Команды:\n"
            "/start - Начать работу\n"
            "/help - Показать эту справку\n"
            "/test - Тестовая команда"
        )
        logger.info("Help command reply sent successfully")
    except Exception as e:
        logger.error(f"Error sending help reply: {e}")

def test_command(update, context):
    """Test command handler - SYNCHRONOUS VERSION"""
    user = update.effective_user
    logger.info(f"Received /test from user {user.id}")
    
    try:
        update.message.reply_text("Тестовая команда работает! ✅")
        logger.info("Test command reply sent successfully")
    except Exception as e:
        logger.error(f"Error sending test reply: {e}")

def handle_message(update, context):
    """Handle all text messages - SYNCHRONOUS VERSION"""
    user = update.effective_user
    text = update.message.text
    
    logger.info(f"Received message from user {user.id}: {text}")
    
    try:
        update.message.reply_text(f"Вы написали: {text}")
        logger.info("Message reply sent successfully")
    except Exception as e:
        logger.error(f"Error sending message reply: {e}")

def error_handler(update, context):
    """Handle errors"""
    logger.error(f"Exception while handling an update: {context.error}")
    logger.error(f"Update: {update}")

def main():
    """Main function - SYNCHRONOUS VERSION"""
    logger.info("Starting KingSpeech Bot...")
    logger.info(f"Token: {TELEGRAM_BOT_TOKEN[:10]}...")
    
    try:
        # Create application
        app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
        logger.info("Application created successfully")
        
        # Add handlers
        app.add_handler(CommandHandler("start", start_command))
        app.add_handler(CommandHandler("help", help_command))
        app.add_handler(CommandHandler("test", test_command))
        app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
        
        # Add error handler
        app.add_error_handler(error_handler)
        
        logger.info("All handlers registered successfully")
        
        logger.info("Bot is starting polling...")
        logger.info("Send /start to your bot to test it!")
        
        # Start polling - SYNCHRONOUS VERSION (no await)
        app.run_polling(drop_pending_updates=True)
        
    except Exception as e:
        logger.error(f"Error in main: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Bot stopped by user")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
