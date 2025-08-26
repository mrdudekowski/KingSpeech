"""
Main Survey Dialog for KingSpeech Bot
Modular implementation of the main survey flow
"""

import logging
from typing import Optional, List
from cursor import Context, Step
from services.dialog_base import BaseDialog
from services.localization_service import localization
from services.cached_sheets_service import cached_sheets_service
from services.validators import input_validator
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardMarkup, KeyboardButton

logger = logging.getLogger(__name__)

class MainSurveyDialog(BaseDialog):
    """Main survey dialog branch"""
    
    def __init__(self):
        super().__init__(
            name="main_survey",
            description="Main survey for course matching",
            tags=["survey", "course_matching", "lead_generation"],
            priority=100  # High priority - main flow
        )
    
    def entry_point(self, context: Context) -> Step:
        """Entry point for main survey"""
        try:
            # Check if already completed
            if self.is_completed(context):
                return self._show_completion_message(context)
            
            # Language already selected in main bot, go directly to greeting
            return self._greeting_step(context)
            
        except Exception as e:
            return self.handle_error(context, e, "Произошла ошибка. Пожалуйста, начните сначала.")
    
    def _language_selection_step(self, context: Context) -> Step:
        """Language selection step"""
        lang = self.get_user_data(context, 'interface_lang', 'ru')
        message = localization.t('choose_language', lang)
        options = ['🇷🇺 Русский', '🇬🇧 English']
        return self.create_step(message, next_step=self._process_language_selection, options=options)
    
    def _process_language_selection(self, context: Context, choice: str = None) -> Step:
        """Process language selection"""
        if choice:
            if choice == '🇷🇺 Русский':
                self.set_user_data(context, 'interface_lang', 'ru')
            elif choice == '🇬🇧 English':
                self.set_user_data(context, 'interface_lang', 'en')
        
        return self._greeting_step(context)
    
    def _greeting_step(self, context: Context) -> Step:
        """Greeting step"""
        lang = self.get_user_data(context, 'interface_lang', 'ru')
        message = localization.t('start_greeting', lang)
        start_btn = localization.t('start_button', lang)
        options = [start_btn]
        return self.create_step(message, next_step=self._process_greeting, options=options)
    
    def _process_greeting(self, context: Context, choice: str = None) -> Step:
        """Process greeting response"""
        if choice:
            return self._name_step(context)
        return self._greeting_step(context)
    
    def _name_step(self, context: Context) -> Step:
        """Name input step"""
        lang = self.get_user_data(context, 'interface_lang', 'ru')
        progress = self._get_progress_bar(1, 7)
        message = f"{progress}\n{localization.t('ask_name', lang)}"
        return self.create_step(message, next_step=self._process_name)
    
    def _process_name(self, context: Context, choice: str = None) -> Step:
        """Process name input"""
        user_name = self.get_user_message(context).strip()
        lang = self.get_user_data(context, 'interface_lang', 'ru')
        
        # Validate name input
        validation_result = input_validator.validate_name(user_name, lang)
        
        if not validation_result.is_valid:
            progress = self._get_progress_bar(1, 7)
            message = f"{progress}\n{validation_result.error_message}\n\n{localization.t('ask_name', lang)}"
            return self.create_step(message, next_step=self._process_name)
        
        # Save validated and sanitized user data
        self.set_user_data(context, 'user_name', validation_result.sanitized_value)
        
        # Save Telegram data
        try:
            telegram_id = context.telegram.id
            telegram_username = context.telegram.username or "Не указан"
            self.set_user_data(context, "telegram_id", telegram_id)
            self.set_user_data(context, "telegram_username", telegram_username)
        except Exception as e:
            logger.warning(f"Failed to get Telegram data: {e}")
        
        return self._level_step(context)
    
    def _level_step(self, context: Context) -> Step:
        """Level selection step"""
        lang = self.get_user_data(context, 'interface_lang', 'ru')
        progress = self._get_progress_bar(2, 7)
        
        level_options = [
            ("С нуля 🆕", "Beginner 🆕"), ("Начинающий (A1–A2) 🟢", "Elementary (A1–A2) 🟢"),
            ("Средний (B1–B2) 🟡", "Intermediate (B1–B2) 🟡"), ("Продвинутый (C1–C2) 🟣", "Advanced (C1–C2) 🟣"),
            ("Не уверен(а) ❓", "Not sure ❓")
        ]
        
        if lang == 'en':
            message = f"{progress}\n{localization.t('ask_level', lang)}"
            options = [en for ru, en in level_options]
        else:
            message = f"{progress}\n{localization.t('ask_level', lang)}"
            options = [ru for ru, en in level_options]
        
        return self.create_step(message, next_step=self._process_level, options=options)
    
    def _process_level(self, context: Context, choice: str = None) -> Step:
        """Process level selection"""
        if not choice:
            return self._level_step(context)
        
        self.set_user_data(context, "level", choice)
        return self._goal_step(context)
    
    def _goal_step(self, context: Context) -> Step:
        """Goal selection step"""
        lang = self.get_user_data(context, 'interface_lang', 'ru')
        progress = self._get_progress_bar(3, 7)
        
        goals_options = [
            ("Общий язык 🌐", "General language 🌐"), ("Разговорный 🗣️", "Conversational 🗣️"),
            ("Для путешествий ✈️", "For travel ✈️"), ("Бизнес-язык 💼", "Business language 💼"),
            ("Подготовка к экзаменам 🎓", "Exam preparation 🎓"), ("Для детей 👶", "For children 👶"),
            ("Другое 📝", "Other 📝")
        ]
        
        if lang == 'en':
            message = f"{progress}\n{localization.t('ask_goal', lang)}"
            options = [en for ru, en in goals_options]
        else:
            message = f"{progress}\n{localization.t('ask_goal', lang)}"
            options = [ru for ru, en in goals_options]
        
        return self.create_step(message, next_step=self._process_goal, options=options)
    
    def _process_goal(self, context: Context, choice: str = None) -> Step:
        """Process goal selection"""
        if not choice:
            return self._goal_step(context)
        
        self.set_user_data(context, "goals", choice)
        return self._format_step(context)
    
    def _format_step(self, context: Context) -> Step:
        """Format selection step"""
        lang = self.get_user_data(context, 'interface_lang', 'ru')
        progress = self._get_progress_bar(4, 7)
        
        format_options = [
            ("Индивидуальный", "Individual"), ("Парный", "Pair"), 
            ("Группа (от 3х человек)", "Group (3+ people)"), ("Онлайн", "Online")
        ]
        
        if lang == 'en':
            message = f"{progress}\n{localization.t('ask_format', lang)}"
            options = [en for ru, en in format_options]
        else:
            message = f"{progress}\n{localization.t('ask_format', lang)}"
            options = [ru for ru, en in format_options]
        
        return self.create_step(message, next_step=self._process_format, options=options)
    
    def _process_format(self, context: Context, choice: str = None) -> Step:
        """Process format selection"""
        if not choice:
            return self._format_step(context)
        
        self.set_user_data(context, "format", choice)
        return self._expectations_step(context)
    
    def _expectations_step(self, context: Context) -> Step:
        """Expectations selection step"""
        lang = self.get_user_data(context, 'interface_lang', 'ru')
        progress = self._get_progress_bar(5, 7)
        
        expectations_options = [
            ("Разнообразие слов и выражений 📝", "Variety of words and expressions 📝"),
            ("Преодоление плато 🧗", "Overcoming plateau 🧗"),
            ("Интересные задания 🎲", "Interesting tasks 🎲"),
            ("Обратную связь 💬", "Feedback 💬"),
            ("Лёгкость в общении 💡", "Ease in communication 💡"),
            ("Другое 📝", "Other 📝")
        ]
        
        selected = self.get_user_data(context, "expectations", [])
        if isinstance(selected, str):
            selected = [selected]
        
        keyboard = []
        for ru, en in expectations_options:
            exp = en if lang == 'en' else ru
            mark = "✅" if exp in selected else "❌"
            keyboard.append([InlineKeyboardButton(f"{mark} {exp}", callback_data=exp)])
        
        done_btn = localization.t('done', lang)
        keyboard.append([InlineKeyboardButton(done_btn, callback_data=done_btn)])
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        message = f"{progress}\n{localization.t('ask_expectations', lang)}"
        return self.create_step(message, next_step=self._process_expectations, reply_markup=reply_markup)
    
    def _process_expectations(self, context: Context, choice: str = None) -> Step:
        """Process expectations selection"""
        lang = self.get_user_data(context, 'interface_lang', 'ru')
        expectations_options = [
            ("Разнообразие слов и выражений 📝", "Variety of words and expressions 📝"),
            ("Преодоление плато 🧗", "Overcoming plateau 🧗"),
            ("Интересные задания 🎲", "Interesting tasks 🎲"),
            ("Обратную связь 💬", "Feedback 💬"),
            ("Лёгкость в общении 💡", "Ease in communication 💡"),
            ("Другое 📝", "Other 📝")
        ]
        
        selected = self.get_user_data(context, "expectations", [])
        if isinstance(selected, str):
            selected = [selected]
        
        done_btn = localization.t('done', lang)
        
        if choice == done_btn:
            self.set_user_data(context, "expectations", ", ".join(selected))
            return self._start_date_step(context)
        elif choice in [en for ru, en in expectations_options] + [ru for ru, en in expectations_options]:
            if choice in selected:
                selected.remove(choice)
            else:
                selected.append(choice)
        
        # Update keyboard
        keyboard = []
        for ru, en in expectations_options:
            exp = en if lang == 'en' else ru
            mark = "✅" if exp in selected else "❌"
            keyboard.append([InlineKeyboardButton(f"{mark} {exp}", callback_data=exp)])
        keyboard.append([InlineKeyboardButton(done_btn, callback_data=done_btn)])
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        self.set_user_data(context, "expectations", selected)
        progress = self._get_progress_bar(5, 7)
        message = f"{progress}\n{localization.t('ask_expectations', lang)}"
        return self.create_step(message, next_step=self._process_expectations, reply_markup=reply_markup)
    
    def _start_date_step(self, context: Context) -> Step:
        """Start date selection step"""
        lang = self.get_user_data(context, 'interface_lang', 'ru')
        progress = self._get_progress_bar(6, 7)
        
        start_date_options = [
            ("Прямо сейчас 🚀", "Right now 🚀"), ("На следующей неделе 📅", "Next week 📅"),
            ("Через пару недель ⏳", "In a couple of weeks ⏳"), ("Ещё не решил(а) 🤔", "Haven't decided yet 🤔")
        ]
        
        if lang == 'en':
            message = f"{progress}\n{localization.t('ask_start_date', lang)}"
            options = [en for ru, en in start_date_options]
        else:
            message = f"{progress}\n{localization.t('ask_start_date', lang)}"
            options = [ru for ru, en in start_date_options]
        
        return self.create_step(message, next_step=self._process_start_date, options=options)
    
    def _process_start_date(self, context: Context, choice: str = None) -> Step:
        """Process start date selection"""
        if not choice:
            return self._start_date_step(context)
        
        self.set_user_data(context, "start_date", choice)
        return self._phone_step(context)
    
    def _phone_step(self, context: Context) -> Step:
        """Phone number collection step"""
        lang = self.get_user_data(context, 'interface_lang', 'ru')
        progress = self._get_progress_bar(7, 7)
        message = f"{progress}\n{localization.t('ask_phone', lang)}"
        
        send_phone_btn = localization.t('send_phone', lang)
        keyboard = [[KeyboardButton(send_phone_btn, request_contact=True)]]
        reply_markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True, resize_keyboard=True)
        
        return self.create_step(message, next_step=self._process_phone, reply_markup=reply_markup)
    
    def _process_phone(self, context: Context, choice: str = None) -> Step:
        """Process phone number input"""
        lang = self.get_user_data(context, 'interface_lang', 'ru')
        
        # Get phone from contact or text message
        phone = None
        
        # Check if we have a contact object in context
        if hasattr(context, 'contact') and context.contact:
            phone = context.contact.phone_number
        else:
            # Fallback to user message (for manual input)
            phone = self.get_user_message(context).strip()
        
        # If no phone provided, show error
        if not phone:
            progress = self._get_progress_bar(7, 7)
            message = f"{progress}\n{localization.t('invalid_phone', lang)}\n\n{localization.t('ask_phone', lang)}"
            send_phone_btn = localization.t('send_phone', lang)
            keyboard = [[KeyboardButton(send_phone_btn, request_contact=True)]]
            reply_markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True, resize_keyboard=True)
            return self.create_step(message, next_step=self._process_phone, reply_markup=reply_markup)
        
        # Validate phone input
        validation_result = input_validator.validate_phone(phone, lang)
        
        if not validation_result.is_valid:
            progress = self._get_progress_bar(7, 7)
            message = f"{progress}\n{validation_result.error_message}\n\n{localization.t('ask_phone', lang)}"
            send_phone_btn = localization.t('send_phone', lang)
            keyboard = [[KeyboardButton(send_phone_btn, request_contact=True)]]
            reply_markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True, resize_keyboard=True)
            return self.create_step(message, next_step=self._process_phone, reply_markup=reply_markup)
        
        # Save validated and sanitized phone data
        self.set_user_data(context, "phone", validation_result.sanitized_value)
        return self._completion_step(context)
    
    def _completion_step(self, context: Context) -> Step:
        """Survey completion step"""
        try:
            # Save data to Google Sheets
            self._save_to_sheets(context)
            
            # Mark as completed
            self.mark_completed(context)
            
            # Show completion message
            return self._show_completion_message(context)
            
        except Exception as e:
            logger.error(f"Error in completion step: {e}")
            return self.handle_error(context, e, "Произошла ошибка при сохранении данных.")
    
    def _save_to_sheets(self, context: Context) -> None:
        """Save user data to Google Sheets"""
        data = [
            self.get_user_data(context, "telegram_id") or "",
            self.get_user_data(context, "telegram_username") or "",
            self.get_user_data(context, "phone") or "",
            self.get_user_data(context, "user_name"),
            "English",  # Fixed language for English school
            self.get_user_data(context, "level"),
            self.get_user_data(context, "goals"),
            self.get_user_data(context, "format"),
            self.get_user_data(context, "expectations"),
            self.get_user_data(context, "start_date")
        ]
        cached_sheets_service.append_user_row(data)
    
    def _show_completion_message(self, context: Context) -> Step:
        """Show completion message"""
        lang = self.get_user_data(context, 'interface_lang', 'ru')
        user_name = self.get_user_data(context, 'user_name', '')
        message = localization.t('thanks', lang, user_name=user_name)
        
        return self.create_step(message, next_step=None)
    
    def _get_progress_bar(self, current: int, total: int, length: int = 8) -> str:
        """Generate progress bar"""
        filled = int(length * current / total)
        bar = "■" * filled + "□" * (length - filled)
        return bar

# Create and register the main survey dialog
main_survey = MainSurveyDialog()
