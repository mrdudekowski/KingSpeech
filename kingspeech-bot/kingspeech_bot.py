#!/usr/bin/env python3
"""
KingSpeech Bot (@kingspeechbot) - Fixed for Windows
"""

import logging
import sys
import os
from typing import Callable, Dict, Optional

# Import environment configuration first
import env_config

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, filters, ContextTypes
from config import TELEGRAM_BOT_TOKEN
from telegram import InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardMarkup
from telegram import Update

# Dialog system
from cursor import Context, Step
from services.dialog_manager import dialog_manager
from dialogs import load_all_dialogs

# Enable detailed logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

logger = logging.getLogger(__name__)

# Simple per-user dialog contexts and step progression
user_contexts: Dict[int, Context] = {}
user_next_step: Dict[int, Optional[Callable]] = {}

LANGUAGE_OPTIONS = {
    "ru": "🇷🇺 Русский",
    "en": "🇬🇧 English",
}

def build_language_keyboard() -> InlineKeyboardMarkup:
    keyboard = [
        [InlineKeyboardButton(text=LANGUAGE_OPTIONS["ru"], callback_data="set_lang|ru")],
        [InlineKeyboardButton(text=LANGUAGE_OPTIONS["en"], callback_data="set_lang|en")],
    ]
    return InlineKeyboardMarkup(keyboard)

async def start_command(update, context):
    """Start command handler - ASYNC VERSION"""
    user = update.effective_user
    chat_id = update.effective_chat.id
    
    logger.info(f"Received /start from user {user.id} in chat {chat_id}")
    logger.info(f"User: {user.first_name} {user.last_name} (@{user.username})")
    
    try:
        # Reset any existing session
        dialog_manager.reset_user(str(user.id))
        if user.id in user_contexts:
            user_contexts.pop(user.id, None)
        if user.id in user_next_step:
            user_next_step.pop(user_id, None)
        
        # Create new context and session
        user_contexts[user.id] = Context(telegram=update.effective_user)
        
        # Start the main survey directly - it will handle language selection if needed
        step = dialog_manager.start_branch(str(user.id), "main_survey", user_contexts[user.id])
        if step and step.next_step is not None:
            await send_step_message(update, context, step)
        else:
            # Language not selected, show language selection
            await update.message.reply_text(
                "Пожалуйста, выберите язык интерфейса:",
                reply_markup=build_language_keyboard(),
            )
        logger.info("Start command reply sent successfully")
    except Exception as e:
        logger.error(f"Error sending start reply: {e}")

async def help_command(update, context):
    """Help command handler - ASYNC VERSION"""
    user = update.effective_user
    logger.info(f"Received /help from user {user.id}")
    
    try:
        help_text = (
            "🤖 **KingSpeech Bot - Помощь**\n\n"
            "**Доступные команды:**\n"
            "/start - Начать опрос для подбора курса\n"
            "/help - Показать это сообщение\n"
            "/trash - Очистить данные и начать заново\n\n"
            "**Как это работает:**\n"
            "1. Выберите язык интерфейса\n"
            "2. Пройдите короткий опрос (7 вопросов)\n"
            "3. Получите персональные рекомендации\n\n"
            "**Поддержка:**\n"
            "Если у вас возникли вопросы, обратитесь к менеджеру."
        )
        await update.message.reply_text(help_text, parse_mode='Markdown')
        logger.info("Help command reply sent successfully")
    except Exception as e:
        logger.error(f"Error sending help reply: {e}")

async def test_command(update, context):
    """Test command handler - ASYNC VERSION"""
    user = update.effective_user
    logger.info(f"Received /test from user {user.id}")
    
    try:
        await update.message.reply_text("KingSpeech Bot работает корректно! ✅")
        logger.info("Test command reply sent successfully")
    except Exception as e:
        logger.error(f"Error sending test reply: {e}")

async def trash_command(update, context):
    """Reset user state"""
    try:
        user_id = update.effective_user.id
        dialog_manager.reset_user(str(user_id))
        if user_id in user_contexts:
            user_contexts.pop(user_id, None)
        if user_id in user_next_step:
            user_next_step.pop(user_id, None)
        await update.message.reply_text(
            "Хорошо, давайте начнем сначала!\nОтправьте /start, чтобы начать новый диалог."
        )
    except Exception as e:
        logging.exception(e)

