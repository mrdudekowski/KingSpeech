import json
import os
from typing import Any, Dict

_DEFAULTS: Dict[str, Any] = {
    "enable_ai_tutor": True,
    "export_language": "ru",
    "supported_interface_languages": ["ru", "en", "zh"],
    "notify_manager": False,
    "transport": "polling",  # polling | webhook
    "logging_level": "INFO",
}

class Settings:
    def __init__(self, path: str = "settings.json") -> None:
        self.path = path
        self._data: Dict[str, Any] = {}
        self._load()

    def _load(self) -> None:
        if os.path.isfile(self.path):
            try:
                with open(self.path, encoding="utf-8") as f:
                    self._data = json.load(f)
            except Exception:
                self._data = {}
        else:
            self._data = {}

    def get(self, key: str, default: Any = None) -> Any:
        if default is None:
            default = _DEFAULTS.get(key)
        return self._data.get(key, default)

settings = Settings()
