import os
import logging
import sys
import asyncio
import telegram
import re
import datetime
import time
from functools import wraps
from typing import Optional, Callable, Any

# Fix for Windows event loop issues
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardMarkup, KeyboardButton
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, filters, ContextTypes
from telegram.error import TelegramError, NetworkError, RetryAfter, TimedOut
from cursor import Step, Dialog, Context, Variable, GoogleSheets
from config import TELEGRAM_BOT_TOKEN, SPREADSHEET_ID, SHEET_NAME, MANAGER_CHAT_ID

# Import dialog system
from services.dialog_manager import dialog_manager
from dialogs import load_all_dialogs
from services.rate_limiter import message_rate_limiter, callback_rate_limiter, command_rate_limiter

# Import monitoring services
# from services.logger_service import init_logger, get_logger
# from services.metrics_service import init_metrics, get_metrics

# Initialize structured logging and metrics
# structured_logger = init_logger("INFO")
# metrics_service = init_metrics()

# Legacy logging for compatibility
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Глобальные настройки
MAX_RETRIES = 3
RETRY_DELAY = 1.0
RATE_LIMIT_DELAY = 5.0

def retry_on_error(max_retries: int = MAX_RETRIES, delay: float = RETRY_DELAY):
    """Декоратор для повторных попыток при ошибках"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            last_exception = None
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except (NetworkError, TimedOut) as e:
                    last_exception = e
                    if attempt < max_retries - 1:
                        logger.warning(f"Network error in {func.__name__}, attempt {attempt + 1}/{max_retries}: {e}")
                        await asyncio.sleep(delay * (attempt + 1))
                    continue
                except RetryAfter as e:
                    last_exception = e
                    retry_after = e.retry_after or RATE_LIMIT_DELAY
                    logger.warning(f"Rate limit hit in {func.__name__}, waiting {retry_after}s")
                    await asyncio.sleep(retry_after)
                    continue
                except Exception as e:
                    last_exception = e
                    logger.error(f"Unexpected error in {func.__name__}: {e}")
                    break
            
            logger.error(f"Failed after {max_retries} attempts in {func.__name__}: {last_exception}")
            raise last_exception
        return wrapper
    return decorator

def safe_execute(func: Callable) -> Callable:
    """Декоратор для безопасного выполнения функций с обработкой ошибок"""
    @wraps(func)
    async def wrapper(*args, **kwargs) -> Any:
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            logger.error(f"Error in {func.__name__}: {e}", exc_info=True)
            # Отправляем сообщение об ошибке пользователю
            if args and hasattr(args[0], 'message') and args[0].message:
                try:
                    await args[0].message.reply_text(
                        "Произошла ошибка. Пожалуйста, попробуйте позже или начните сначала с /start"
                    )
                except:
                    pass
            return None
    return wrapper

# Инициализация Google Sheets
try:
    sheet = GoogleSheets(SPREADSHEET_ID, SHEET_NAME)
    logger.info("Google Sheets initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Google Sheets: {e}")
    sheet = None

# Создаем диалог
dialog = Dialog()

# Словарь для хранения контекста пользователей
user_contexts = {}

# Глобальная переменная для хранения экземпляра приложения
application = None

# Загружаем все диалоговые ветки
def initialize_dialogs():
    """Initialize all dialog branches"""
    try:
        branches = load_all_dialogs()
        logger.info(f"Initialized {len(branches)} dialog branches")
        return branches
    except Exception as e:
        logger.error(f"Failed to initialize dialogs: {e}")
        return []

# Обработчики команд Telegram
@retry_on_error()
@safe_execute
async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /start command"""
    user_id = update.effective_user.id
    
    # Rate limiting check for commands
    if not command_rate_limiter.is_allowed(user_id):
        cooldown_remaining = command_rate_limiter.get_cooldown_remaining(user_id)
        if cooldown_remaining > 0:
            await update.message.reply_text(
                f"Слишком много команд. Подождите {cooldown_remaining} секунд."
            )
        else:
            await update.message.reply_text(
                "Слишком много команд. Пожалуйста, подождите немного."
            )
        return
    
    logger.info(f"Received /start command from user {user_id}")
    
    if user_id not in user_contexts:
        user_contexts[user_id] = Context(telegram=update.effective_user)
    
    current_context = user_contexts[user_id]
    
    # Show simplified dialog options - only 2 buttons
    message = "Добро пожаловать в KingSpeech! 🎓\n\nВыберите, что вы хотите сделать:"
    keyboard = [
        [InlineKeyboardButton("Начать учиться с King Speech", callback_data="start_branch|main_survey")],
        [InlineKeyboardButton("Пройти тест на знание языка", callback_data="start_branch|quick_test")]
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(message, reply_markup=reply_markup)

@retry_on_error()
@safe_execute
async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /help command"""
    logger.info(f"Received /help command from user {update.effective_user.id}")
    
    message = "Доступные команды:\n\n"
    message += "• Начать учиться с King Speech - основной опрос для подбора курсов\n"
    message += "• Пройти тест на знание языка - быстрый тест уровня английского\n\n"
    message += "Используйте /start для начала работы."
    await update.message.reply_text(message)

@retry_on_error()
@safe_execute
async def trash_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /trash command - reset user state"""
    user_id = update.effective_user.id
    logger.info(f"Received /trash command from user {user_id}")
    
    # Reset dialog manager state
    dialog_manager.reset_user(str(user_id))
    
    # Remove from user contexts
    if user_id in user_contexts:
        del user_contexts[user_id]
        logger.info(f"Deleted context for user {user_id}")
    
    await update.message.reply_text(
        "Хорошо, давайте начнем сначала!\n"
        "Отправьте /start, чтобы начать новый диалог."
    )

@retry_on_error()
@safe_execute
async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle text messages"""
    user_id = update.effective_user.id
    
    # Rate limiting check
    if not message_rate_limiter.is_allowed(user_id):
        cooldown_remaining = message_rate_limiter.get_cooldown_remaining(user_id)
        if cooldown_remaining > 0:
            await update.message.reply_text(
                f"Слишком много сообщений. Подождите {cooldown_remaining} секунд перед следующим сообщением."
            )
        else:
            await update.message.reply_text(
                "Слишком много сообщений. Пожалуйста, подождите немного."
            )
        return
    
    logger.info(f"Received message from user {user_id}: {update.message.text}")
    
    # Create or get user context
    if user_id not in user_contexts:
        logger.info(f"Creating new context for user {user_id}")
        user_contexts[user_id] = Context(telegram=update.effective_user)
    
    current_context = user_contexts[user_id]
    
    # Handle contact sharing
    if hasattr(update.message, 'contact') and update.message.contact:
        phone = update.message.contact.phone_number
        current_context.set_user_message(phone)
    else:
        current_context.set_user_message(update.message.text)
    
    # Check for manual phone input
    user_message = update.message.text or ""
    phone_pattern = r"^(\+7|8)\d{10}$"
    if re.match(phone_pattern, user_message):
        lang = current_context.get_variable('interface_lang', 'ru')
        if lang == 'en':
            await update.message.reply_text(
                'Please use the "Send phone number" 📱 button to share your contact. Manual input is not accepted.'
            )
        else:
            await update.message.reply_text(
                'Пожалуйста, используйте кнопку "Отправить номер телефона" 📱 для передачи контакта. Ввод номера вручную не принимается.'
            )
        return
    
    # Get active dialog branch
    active_branch = dialog_manager.get_active_branch(str(user_id))
    if not active_branch:
        # No active branch, show start options
        await start_command(update, context)
        return
    
    # Get the branch and process the message
    branch = dialog_manager.get_branch(active_branch)
    if not branch:
        await update.message.reply_text("Произошла ошибка. Пожалуйста, начните сначала с /start")
        return
    
    try:
        # Process message through the active branch
        step = branch.entry_point(current_context)
        if step:
            await send_step_message(update, context, step)
        else:
            # Branch completed, end it
            dialog_manager.end_branch(str(user_id))
            await update.message.reply_text("Диалог завершен. Используйте /start для нового диалога.")
    except Exception as e:
        logger.error(f"Error processing message: {e}", exc_info=True)
        await update.message.reply_text("Произошла ошибка. Пожалуйста, начните сначала с команды /start")

@retry_on_error()
@safe_execute
async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle callback queries"""
    user_id = update.effective_user.id
    
    # Rate limiting check for callbacks
    if not callback_rate_limiter.is_allowed(user_id):
        cooldown_remaining = callback_rate_limiter.get_cooldown_remaining(user_id)
        if cooldown_remaining > 0:
            await update.callback_query.answer(
                f"Слишком много нажатий. Подождите {cooldown_remaining} секунд.",
                show_alert=True
            )
        else:
            await update.callback_query.answer(
                "Слишком много нажатий. Пожалуйста, подождите немного.",
                show_alert=True
            )
        return
    
    logger.info(f"Received callback from user {user_id}: {update.callback_query.data}")
    query = update.callback_query
    await query.answer()
    if user_id not in user_contexts:
        user_contexts[user_id] = Context(telegram=update.effective_user)
    
    current_context = user_contexts[user_id]
    
    # Handle special callback data
    if query.data.startswith("start_branch|"):
        # Start a specific dialog branch
        branch_name = query.data.split("|")[1]
        step = dialog_manager.start_branch(str(user_id), branch_name, current_context)
        if step:
            await send_step_message(update, context, step)
        else:
            await query.message.reply_text("Произошла ошибка при запуске диалога.")
        return
    
    elif query.data == "start_main_survey":
        # Start main survey
        step = dialog_manager.start_branch(str(user_id), "main_survey", current_context)
        if step:
            await send_step_message(update, context, step)
        return
    
    elif query.data == "retake_test":
        # Reset and retake test
        dialog_manager.end_branch(str(user_id))
        step = dialog_manager.start_branch(str(user_id), "quick_test", current_context)
        if step:
            await send_step_message(update, context, step)
        return
    
    # Handle status updates (existing functionality)
    if query.data.startswith("status|"):
        try:
            _, telegram_id, reg_time, new_status = query.data.split("|", 3)
            # Update status in Google Sheets
            if sheet:
                month_sheet = get_month_sheet_name()
                sheet.get_or_create_sheet(month_sheet)
                current_status = sheet.get_status(telegram_id, reg_time)
                if current_status in ["В работе", "Обработано"]:
                    await query.edit_message_reply_markup(reply_markup=None)
                    await query.message.reply_text(f"Статус уже обновлён: {current_status}")
                    return
                sheet.update_status(telegram_id, reg_time, new_status)
                await query.edit_message_reply_markup(reply_markup=None)
                await query.message.reply_text(f"Статус заявки обновлён: {new_status}")
        except Exception as e:
            logger.error(f"Ошибка при обновлении статуса: {e}", exc_info=True)
            await query.message.reply_text(f"Ошибка при обновлении статуса: {e}")
        return
    
    # Handle regular dialog callbacks
    active_branch = dialog_manager.get_active_branch(str(user_id))
    if active_branch:
        branch = dialog_manager.get_branch(active_branch)
        if branch:
            try:
                # Set the user's choice in context
                current_context.set_user_message(query.data)
                
                # Process through the branch
                step = branch.entry_point(current_context)
                if step:
                    await send_step_message(update, context, step)
                else:
                    # Branch completed
                    dialog_manager.end_branch(str(user_id))
                    await query.message.reply_text("Диалог завершен. Используйте /start для нового диалога.")
            except Exception as e:
                logger.error(f"Error processing callback: {e}", exc_info=True)
                await query.message.reply_text("Произошла ошибка. Пожалуйста, начните сначала с команды /start")

@retry_on_error()
@safe_execute
async def send_step_message(update: Update, context: ContextTypes.DEFAULT_TYPE, step: Step) -> None:
    """Send step message with improved error handling"""
    try:
        reply_markup = getattr(step, 'reply_markup', None)
        logger.info(f"send_step_message: options={step.options}, reply_markup={reply_markup}")
        
        # If regular keyboard — always new message
        if isinstance(reply_markup, ReplyKeyboardMarkup):
            if getattr(update, "message", None):
                await update.message.reply_text(text=step.message, reply_markup=reply_markup)
            elif getattr(update, "callback_query", None):
                await update.callback_query.message.reply_text(text=step.message, reply_markup=reply_markup)
            return
            
        if getattr(update, "callback_query", None):
            if step.options and not reply_markup:
                keyboard = []
                for option in step.options:
                    keyboard.append([InlineKeyboardButton(option, callback_data=option)])
                reply_markup = InlineKeyboardMarkup(keyboard)
            try:
                await update.callback_query.edit_message_text(text=step.message, reply_markup=reply_markup)
            except telegram.error.BadRequest as e:
                if "Message is not modified" not in str(e):
                    logger.warning(f"Failed to edit message: {e}")
                    # Fallback: send new message
                    await update.callback_query.message.reply_text(text=step.message, reply_markup=reply_markup)
        else:
            if step.options and not reply_markup:
                keyboard = []
                for option in step.options:
                    keyboard.append([InlineKeyboardButton(option, callback_data=option)])
                reply_markup = InlineKeyboardMarkup(keyboard)
                await update.message.reply_text(text=step.message, reply_markup=reply_markup)
            elif reply_markup:
                await update.message.reply_text(text=step.message, reply_markup=reply_markup)
            else:
                await update.message.reply_text(text=step.message)
                
    except Exception as e:
        logger.error(f"Error in send_step_message: {e}", exc_info=True)
        # Fallback: try to send simple text message
        try:
            if getattr(update, "message", None):
                await update.message.reply_text("Произошла ошибка. Пожалуйста, попробуйте позже.")
            elif getattr(update, "callback_query", None):
                await update.callback_query.message.reply_text("Произошла ошибка. Пожалуйста, попробуйте позже.")
        except:
            logger.error("Failed to send error message to user")

def get_month_sheet_name():
    """Get current month sheet name"""
    months = [
        "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
        "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
    ]
    now = datetime.datetime.now()
    return months[now.month - 1]

def setup_application() -> Application:
    """Setup application with error handling"""
    try:
        app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
        
        # Register handlers
        app.add_handler(CommandHandler("start", start_command))
        app.add_handler(CommandHandler("help", help_command))
        app.add_handler(CommandHandler("trash", trash_command))
        app.add_handler(CallbackQueryHandler(handle_callback))
        app.add_handler(MessageHandler(filters.TEXT | filters.CONTACT, handle_message))
        
        logger.info("Application handlers registered successfully")
        return app
    except Exception as e:
        logger.error(f"Failed to setup application: {e}")
        raise

async def cleanup_rate_limiter():
    """Periodic cleanup of rate limiter data"""
    while True:
        try:
            await asyncio.sleep(300)  # Cleanup every 5 minutes
            message_rate_limiter.cleanup_old_data()
            callback_rate_limiter.cleanup_old_data()
            command_rate_limiter.cleanup_old_data()
            logger.debug("Rate limiter cleanup completed")
        except Exception as e:
            logger.error(f"Error in rate limiter cleanup: {e}")

async def main():
    """Main function with error handling"""
    global application
    
    try:
        # Initialize dialogs
        initialize_dialogs()
        
        # Setup application
        application = setup_application()
        
        # Check Google Sheets connection
        if sheet is None:
            logger.warning("Google Sheets not available, some features may not work")
        
        logger.info("Starting KingSpeech Bot with modular dialog system and rate limiting...")
        await application.run_polling(
            allowed_updates=Update.ALL_TYPES,
            drop_pending_updates=True
        )
        
    except Exception as e:
        logger.error(f"Critical error in main: {e}", exc_info=True)
        raise

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Bot stopped by user")
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)