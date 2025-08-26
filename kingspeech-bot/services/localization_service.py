import json
import os
from typing import Dict

class LocalizationService:
    def __init__(self, locales_dir='locales'):
        self.locales: Dict[str, Dict[str, str]] = {}
        self.locales_dir = locales_dir
        self._load_locales()

    def _load_locales(self):
        if not os.path.isdir(self.locales_dir):
            return
        for filename in os.listdir(self.locales_dir):
            if not filename.endswith('.json'):
                continue
            lang = filename[:-5]
            path = os.path.join(self.locales_dir, filename)
            with open(path, encoding='utf-8') as f:
                self.locales[lang] = json.load(f)

    def t(self, key, lang='ru', **kwargs):
        # fallback chain: lang -> ru -> en -> key
        text = (
            self.locales.get(lang, {}).get(key)
            or self.locales.get('ru', {}).get(key)
            or self.locales.get('en', {}).get(key)
            or key
        )
        if kwargs:
            try:
                return text.format(**kwargs)
            except Exception:
                return text
        return text

localization = LocalizationService() 