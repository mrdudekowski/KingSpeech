/**
 * KingSpeech GAS Webhook
 * Обработка заявок с лендинга и отправка в Telegram
 */

const CONFIG = {
  TELEGRAM_BOT_TOKEN: 'YOUR_BOT_TOKEN',
  MANAGER_CHAT_ID: 'YOUR_CHAT_ID',
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID',
  SHEET_NAME: 'Leads',
  HONEYPOT_FIELD: 'website',
  REQUIRED_FIELDS: ['name'],
  CONTACT_FIELDS: ['email', 'phone']
};

function doPost(e) {
  try {
    const formData = parseFormData(e.postData.contents);
    const validation = validateLeadData(formData);
    
    if (!validation.valid) {
      return createResponse(false, validation.error, null);
    }
    
    const sheetsResult = saveToSheets(formData);
    const telegramResult = sendToTelegram(formData);
    
    return createResponse(true, 'Заявка успешно обработана', {
      sheets_saved: sheetsResult.success,
      telegram_sent: telegramResult.success,
      lead_id: sheetsResult.lead_id
    });
    
  } catch (error) {
    console.error('Ошибка обработки запроса:', error);
    return createResponse(false, 'Внутренняя ошибка сервера', null);
  }
}

function doGet(e) {
  try {
    const configCheck = checkConfiguration();
    const stats = getStats();
    
    return createResponse(true, 'GAS Webhook работает', {
      status: 'healthy',
      config: configCheck,
      stats: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Ошибка health check:', error);
    return createResponse(false, 'Ошибка проверки состояния', null);
  }
}

function parseFormData(postData) {
  const params = new URLSearchParams(postData);
  const data = {};
  
  for (const [key, value] of params.entries()) {
    data[key] = value.trim();
  }
  
  return data;
}

function validateLeadData(data) {
  if (data[CONFIG.HONEYPOT_FIELD] && data[CONFIG.HONEYPOT_FIELD].length > 0) {
    return { valid: false, error: 'Bot detected' };
  }
  
  for (const field of CONFIG.REQUIRED_FIELDS) {
    if (!data[field] || data[field].length === 0) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  
  let hasContact = false;
  for (const field of CONFIG.CONTACT_FIELDS) {
    if (data[field] && data[field].length > 0) {
      hasContact = true;
      break;
    }
  }
  
  if (!hasContact) {
    return { valid: false, error: 'At least one contact field (email or phone) is required' };
  }
  
  if (data.email && data.email.length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { valid: false, error: 'Invalid email format' };
    }
  }
  
  if (data.phone && data.phone.length > 0) {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(data.phone.replace(/\s/g, ''))) {
      return { valid: false, error: 'Invalid phone format' };
    }
  }
  
  return { valid: true };
}

function saveToSheets(data) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    
    if (!sheet) {
      return { success: false, error: 'Sheet not found' };
    }
    
    const rowData = [
      new Date(),
      data.name,
      data.email || '',
      data.phone || '',
      data.messenger || '',
      data.goal || '',
      data.page || '',
      data.ref || '',
      data.utm_source || '',
      data.utm_medium || '',
      data.utm_campaign || '',
      'GAS Webhook'
    ];
    
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, 1, rowData.length).setValues([rowData]);
    
    return { success: true, lead_id: lastRow + 1 };
    
  } catch (error) {
    console.error('Ошибка сохранения в Sheets:', error);
    return { success: false, error: error.toString() };
  }
}

function sendToTelegram(data) {
  try {
    const message = formatTelegramMessage(data);
    const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const payload = {
      chat_id: CONFIG.MANAGER_CHAT_ID,
      text: message,
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    };
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload)
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      return { success: true, message_id: result.result.message_id };
    } else {
      return { success: false, error: result.description };
    }
    
  } catch (error) {
    console.error('Ошибка отправки в Telegram:', error);
    return { success: false, error: error.toString() };
  }
}

function formatTelegramMessage(data) {
  let message = '*🎯 Новая заявка с лендинга*\n\n';
  
  const fields = {
    name: '👤 Имя',
    email: '📧 Email',
    phone: '📱 Телефон',
    messenger: '💬 Мессенджер',
    goal: '🎯 Цель',
    page: '🌐 Страница',
    ref: '🔗 Источник',
    utm_source: '📊 UTM Source',
    utm_medium: '📊 UTM Medium',
    utm_campaign: '📊 UTM Campaign'
  };
  
  for (const [field, label] of Object.entries(fields)) {
    if (data[field] && data[field].length > 0) {
      message += `${label}: \`${data[field]}\`\n`;
    }
  }
  
  message += `\n⏰ *Время:* ${new Date().toLocaleString('ru-RU')}`;
  
  return message;
}

function createResponse(success, message, data) {
  const response = {
    ok: success,
    message: message,
    data: data,
    timestamp: new Date().toISOString()
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function checkConfiguration() {
  const errors = [];
  
  if (!CONFIG.TELEGRAM_BOT_TOKEN || CONFIG.TELEGRAM_BOT_TOKEN === 'YOUR_BOT_TOKEN') {
    errors.push('TELEGRAM_BOT_TOKEN not configured');
  }
  
  if (!CONFIG.MANAGER_CHAT_ID || CONFIG.MANAGER_CHAT_ID === 'YOUR_CHAT_ID') {
    errors.push('MANAGER_CHAT_ID not configured');
  }
  
  if (!CONFIG.SPREADSHEET_ID || CONFIG.SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID') {
    errors.push('SPREADSHEET_ID not configured');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

function getStats() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    
    if (!sheet) {
      return { error: 'Sheet not found' };
    }
    
    const lastRow = sheet.getLastRow();
    const totalLeads = lastRow > 1 ? lastRow - 1 : 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let todayLeads = 0;
    if (lastRow > 1) {
      const dateRange = sheet.getRange(2, 1, lastRow - 1, 1);
      const dates = dateRange.getValues();
      
      todayLeads = dates.filter(date => {
        const leadDate = new Date(date[0]);
        leadDate.setHours(0, 0, 0, 0);
        return leadDate.getTime() === today.getTime();
      }).length;
    }
    
    return {
      total_leads: totalLeads,
      today_leads: todayLeads,
      last_lead_date: lastRow > 1 ? sheet.getRange(lastRow, 1).getValue() : null
    };
    
  } catch (error) {
    return { error: error.toString() };
  }
}

function testConfiguration() {
  console.log('🧪 Тестирование конфигурации GAS Webhook...');
  
  const sheetsTest = getStats();
  if (sheetsTest.error) {
    console.error('❌ Ошибка доступа к Sheets:', sheetsTest.error);
  } else {
    console.log('✅ Sheets доступен:', sheetsTest);
  }
  
  const telegramTest = sendToTelegram({
    name: 'Test User',
    email: 'test@example.com',
    phone: '+7 (999) 123-45-67',
    goal: 'Тестовая заявка',
    page: '/test'
  });
  
  if (telegramTest.success) {
    console.log('✅ Telegram уведомление отправлено');
  } else {
    console.error('❌ Ошибка Telegram:', telegramTest.error);
  }
  
  const configCheck = checkConfiguration();
  console.log('⚙️ Конфигурация:', configCheck);
  
  return {
    sheets: !sheetsTest.error,
    telegram: telegramTest.success,
    config: configCheck.valid
  };
}