"""
Input Validation Service for KingSpeech Bot
Security and data validation for user inputs
"""

import re
import logging
from typing import Optional, Dict, Any, List
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class ValidationResult:
    """Result of validation operation"""
    is_valid: bool
    error_message: Optional[str] = None
    sanitized_value: Optional[str] = None

class InputValidator:
    """Input validation service for security and data integrity"""
    
    # Regex patterns for validation
    NAME_PATTERN = re.compile(r"^[а-яёa-z\s\-']{2,50}$", re.IGNORECASE)
    PHONE_PATTERN = re.compile(r"^(\+7|8)\d{10}$")
    EMAIL_PATTERN = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    TELEGRAM_USERNAME_PATTERN = re.compile(r"^[a-zA-Z0-9_]{5,32}$")
    
    # Allowed characters for general text
    SAFE_TEXT_PATTERN = re.compile(r"^[а-яёa-z0-9\s\-_.,!?()@#$%&*+=:;\"'<>[\]{}|\\/]{1,1000}$", re.IGNORECASE)
    
    # Maximum lengths
    MAX_NAME_LENGTH = 50
    MAX_PHONE_LENGTH = 15
    MAX_EMAIL_LENGTH = 100
    MAX_TEXT_LENGTH = 1000
    
    def __init__(self):
        logger.info("InputValidator initialized")
    
    def validate_name(self, name: str, lang: str = 'ru') -> ValidationResult:
        """
        Validate user name
        
        Args:
            name: User's name
            lang: Language for error messages
            
        Returns:
            ValidationResult: Validation result with sanitized value
        """
        if not name or not isinstance(name, str):
            error_msg = "Имя обязательно для заполнения" if lang == 'ru' else "Name is required"
            return ValidationResult(False, error_msg)
        
        name = name.strip()
        
        if len(name) < 2:
            error_msg = "Имя должно содержать минимум 2 символа" if lang == 'ru' else "Name must be at least 2 characters"
            return ValidationResult(False, error_msg)
        
        if len(name) > self.MAX_NAME_LENGTH:
            error_msg = f"Имя не должно превышать {self.MAX_NAME_LENGTH} символов" if lang == 'ru' else f"Name must not exceed {self.MAX_NAME_LENGTH} characters"
            return ValidationResult(False, error_msg)
        
        if not self.NAME_PATTERN.match(name):
            error_msg = "Имя может содержать только буквы, пробелы, дефисы и апострофы" if lang == 'ru' else "Name can only contain letters, spaces, hyphens and apostrophes"
            return ValidationResult(False, error_msg)
        
        # Sanitize name
        sanitized = self._sanitize_text(name)
        
        return ValidationResult(True, sanitized_value=sanitized)
    
    def validate_phone(self, phone: str, lang: str = 'ru') -> ValidationResult:
        """
        Validate phone number
        
        Args:
            phone: Phone number
            lang: Language for error messages
            
        Returns:
            ValidationResult: Validation result with sanitized value
        """
        if not phone or not isinstance(phone, str):
            error_msg = "Номер телефона обязателен" if lang == 'ru' else "Phone number is required"
            return ValidationResult(False, error_msg)
        
        phone = phone.strip()
        
        # Remove all non-digit characters except +
        cleaned_phone = re.sub(r'[^\d+]', '', phone)
        
        # Normalize phone number
        if cleaned_phone.startswith('8') and len(cleaned_phone) == 11:
            # Convert 8 to +7
            cleaned_phone = '+7' + cleaned_phone[1:]
        elif cleaned_phone.startswith('7') and len(cleaned_phone) == 11:
            # Add + prefix
            cleaned_phone = '+' + cleaned_phone
        
        if not self.PHONE_PATTERN.match(cleaned_phone):
            error_msg = "Неверный формат номера телефона. Используйте +7XXXXXXXXXX или 8XXXXXXXXXX" if lang == 'ru' else "Invalid phone format. Use +7XXXXXXXXXX or 8XXXXXXXXXX"
            return ValidationResult(False, error_msg)
        
        return ValidationResult(True, sanitized_value=cleaned_phone)
    
    def validate_email(self, email: str, lang: str = 'ru') -> ValidationResult:
        """
        Validate email address
        
        Args:
            email: Email address
            lang: Language for error messages
            
        Returns:
            ValidationResult: Validation result with sanitized value
        """
        if not email or not isinstance(email, str):
            error_msg = "Email обязателен" if lang == 'ru' else "Email is required"
            return ValidationResult(False, error_msg)
        
        email = email.strip().lower()
        
        if len(email) > self.MAX_EMAIL_LENGTH:
            error_msg = f"Email не должен превышать {self.MAX_EMAIL_LENGTH} символов" if lang == 'ru' else f"Email must not exceed {self.MAX_EMAIL_LENGTH} characters"
            return ValidationResult(False, error_msg)
        
        if not self.EMAIL_PATTERN.match(email):
            error_msg = "Неверный формат email адреса" if lang == 'ru' else "Invalid email format"
            return ValidationResult(False, error_msg)
        
        return ValidationResult(True, sanitized_value=email)
    
    def validate_telegram_username(self, username: str, lang: str = 'ru') -> ValidationResult:
        """
        Validate Telegram username
        
        Args:
            username: Telegram username
            lang: Language for error messages
            
        Returns:
            ValidationResult: Validation result with sanitized value
        """
        if not username or not isinstance(username, str):
            error_msg = "Username обязателен" if lang == 'ru' else "Username is required"
            return ValidationResult(False, error_msg)
        
        username = username.strip()
        
        if not self.TELEGRAM_USERNAME_PATTERN.match(username):
            error_msg = "Username может содержать только буквы, цифры и подчеркивания (5-32 символа)" if lang == 'ru' else "Username can only contain letters, numbers and underscores (5-32 characters)"
            return ValidationResult(False, error_msg)
        
        return ValidationResult(True, sanitized_value=username)
    
    def validate_general_text(self, text: str, max_length: int = None, lang: str = 'ru') -> ValidationResult:
        """
        Validate general text input
        
        Args:
            text: Text to validate
            max_length: Maximum allowed length
            lang: Language for error messages
            
        Returns:
            ValidationResult: Validation result with sanitized value
        """
        if not text or not isinstance(text, str):
            error_msg = "Текст обязателен" if lang == 'ru' else "Text is required"
            return ValidationResult(False, error_msg)
        
        text = text.strip()
        max_len = max_length if max_length is not None else self.MAX_TEXT_LENGTH
        
        if len(text) > max_len:
            error_msg = f"Текст не должен превышать {max_len} символов" if lang == 'ru' else f"Text must not exceed {max_len} characters"
            return ValidationResult(False, error_msg)
        
        if not self.SAFE_TEXT_PATTERN.match(text):
            error_msg = "Текст содержит недопустимые символы" if lang == 'ru' else "Text contains invalid characters"
            return ValidationResult(False, error_msg)
        
        # Sanitize text
        sanitized = self._sanitize_text(text)
        
        return ValidationResult(True, sanitized_value=sanitized)
    
    def validate_choice(self, choice: str, allowed_choices: List[str], lang: str = 'ru') -> ValidationResult:
        """
        Validate choice from predefined options
        
        Args:
            choice: User's choice
            allowed_choices: List of allowed choices
            lang: Language for error messages
            
        Returns:
            ValidationResult: Validation result
        """
        if not choice or not isinstance(choice, str):
            error_msg = "Выберите один из предложенных вариантов" if lang == 'ru' else "Please select one of the available options"
            return ValidationResult(False, error_msg)
        
        choice = choice.strip()
        
        if choice not in allowed_choices:
            error_msg = "Выбран недопустимый вариант" if lang == 'ru' else "Invalid option selected"
            return ValidationResult(False, error_msg)
        
        return ValidationResult(True, sanitized_value=choice)
    
    def _sanitize_text(self, text: str) -> str:
        """
        Sanitize text input to prevent injection attacks
        
        Args:
            text: Text to sanitize
            
        Returns:
            str: Sanitized text
        """
        # Remove potential script tags
        text = re.sub(r'<script.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)
        
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', text)
        
        # Remove control characters but preserve spaces
        text = re.sub(r'[\x00-\x1f\x7f-\x9f]', ' ', text)
        
        # Normalize whitespace (сохраняем пробелы)
        text = re.sub(r'[ \t]+', ' ', text)
        text = re.sub(r'\n+', '\n', text)
        
        return text.strip()
    
    def validate_user_data(self, data: Dict[str, Any], required_fields: List[str], lang: str = 'ru') -> Dict[str, ValidationResult]:
        """
        Validate multiple user data fields
        
        Args:
            data: Dictionary with user data
            required_fields: List of required field names
            lang: Language for error messages
            
        Returns:
            Dict[str, ValidationResult]: Validation results for each field
        """
        results = {}
        
        for field in required_fields:
            value = data.get(field, '')
            
            if field == 'user_name':
                results[field] = self.validate_name(value, lang)
            elif field == 'phone':
                results[field] = self.validate_phone(value, lang)
            elif field == 'email':
                results[field] = self.validate_email(value, lang)
            elif field == 'telegram_username':
                results[field] = self.validate_telegram_username(value, lang)
            else:
                results[field] = self.validate_general_text(value, lang=lang)
        
        return results
    
    def is_valid_user_data(self, validation_results: Dict[str, ValidationResult]) -> bool:
        """
        Check if all validation results are valid
        
        Args:
            validation_results: Dictionary of validation results
            
        Returns:
            bool: True if all validations passed
        """
        return all(result.is_valid for result in validation_results.values())
    
    def get_validation_errors(self, validation_results: Dict[str, ValidationResult]) -> List[str]:
        """
        Get list of validation error messages
        
        Args:
            validation_results: Dictionary of validation results
            
        Returns:
            List[str]: List of error messages
        """
        return [result.error_message for result in validation_results.values() if not result.is_valid]

# Global validator instance
input_validator = InputValidator()
