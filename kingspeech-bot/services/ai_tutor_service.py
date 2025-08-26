import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
API_URL = "https://openrouter.ai/api/v1/chat/completions"
headers = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "Content-Type": "application/json",
    "HTTP-Referer": "https://simplesmart.ru",  # можно указать свой сайт или любой домен
    "X-Title": "SimpleSmart Tutor"
}

# Загружаем параметры тьютора
with open("tutor_config.json", encoding="utf-8") as f:
    TUTOR_CONFIG = json.load(f)

SYSTEM_PROMPT = TUTOR_CONFIG.get("system_prompt", "")
MAX_TOKENS = TUTOR_CONFIG.get("max_tokens", 256)
TEMPERATURE = TUTOR_CONFIG.get("temperature", 0.7)
MODEL = "mistralai/mistral-7b-instruct"  # Можно выбрать любую поддерживаемую модель

def ask_openrouter(prompt: str, max_tokens: int = None, temperature: float = None) -> str:
    if max_tokens is None:
        max_tokens = MAX_TOKENS
    if temperature is None:
        temperature = TEMPERATURE
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": max_tokens,
        "temperature": temperature
    }
    response = requests.post(API_URL, headers=headers, json=payload, timeout=60)
    response.raise_for_status()
    result = response.json()
    return result["choices"][0]["message"]["content"] 