#!/usr/bin/env python3
"""
Тестирование интеграции KingSpeech с GAS Webhook
"""

import requests
import json
import time
from urllib.parse import urlencode

class GASIntegrationTester:
    def __init__(self, gas_url):
        self.gas_url = gas_url
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'KingSpeech-Tester/1.0',
            'Content-Type': 'application/x-www-form-urlencoded'
        })
    
    def test_health_check(self):
        """Тест GET запроса (health check)"""
        print("🔍 Тестирование health check...")
        
        try:
            response = self.session.get(self.gas_url)
            print(f"   Статус: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   Ответ: {json.dumps(data, indent=2, ensure_ascii=False)}")
                return True
            else:
                print(f"   Ошибка: {response.text}")
                return False
                
        except Exception as e:
            print(f"   Ошибка запроса: {e}")
            return False
    
    def test_lead_submission(self, test_data=None):
        """Тест отправки заявки"""
        print("📝 Тестирование отправки заявки...")
        
        if test_data is None:
            test_data = {
                'name': 'Тестовый Пользователь',
                'email': 'test@example.com',
                'phone': '+7 (999) 123-45-67',
                'messenger': 'Telegram',
                'goal': 'Изучение английского',
                'page': '/test',
                'ref': 'https://google.com',
                'utm_source': 'test',
                'utm_medium': 'manual',
                'utm_campaign': 'integration_test',
                'website': ''  # honeypot поле
            }
        
        try:
            response = self.session.post(
                self.gas_url,
                data=test_data
            )
            
            print(f"   Статус: {response.status_code}")
            print(f"   Заголовки: {dict(response.headers)}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   Ответ: {json.dumps(data, indent=2, ensure_ascii=False)}")
                return data.get('ok', False)
            else:
                print(f"   Ошибка: {response.text}")
                return False
                
        except Exception as e:
            print(f"   Ошибка запроса: {e}")
            return False
    
    def test_invalid_data(self):
        """Тест обработки некорректных данных"""
        print("❌ Тестирование некорректных данных...")
        
        invalid_data = {
            'email': 'test@example.com',
            'phone': '+7 (999) 123-45-67'
        }
        
        try:
            response = self.session.post(
                self.gas_url,
                data=invalid_data
            )
            
            print(f"   Статус: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if not data.get('ok', True):
                    print(f"   ✅ Корректно отклонено: {data.get('message', 'Unknown error')}")
                    return True
                else:
                    print(f"   ❌ Неожиданный успех: {data}")
                    return False
            else:
                print(f"   Ошибка: {response.text}")
                return False
                
        except Exception as e:
            print(f"   Ошибка запроса: {e}")
            return False
    
    def test_honeypot_protection(self):
        """Тест honeypot защиты"""
        print("🕷️ Тестирование honeypot защиты...")
        
        honeypot_data = {
            'name': 'Тестовый Пользователь',
            'email': 'test@example.com',
            'phone': '+7 (999) 123-45-67',
            'website': 'spam-bot'  # honeypot поле заполнено
        }
        
        try:
            response = self.session.post(
                self.gas_url,
                data=honeypot_data
            )
            
            print(f"   Статус: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if not data.get('ok', True):
                    print(f"   ✅ Спам корректно заблокирован: {data.get('message', 'Unknown error')}")
                    return True
                else:
                    print(f"   ❌ Спам не заблокирован: {data}")
                    return False
            else:
                print(f"   Ошибка: {response.text}")
                return False
                
        except Exception as e:
            print(f"   Ошибка запроса: {e}")
            return False
    
    def test_cors_headers(self):
        """Тест CORS заголовков"""
        print("🌐 Тестирование CORS заголовков...")
        
        try:
            response = self.session.options(self.gas_url)
            print(f"   Статус OPTIONS: {response.status_code}")
            
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
            }
            
            print(f"   CORS заголовки: {cors_headers}")
            
            if cors_headers['Access-Control-Allow-Origin']:
                print("   ✅ CORS заголовки присутствуют")
                return True
            else:
                print("   ⚠️ CORS заголовки отсутствуют")
                return False
                
        except Exception as e:
            print(f"   Ошибка CORS теста: {e}")
            return False
    
    def run_all_tests(self):
        """Запуск всех тестов"""
        print("🧪 Запуск полного тестирования GAS интеграции")
        print("=" * 50)
        
        results = {
            'health_check': self.test_health_check(),
            'lead_submission': self.test_lead_submission(),
            'invalid_data': self.test_invalid_data(),
            'honeypot_protection': self.test_honeypot_protection(),
            'cors_headers': self.test_cors_headers()
        }
        
        print("\n" + "=" * 50)
        print("📊 Результаты тестирования:")
        
        passed = 0
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ ПРОЙДЕН" if result else "❌ ПРОВАЛЕН"
            print(f"   {test_name}: {status}")
            if result:
                passed += 1
        
        print(f"\n🎯 Итого: {passed}/{total} тестов пройдено")
        
        if passed == total:
            print("🎉 Все тесты пройдены! GAS интеграция работает корректно.")
        else:
            print("⚠️ Некоторые тесты не пройдены. Проверьте настройки GAS.")
        
        return results

def main():
    """Основная функция"""
    print("KingSpeech GAS Integration Tester")
    print("=" * 40)
    
    gas_url = input("Введите URL вашего GAS webhook: ").strip()
    
    if not gas_url:
        print("❌ URL не указан")
        return
    
    tester = GASIntegrationTester(gas_url)
    results = tester.run_all_tests()
    
    print("\n📋 Следующие шаги:")
    print("1. Проверьте, что тестовое сообщение пришло в Telegram")
    print("2. Проверьте, что данные сохранились в Google Sheets")
    print("3. Протестируйте отправку заявки с реального лендинга")
    
    if results['lead_submission']:
        print("\n✅ Готово к использованию! Обновите URL в script.js и протестируйте лендинг.")
    else:
        print("\n❌ Есть проблемы с GAS. Проверьте настройки и повторите тест.")

if __name__ == "__main__":
    main()
