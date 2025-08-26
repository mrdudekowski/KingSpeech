# DIALOG_DESIGN — методичка по проектированию диалогов

## Принципы
- Один шаг — одна цель. Сообщение + варианты + следующий шаг
- Никаких хардкодных текстов — только ключи локализации
- Контекст хранит значения по ключам, без глобальных переменных
- Ошибки и валидация — явные и локализованные

## Шаблон шага
```python
@dialog.step()
def step_name(context: Context, choice: str | None = None) -> Step:
    lang = context.get_variable('interface_lang', 'ru')
    if not choice:
        return Step(message=localization.t('key_here', lang), options=[...], next_step=step_name)
    # обработка выбора
    context.set_variable('key', choice)
    return next_step(context)
```

## Локализация
- Ключи в `locales/ru.json` — эталон
- У всех языков должны быть те же ключи
- Fallback: `lang -> ru -> en -> key`

## Валидация
- Валидация на уровне шага (пример: телефон только через кнопку)
- При ошибке возвращайте `Step` с объяснением и тем же `next_step`

## Сбор данных и экспорт
- Храните все ответы пользователя в `Context`
- На финальном шаге соберите массив и вызовите `SheetsService.append_user_row`
- Нормализацию языка/уровней делайте в одном месте (финальный шаг)

## Примеры ключей локализации
```
ask_name, ask_language, ask_level, ask_goal, ask_format,
ask_expectations, ask_start_date, ask_phone, thanks, error
```

## Рекомендации
- Избегайте длинных сообщений — дробите на шаги
- Всегда предлагайте понятные варианты
- Добавляйте прогресс-бары/индикаторы по желанию
