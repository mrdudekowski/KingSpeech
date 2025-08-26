# KingSpeech Project 🎓

Полный проект для школы английского языка KingSpeech, включающий лендинг и Telegram бота для лидогенерации.

## 📁 Структура проекта

```
landing/
├── KingSpeech/           # Лендинг сайт
│   ├── index.html       # Главная страница
│   ├── script.js        # JavaScript с GAS интеграцией
│   ├── styles.css       # Стили сайта
│   ├── gas_webhook.gs   # Google Apps Script
│   ├── GAS_SETUP.md     # Инструкции по настройке GAS
│   └── ...              # Другие файлы лендинга
├── kingspeech-bot/       # Telegram бот
│   ├── kingspeech_bot.py # Основной файл бота
│   ├── dialogs/         # Диалоги бота
│   ├── services/        # Сервисы
│   ├── locales/         # Локализация
│   └── ...              # Другие файлы бота
└── README.md            # Этот файл
```

## 🚀 Быстрый старт

### Лендинг (KingSpeech/)

1. **Настройка GAS Webhook:**
   - Следуйте инструкциям в `KingSpeech/GAS_SETUP.md`
   - Настройте Google Apps Script для обработки заявок

2. **Запуск лендинга:**
   - Откройте `KingSpeech/index.html` в браузере
   - Или разместите на хостинге

### Telegram Бот (kingspeech-bot/)

1. **Установка зависимостей:**
   ```bash
   cd kingspeech-bot
   pip install -r requirements.txt
   ```

2. **Настройка переменных окружения:**
   ```bash
   cp .env.example .env
   # Отредактируйте .env файл
   ```

3. **Запуск бота:**
   ```bash
   python kingspeech_bot.py
   ```

## 🔧 Интеграция

### GAS Webhook для лендинга
- Обрабатывает заявки с лендинга
- Сохраняет в Google Sheets
- Отправляет уведомления в Telegram

### Telegram Бот
- 7-шаговый опрос для лидогенерации
- Автоматическое сохранение в Google Sheets
- Мультиязычная поддержка

## 📊 Функциональность

### Лендинг
- ✅ Современный дизайн
- ✅ Адаптивная верстка
- ✅ Интеграция с GAS
- ✅ Валидация форм
- ✅ Аналитика

### Telegram Бот
- ✅ 7-шаговый опрос
- ✅ Автоматическое создание листов
- ✅ Пересылка в рабочий чат
- ✅ Мультиязычность
- ✅ Валидация данных

## 🛠 Технологии

### Лендинг
- HTML5, CSS3, JavaScript
- Google Apps Script
- TailwindCSS (через CDN)

### Telegram Бот
- Python 3.8+
- python-telegram-bot
- Google Sheets API
- Модульная архитектура

## 📝 Разработка

### Коммиты
- **Лендинг:** коммиты в `KingSpeech/`
- **Бот:** коммиты в `kingspeech-bot/`

### Структура коммитов
```
feat: add new landing page feature
fix: resolve bot dialog issue
docs: update GAS setup instructions
```

## 🔒 Безопасность

- Все токены в переменных окружения
- Валидация входных данных
- CORS настройки для GAS
- Rate limiting для бота

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи
2. Убедитесь в правильности настроек
3. Проверьте права доступа к API

---

**Создано для KingSpeech** 🎓


