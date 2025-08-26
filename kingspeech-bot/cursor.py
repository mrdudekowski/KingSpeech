from dataclasses import dataclass
from typing import List, Optional, Callable, Dict, Any
from google.oauth2 import service_account
from googleapiclient.discovery import build
import logging

# Настройка логирования
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@dataclass
class Step:
    message: str = ""
    next_step: Optional[Callable] = None
    options: Optional[List[str]] = None
    variables: Optional[List['Variable']] = None
    reply_markup: Optional[Dict[str, Any]] = None

@dataclass
class Variable:
    name: str
    value: Any = None

class Context:
    def __init__(self, telegram=None):
        self.telegram = telegram
        self._variables = {}
        self._user_message = ""

    def set_variable(self, name: str, value: Any):
        self._variables[name] = value

    def get_variable(self, name: str, default=None):
        return self._variables.get(name, default)

    def set_user_message(self, message: str):
        self._user_message = message

    def get_user_message(self) -> str:
        return self._user_message

class Dialog:
    def __init__(self):
        self.steps = {}

    def step(self):
        def decorator(func):
            self.steps[func.__name__] = func
            return func
        return decorator

class GoogleSheets:
    SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

    def __init__(self, spreadsheet_id: str, sheet_name: str):
        self.spreadsheet_id = spreadsheet_id
        self.sheet_name = sheet_name
        logger.debug(f"Initializing GoogleSheets with spreadsheet_id: {spreadsheet_id}, sheet_name: {sheet_name}")
        self.service = self._get_service()

    def _get_service(self):
        try:
            import os
            import json
            
            # Пытаемся получить credentials из переменной окружения
            google_credentials = os.getenv('GOOGLE_CREDENTIALS')
            
            if google_credentials:
                # Парсим JSON из переменной окружения
                creds_info = json.loads(google_credentials)
                creds = service_account.Credentials.from_service_account_info(
                    creds_info,
                    scopes=self.SCOPES
                )
                logger.debug("Successfully created credentials from environment variable")
            else:
                # Fallback к файлу (для локальной разработки)
                creds = service_account.Credentials.from_service_account_file(
                    'service-account.json',
                    scopes=self.SCOPES
                )
                logger.debug("Successfully created credentials from service account file")
            
            return build('sheets', 'v4', credentials=creds)
        except Exception as e:
            logger.error(f"Error in _get_service: {str(e)}", exc_info=True)
            raise

    def append_row(self, data):
        try:
            # Если data — это список, используем его напрямую
            if isinstance(data, list):
                values = data
            # Если data — это словарь, преобразуем в список значений
            elif isinstance(data, dict):
                values = [data.get(key, "") for key in data.keys()]
            else:
                raise ValueError("append_row: data must be list or dict")
            body = {
                'values': [values]
            }
            range_name = f'{self.sheet_name}!A:Z'
            logger.debug(f"Appending row to range: {range_name}")
            self.service.spreadsheets().values().append(
                spreadsheetId=self.spreadsheet_id,
                range=range_name,
                valueInputOption='USER_ENTERED',
                body=body
            ).execute()
            logger.debug("Successfully appended row to spreadsheet")
        except Exception as e:
            logger.error(f"Error in append_row: {str(e)}", exc_info=True)
            raise

    def get_or_create_sheet(self, sheet_name):
        # Получаем список листов
        sheets_metadata = self.service.spreadsheets().get(spreadsheetId=self.spreadsheet_id).execute()
        sheets = sheets_metadata.get('sheets', '')
        sheet_titles = [s['properties']['title'] for s in sheets]
        if sheet_name not in sheet_titles:
            # Создаём новый лист
            requests = [{
                'addSheet': {
                    'properties': {'title': sheet_name}
                }
            }]
            self.service.spreadsheets().batchUpdate(
                spreadsheetId=self.spreadsheet_id,
                body={'requests': requests}
            ).execute()
        self.sheet_name = sheet_name

    def update_status(self, telegram_id, reg_time, new_status):
        # Получаем все строки листа
        range_name = f'{self.sheet_name}!A:Z'
        result = self.service.spreadsheets().values().get(
            spreadsheetId=self.spreadsheet_id,
            range=range_name
        ).execute()
        values = result.get('values', [])
        # Ищем строку по telegram_id и времени (reg_time)
        target_row = None
        for idx, row in enumerate(values):
            if len(row) >= 2 and str(row[0]) == str(telegram_id) and reg_time in str(row):
                target_row = idx + 1  # 1-индексация в Google Sheets
                break
        if not target_row:
            raise Exception('Заявка не найдена в таблице')
        # Обновляем последний столбец (статус)
        col = len(values[target_row-1])
        status_range = f'{self.sheet_name}!{chr(65+col-1)}{target_row}'
        self.service.spreadsheets().values().update(
            spreadsheetId=self.spreadsheet_id,
            range=status_range,
            valueInputOption='USER_ENTERED',
            body={'values': [[new_status]]}
        ).execute()

    def get_status(self, telegram_id, reg_time):
        range_name = f'{self.sheet_name}!A:Z'
        result = self.service.spreadsheets().values().get(
            spreadsheetId=self.spreadsheet_id,
            range=range_name
        ).execute()
        values = result.get('values', [])
        for row in values:
            if len(row) >= 2 and str(row[0]) == str(telegram_id) and reg_time in str(row):
                if len(row) > 0:
                    return row[-1]  # Статус — последний столбец
        return None 