async def handle_message(update, context):
    """Handle all text messages and contacts - ASYNC VERSION"""
    user = update.effective_user
    text = update.message.text or ""
    contact = update.message.contact
    logger.info(f"Received message from user {user.id}: {text}")

    # Ensure context exists
    if user.id not in user_contexts:
        user_contexts[user.id] = Context(telegram=update.effective_user)
    current_context = user_contexts[user.id]
    
    # Handle contact sharing
    if contact:
        logger.info(f"Received contact from user {user.id}: {contact.phone_number}")
        # Set contact in context for dialog processing
        current_context.contact = contact
        current_context.set_user_message(contact.phone_number)
    else:
        current_context.set_user_message(text)

    # Check if user has an active dialog session (started with /start)
    active_branch = dialog_manager.get_active_branch(str(user.id))
    if not active_branch:
        # No active session - ignore message (don't respond)
        logger.info(f"User {user.id} has no active session - ignoring message")
        return
    
    # Check if dialog is completed (no next_step)
    next_step = user_next_step.get(user.id)
    if next_step is None:
        # Dialog is completed - clean up and ignore message
        logger.info(f"User {user.id} dialog completed - cleaning up session")
        dialog_manager.end_branch(str(user.id))
        if user.id in user_contexts:
            user_contexts.pop(user.id, None)
        if user.id in user_next_step:
            user_next_step.pop(user.id, None)
        return

    # If we have a pending step, route to it
    if next_step:
        try:
            step = next_step(current_context, choice=text or (contact.phone_number if contact else None))
            if step and hasattr(step, 'message') and step.message:
                await send_step_message(update, context, step)
                return
            else:
                logger.warning(f"next_step returned invalid step for user {user.id}")
        except Exception as e:
            logger.error(f"Error in next_step: {e}")
            # Don't end the dialog on error, just show error message
            await update.message.reply_text("Произошла ошибка. Пожалуйста, попробуйте еще раз или отправьте /start для перезапуска.")
            return

    # Route to active branch - only if we don't have a pending step
    branch = dialog_manager.get_branch(active_branch)
    if branch:
        # Don't call entry_point again - let the dialog handle the current step
        # Just send a message to continue the dialog
        await update.message.reply_text("Пожалуйста, продолжите диалог или отправьте /start для перезапуска.")
    else:
        # Clean up invalid state
        dialog_manager.end_branch(str(user.id))
        await update.message.reply_text("Сессия завершена. Отправьте /start, чтобы начать новый диалог.")

async def error_handler(update, context):
    """Handle errors"""
    logger.error(f"Exception while handling an update: {context.error}")
    logger.error(f"Update: {update}")

