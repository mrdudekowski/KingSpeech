import pytest
import asyncio
from unittest.mock import Mock
from services.rate_limiter import RateLimiter, RateLimitConfig
from services.validators import InputValidator
from services.dialog_manager import DialogManager


@pytest.fixture(scope="session")
def fast_rate_limiter():
    """Быстрый rate limiter для тестов с уменьшенными задержками"""
    return RateLimiter(RateLimitConfig(
        max_requests=2,  # Уменьшено для тестов
        window_seconds=0.1,  # Уменьшенное окно
        cooldown_seconds=0.05  # Уменьшенный cooldown
    ))


@pytest.fixture(scope="session")
def ultra_fast_rate_limiter():
    """Сверхбыстрый rate limiter для тестов производительности"""
    return RateLimiter(RateLimitConfig(
        max_requests=3,
        window_seconds=0.01,  # Очень маленькое окно
        cooldown_seconds=0.01  # Очень маленький cooldown
    ))


@pytest.fixture(scope="session")
def input_validator():
    """Экземпляр валидатора для тестов"""
    return InputValidator()


@pytest.fixture(scope="session")
def dialog_manager():
    """Экземпляр менеджера диалогов для тестов"""
    return DialogManager()


@pytest.fixture
def mock_context():
    """Mock контекст для тестов диалогов"""
    context = Mock()
    context.get_variable = Mock(side_effect=lambda key, default=None: {
        'interface_lang': 'ru',
        'user_name': '',
        'phone': '',
        'email': '',
        'telegram_username': 'test_user',
        'tutor_questions_left': 3,
        'test_current_question': 0,
        'test_score': 0,
        'test_answers': [],
        'test_result_score': 60.0,
        'test_result_level': 'B1-B2 (Intermediate)'
    }.get(key, default))
    context.set_variable = Mock()
    return context


@pytest.fixture
def mock_bot():
    """Mock бота для тестов"""
    bot = Mock()
    bot.send_message = Mock()
    bot.edit_message_text = Mock()
    bot.answer_callback_query = Mock()
    return bot


@pytest.fixture(scope="session")
def event_loop():
    """Создание event loop для асинхронных тестов"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    yield loop
    loop.close()


# Настройка pytest для ускорения тестов
def pytest_configure(config):
    """Конфигурация pytest для оптимизации"""
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )
    config.addinivalue_line(
        "markers", "fast: marks tests as fast (deselect with '-m \"not fast\"')"
    )


def pytest_collection_modifyitems(config, items):
    """Автоматическая маркировка медленных тестов"""
    for item in items:
        # Маркируем тесты rate limiter как медленные
        if "rate_limiter" in item.nodeid:
            item.add_marker(pytest.mark.slow)
        # Маркируем тесты валидации как быстрые
        elif "validators" in item.nodeid:
            item.add_marker(pytest.mark.fast)
