#!/usr/bin/env python3
"""
Check bot via Telegram API
"""

import requests
import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import TELEGRAM_BOT_TOKEN

def check_bot():
    """Check bot via Telegram API"""
    print("Checking bot via Telegram API...")
    
    # Test getMe endpoint
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getMe"
    
    try:
        response = requests.get(url, timeout=10)
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Bot info:")
            print(f"  ID: {data['result']['id']}")
            print(f"  Name: {data['result']['first_name']}")
            print(f"  Username: {data['result']['username']}")
            print(f"  Can join groups: {data['result']['can_join_groups']}")
            print(f"  Can read all group messages: {data['result']['can_read_all_group_messages']}")
            print(f"  Supports inline queries: {data['result']['supports_inline_queries']}")
            print("✅ Bot is valid and active!")
            return True
        else:
            print(f"❌ Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error checking bot: {e}")
        return False

def test_webhook():
    """Test webhook info"""
    print("\nChecking webhook info...")
    
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getWebhookInfo"
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"Webhook URL: {data['result']['url']}")
            print(f"Has custom certificate: {data['result']['has_custom_certificate']}")
            print(f"Pending update count: {data['result']['pending_update_count']}")
            print(f"Last error date: {data['result']['last_error_date']}")
            print(f"Last error message: {data['result']['last_error_message']}")
            
            if data['result']['url']:
                print("⚠️  Webhook is set - this might interfere with polling")
            else:
                print("✅ No webhook set - polling should work")
                
    except Exception as e:
        print(f"❌ Error checking webhook: {e}")

if __name__ == "__main__":
    check_bot()
    test_webhook()
