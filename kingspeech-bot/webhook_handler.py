#!/usr/bin/env python3
"""
Webhook Handler for KingSpeech Bot
Handles form submissions from the landing page
"""

import logging
import json
import os
from datetime import datetime
from typing import Dict, Any, Optional
from flask import Flask, request, jsonify
from services.leads_sender import leads_sender
from services.cached_sheets_service import cached_sheets_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Secret key for webhook authentication (set in environment variables)
WEBHOOK_SECRET = os.getenv('WEBHOOK_SECRET', 'your-secret-key-here')

def validate_webhook_data(data: Dict[str, Any]) -> bool:
    """Validate incoming webhook data"""
    required_fields = ['name', 'phone']
    return all(field in data and data[field] for field in required_fields)

def format_lead_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Format webhook data into lead format"""
    return {
        "name": data.get('name', 'Не указано'),
        "phone": data.get('phone', 'Не указан'),
        "language": "English",  # Fixed for English school
        "level": data.get('level', 'Не указан'),
        "goals": data.get('goals', 'Не указаны'),
        "format": data.get('format', 'Не указан'),
        "expectations": data.get('expectations', 'Не указаны'),
        "schedule": data.get('schedule', 'Не указано'),
        "telegram_id": "Сайт",  # Indicates source
        "telegram_username": "Landing Form",
        "timestamp": datetime.now().strftime("%d.%m.%Y %H:%M"),
        "source": "landing_website"
    }

def save_to_sheets(data: Dict[str, Any]) -> bool:
    """Save lead data to Google Sheets"""
    try:
        sheet_data = [
            "Сайт",  # telegram_id
            "Landing Form",  # telegram_username
            data.get('phone', ''),
            data.get('name', ''),
            "English",  # language
            data.get('level', ''),
            data.get('goals', ''),
            data.get('format', ''),
            data.get('expectations', ''),
            data.get('schedule', ''),
            "Сайт"  # source indicator
        ]
        cached_sheets_service.append_user_row(sheet_data)
        return True
    except Exception as e:
        logger.error(f"Error saving to sheets: {e}")
        return False

@app.route('/webhook/lead', methods=['POST'])
def handle_lead_webhook():
    """Handle lead submission from landing page"""
    try:
        # Get request data
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form.to_dict()
        
        logger.info(f"Received webhook data: {data}")
        
        # Validate secret key (optional but recommended)
        auth_header = request.headers.get('Authorization')
        if auth_header != f"Bearer {WEBHOOK_SECRET}":
            logger.warning("Invalid webhook secret")
            return jsonify({"error": "Unauthorized"}), 401
        
        # Validate data
        if not validate_webhook_data(data):
            logger.error("Invalid webhook data")
            return jsonify({"error": "Invalid data"}), 400
        
        # Format lead data
        lead_data = format_lead_data(data)
        
        # Send to Telegram
        telegram_success = leads_sender.send_lead_sync(lead_data)
        
        # Save to Google Sheets
        sheets_success = save_to_sheets(data)
        
        # Log the lead
        logger.info(f"Lead processed - Telegram: {telegram_success}, Sheets: {sheets_success}")
        
        # Return response
        if telegram_success and sheets_success:
            return jsonify({
                "success": True,
                "message": "Lead successfully processed",
                "telegram_sent": telegram_success,
                "sheets_saved": sheets_success
            }), 200
        else:
            return jsonify({
                "success": False,
                "message": "Lead processed with errors",
                "telegram_sent": telegram_success,
                "sheets_saved": sheets_success
            }), 500
            
    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/webhook/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "webhook_handler"}), 200

if __name__ == '__main__':
    port = int(os.getenv('WEBHOOK_PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
