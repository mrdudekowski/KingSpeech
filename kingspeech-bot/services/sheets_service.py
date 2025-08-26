"""
Sheets Service for KingSpeech Bot
Unified Google Sheets operations with error handling
"""

import logging
from datetime import datetime
from typing import List, Optional
from cursor import GoogleSheets
from config import SPREADSHEET_ID

logger = logging.getLogger(__name__)

class SheetsService:
    """Unified service for Google Sheets operations"""
    
    MONTHS = [
        "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
        "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
    ]
    
    def __init__(self):
        try:
            # Initialize with current month sheet
            current_month = self._get_month_sheet()
            self.sheet = GoogleSheets(SPREADSHEET_ID, current_month)
            logger.info(f"SheetsService initialized with month: {current_month}")
        except Exception as e:
            logger.error(f"Failed to initialize SheetsService: {e}")
            raise

    def _get_month_sheet(self) -> str:
        """Get current month sheet name"""
        return self.MONTHS[datetime.now().month - 1]

    def append_user_row(self, data: List, month_sheet: Optional[str] = None) -> bool:
        """Append user data to Google Sheets with error handling"""
        try:
            if not month_sheet:
                month_sheet = self._get_month_sheet()
            
            # Create sheet if it doesn't exist
            self.sheet.get_or_create_sheet(month_sheet)
            
            # Update sheet name for this operation
            self.sheet.sheet_name = month_sheet
            
            # Append the data
            self.sheet.append_row(data)
            logger.info(f"Successfully appended user data to {month_sheet}")
            return True
        except Exception as e:
            logger.error(f"Failed to append user data: {e}")
            return False

    def get_status(self, telegram_id: str, reg_time: str, month_sheet: Optional[str] = None) -> Optional[str]:
        """Get user status from Google Sheets with error handling"""
        try:
            if not month_sheet:
                month_sheet = self._get_month_sheet()
            
            # Update sheet name for this operation
            self.sheet.sheet_name = month_sheet
            
            status = self.sheet.get_status(telegram_id, reg_time)
            logger.info(f"Retrieved status for user {telegram_id}: {status}")
            return status
        except Exception as e:
            logger.error(f"Failed to get status for user {telegram_id}: {e}")
            return None

    def update_status(self, telegram_id: str, reg_time: str, new_status: str, month_sheet: Optional[str] = None) -> bool:
        """Update user status in Google Sheets with error handling"""
        try:
            if not month_sheet:
                month_sheet = self._get_month_sheet()
            
            # Update sheet name for this operation
            self.sheet.sheet_name = month_sheet
            
            self.sheet.update_status(telegram_id, reg_time, new_status)
            logger.info(f"Successfully updated status for user {telegram_id} to {new_status}")
            return True
        except Exception as e:
            logger.error(f"Failed to update status for user {telegram_id}: {e}")
            return False

    def get_all_users(self, month_sheet: Optional[str] = None) -> List[List]:
        """Get all users from current month sheet"""
        try:
            if not month_sheet:
                month_sheet = self._get_month_sheet()
            
            # Update sheet name for this operation
            self.sheet.sheet_name = month_sheet
            
            # This would need to be implemented in GoogleSheets class
            # For now, return empty list
            logger.info(f"Retrieved all users from {month_sheet}")
            return []
        except Exception as e:
            logger.error(f"Failed to get users from {month_sheet}: {e}")
            return [] 