async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle callback queries"""
    user = update.effective_user
    query = update.callback_query
    await query.answer()

    # Ensure context exists
    if user.id not in user_contexts:
        user_contexts[user.id] = Context(telegram=update.effective_user)
    current_context = user_contexts[user.id]

    data = query.data or ""
    logger.info(f"Received callback from user {user.id}: {data}")

    # Language selection (only allowed if user has started with /start)
    if data.startswith("set_lang|"):
        # Check if user has an active session
        active_branch = dialog_manager.get_active_branch(str(user.id))
        if not active_branch:
            await query.message.reply_text("Отправьте /start, чтобы начать диалог.")
            return
            
        lang = data.split("|", 1)[1]
        if lang not in ("ru", "en"):
            await query.message.reply_text("Неизвестный язык.")
            return
        current_context.set_variable("interface_lang", lang)
        
        # Continue with the main survey - don't end and restart the branch
        branch = dialog_manager.get_branch(active_branch)
        if branch:
            try:
                step = branch.entry_point(current_context)
                if step:
                    await send_step_message(update, context, step)
                else:
                    await query.message.reply_text("Произошла ошибка при запуске опроса.")
            except Exception as e:
                logger.error(f"Error in branch entry point: {e}")
                await query.message.reply_text("Произошла ошибка при запуске опроса.")
        else:
            await query.message.reply_text("Произошла ошибка при запуске опроса.")
        return

    # Start specific branch (only allowed if user has started with /start)
    if data.startswith("start_branch|"):
        # Check if user has an active session
        active_branch = dialog_manager.get_active_branch(str(user.id))
        if not active_branch:
            await query.message.reply_text("Отправьте /start, чтобы начать диалог.")
            return
            
        branch_name = data.split("|", 1)[1]
        step = dialog_manager.start_branch(str(user.id), branch_name, current_context)
        if step:
            await send_step_message(update, context, step)
        else:
            await query.message.reply_text("Произошла ошибка при запуске диалога.")
        return

    # In-branch callback flow
    active_branch = dialog_manager.get_active_branch(str(user.id))
    if not active_branch:
        await query.message.reply_text("Отправьте /start, чтобы начать диалог.")
        return

    branch = dialog_manager.get_branch(active_branch)
    if not branch:
        await query.message.reply_text("Произошла ошибка. Пожалуйста, начните сначала с /start")
        return

    # If we have a pending step, pass the choice
    next_step = user_next_step.get(user.id)
    if next_step:
        try:
            step = next_step(current_context, choice=data)
            await send_step_message(update, context, step)
            return
        except Exception as e:
            logger.error(f"Error in next_step(callback): {e}")
            # Don't end the dialog on error, just show error message
            await query.message.reply_text("Произошла ошибка. Пожалуйста, попробуйте еще раз.")
            return

    # If no pending step, try to get the current step from the branch
    try:
        step = branch.entry_point(current_context)
        if step and hasattr(step, 'message') and step.message:
            await send_step_message(update, context, step)
            return
        else:
            logger.warning(f"Branch entry point returned invalid step for user {user.id}")
    except Exception as e:
        logger.error(f"Error getting branch entry point: {e}")

    # Fallback - if no pending step and no branch entry point, end the dialog
    dialog_manager.end_branch(str(user.id))
    await query.message.reply_text("Диалог завершен. Используйте /start для нового диалога.")

async def send_step_message(update: Update, context: ContextTypes.DEFAULT_TYPE, step: Step) -> None:
    """Render a Step to Telegram with optional inline/reply keyboards"""
    if not step or not hasattr(step, 'message'):
        logger.error("Invalid step object received")
        return
        
    reply_markup = getattr(step, 'reply_markup', None)
    options = getattr(step, 'options', None)
    
    # Persist next_step for progression
    user_id = (update.effective_user.id if update.effective_user else None)
    if user_id is not None:
        next_step = getattr(step, 'next_step', None)
        user_next_step[user_id] = next_step
        
        # If no next_step, the dialog is completed - clean up
        if next_step is None:
            logger.info(f"Dialog completed for user {user_id} - cleaning up")
            # Don't immediately end the branch here, let the user see the completion message

    # If it's a reply keyboard, always send new message
    if isinstance(reply_markup, ReplyKeyboardMarkup):
        if getattr(update, "message", None):
            await update.message.reply_text(text=step.message, reply_markup=reply_markup)
        elif getattr(update, "callback_query", None):
            await update.callback_query.message.reply_text(text=step.message, reply_markup=reply_markup)
        return

    # Inline or simple
    if getattr(update, "callback_query", None):
        # Build inline keyboard from options if needed
        if options and not reply_markup:
            keyboard = [[InlineKeyboardButton(opt, callback_data=opt)] for opt in options]
            reply_markup = InlineKeyboardMarkup(keyboard)
        try:
            await update.callback_query.edit_message_text(text=step.message, reply_markup=reply_markup)
        except Exception:
            await update.callback_query.message.reply_text(text=step.message, reply_markup=reply_markup)
    else:
        if options and not reply_markup:
            keyboard = [[InlineKeyboardButton(opt, callback_data=opt)] for opt in options]
            reply_markup = InlineKeyboardMarkup(keyboard)
        await update.message.reply_text(text=step.message, reply_markup=reply_markup)

def main():
    """Main function - SYNC runner with internal PTB loop"""
    logger.info("Starting KingSpeech Bot (@kingspeechbot)...")
    logger.info(f"Token: {TELEGRAM_BOT_TOKEN[:10]}...")
    
    # Start health check server for Render
    try:
        from health_check import start_health_server
        import threading
        health_thread = threading.Thread(target=start_health_server, daemon=True)
        health_thread.start()
        logger.info("Health check server started")
    except Exception as e:
        logger.warning(f"Could not start health check server: {e}")
    
    try:
        # Load dialog branches (registers in dialog_manager)
        load_all_dialogs()
        app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
        logger.info("Application created successfully")
        app.add_handler(CommandHandler("start", start_command))
        app.add_handler(CommandHandler("help", help_command))
        app.add_handler(CommandHandler("test", test_command))
        app.add_handler(CommandHandler("trash", trash_command))
        app.add_handler(CallbackQueryHandler(handle_callback))
        app.add_handler(MessageHandler((filters.TEXT | filters.CONTACT) & ~filters.COMMAND, handle_message))
        app.add_error_handler(error_handler)
        logger.info("All handlers registered successfully")
        logger.info("Bot is starting polling...")
        logger.info("Send /start to @kingspeechbot to test it!")
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
