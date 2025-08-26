"""
Сервис для отправки лидов в чат рабочей группы
"""
import asyncio
from typing import Dict, Any
from telegram import Bot
from config import WORKGROUP_CHAT_ID, TELEGRAM_BOT_TOKEN


class LeadsSenderService:
    """Сервис для отправки лидов в чат рабочей группы"""
    
    def __init__(self):
        self.bot = Bot(token=TELEGRAM_BOT_TOKEN)
        self.workgroup_chat_id = WORKGROUP_CHAT_ID
    
    def format_lead_message(self, lead_data: Dict[str, Any]) -> str:
        """Форматирует данные лида в сообщение для отправки"""
        message = "🔥 НОВЫЙ ЛИД С БОТА @kingspeechbot\n\n"
        
        # Основная информация
        message += f"👤 Имя: {lead_data.get('name', 'Не указано')}\n"
        message += f"📱 Телефон: {lead_data.get('phone', 'Не указан')}\n"
        message += f"🌍 Язык: {lead_data.get('language', 'Не указан')}\n"
        
        # Дополнительная информация
        if lead_data.get('age'):
            message += f"📅 Возраст: {lead_data['age']}\n"
        if lead_data.get('experience'):
            message += f"📚 Опыт изучения: {lead_data['experience']}\n"
        if lead_data.get('goals'):
            message += f"🎯 Цели: {lead_data['goals']}\n"
        if lead_data.get('schedule'):
            message += f"⏰ Предпочитаемое время: {lead_data['schedule']}\n"
        
        # Временная метка
        if lead_data.get('timestamp'):
            message += f"\n📅 Получен: {lead_data['timestamp']}"
        
        return message
    
    async def send_lead(self, lead_data: Dict[str, Any]) -> bool:
        """Асинхронно отправляет лид в чат рабочей группы"""
        try:
            if not self.workgroup_chat_id:
                print("⚠️ WORKGROUP_CHAT_ID не установлен - лид не отправлен в чат")
                return False
            
            message = self.format_lead_message(lead_data)
            
            await self.bot.send_message(
                chat_id=self.workgroup_chat_id,
                text=message,
                parse_mode='HTML'
            )
            
            print(f"✅ Лид успешно отправлен в чат рабочей группы")
            return True
            
        except Exception as e:
            print(f"❌ Ошибка отправки лида в чат: {e}")
            return False
    
    def send_lead_sync(self, lead_data: Dict[str, Any]) -> bool:
        """Синхронная обертка для отправки лида"""
        try:
            loop = asyncio.get_event_loop()
            return loop.run_until_complete(self.send_lead(lead_data))
        except RuntimeError:
            # Если нет активного event loop, создаем новый
            return asyncio.run(self.send_lead(lead_data))


# Синглтон экземпляр сервиса
leads_sender = LeadsSenderService()
