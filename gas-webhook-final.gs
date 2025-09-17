/**
 * KingSpeech GAS Webhook - Final Working Version
 * Обработка заявок с лендинга и отправка в Telegram + Google Sheets
 * Полностью исправлены все ошибки
 */

const CONFIG = {
  // Telegram Bot настройки
  TELEGRAM_BOT_TOKEN: 'YOUR_BOT_TOKEN',
  MANAGER_CHAT_ID: 'YOUR_CHAT_ID',
  
  // Google Sheets настройки
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID',
  SHEET_NAME: 'LEADS',
  
  // Безопасность
  HONEYPOT_FIELD: 'website',
  REQUIRED_FIELDS: ['name'],
  CONTACT_FIELDS: ['email', 'phone'],
  
  // Форматирование
  DATE_FORMAT: 'dd.MM.yyyy, HH:mm:ss',
  TIMEZONE: 'Europe/Moscow'
};

/**
 * Обработка POST запросов (отправка заявок)
 */
function doPost(e) {
  try {
    // Проверяем наличие данных
    if (!e || !e.postData) {
      console.log('❌ Нет данных POST запроса');
      return createResponse(false, 'No POST data received', null);
    }
    
    console.log('📥 Получен POST запрос:', e.postData.contents);
    
    const formData = parseFormData(e.postData.contents);
    console.log('📋 Данные формы:', formData);
    
    const validation = validateLeadData(formData);
    if (!validation.valid) {
      console.log('❌ Валидация не пройдена:', validation.error);
      return createResponse(false, validation.error, null);
    }
    
    // Сохраняем в Google Sheets
    const sheetsResult = saveToSheets(formData);
    console.log('📊 Результат сохранения в Sheets:', sheetsResult);
    
    // Отправляем в Telegram
    const telegramResult = sendToTelegram(formData);
    console.log('📱 Результат отправки в Telegram:', telegramResult);
    
    return createResponse(true, 'Заявка успешно обработана', {
      sheets_saved: sheetsResult.success,
      telegram_sent: telegramResult.success,
      lead_id: sheetsResult.lead_id,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('💥 Ошибка обработки запроса:', error);
    return createResponse(false, 'Внутренняя ошибка сервера: ' + error.toString(), null);
  }
}

/**
 * Обработка GET запросов (health check)
 */
function doGet(e) {
  try {
    console.log('🔍 Health check запрос');
    
    const configCheck = checkConfiguration();
    const stats = getStats();
    
    return createResponse(true, 'GAS Webhook работает', {
      status: 'healthy',
      config: configCheck,
      stats: stats,
      timestamp: new Date().toISOString(),
      version: '2.2.0'
    });
    
  } catch (error) {
    console.error('💥 Ошибка health check:', error);
    return createResponse(false, 'Ошибка проверки состояния: ' + error.toString(), null);
  }
}

/**
 * Обработка OPTIONS запросов (CORS preflight)
 */
function doOptions(e) {
  return createResponse(true, 'CORS preflight', null);
}

/**
 * Парсинг данных формы
 */
function parseFormData(postData) {
  const params = new URLSearchParams(postData);
  const data = {};
  
  for (const [key, value] of params.entries()) {
    data[key] = value.trim();
  }
  
  return data;
}

/**
 * Валидация данных заявки
 */
function validateLeadData(data) {
  // Проверка honeypot (защита от ботов)
  if (data[CONFIG.HONEYPOT_FIELD] && data[CONFIG.HONEYPOT_FIELD].length > 0) {
    return { valid: false, error: 'Bot detected - honeypot field filled' };
  }
  
  // Проверка обязательных полей
  for (const field of CONFIG.REQUIRED_FIELDS) {
    if (!data[field] || data[field].length === 0) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  
  // Проверка контактных данных (хотя бы одно поле)
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
  
  // Валидация email
  if (data.email && data.email.length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { valid: false, error: 'Invalid email format' };
    }
  }
  
  // Валидация телефона
  if (data.phone && data.phone.length > 0) {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(data.phone.replace(/\s/g, ''))) {
      return { valid: false, error: 'Invalid phone format' };
    }
  }
  
  return { valid: true };
}

/**
 * Сохранение в Google Sheets
 */
function saveToSheets(data) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    
    // Создаем лист если не существует
    if (!sheet) {
      sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
      setupSheetHeaders(sheet);
    }
    
    // Форматируем данные
    const formattedData = formatDataForSheets(data);
    
    // Добавляем новую строку
    const lastRow = sheet.getLastRow();
    const newRow = lastRow + 1;
    
    // Записываем данные
    sheet.getRange(newRow, 1, 1, formattedData.length).setValues([formattedData]);
    
    // Применяем форматирование
    formatSheetRow(sheet, newRow, formattedData);
    
    console.log('✅ Данные сохранены в строку:', newRow);
    
    return { success: true, lead_id: newRow };
    
  } catch (error) {
    console.error('❌ Ошибка сохранения в Sheets:', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Настройка заголовков листа
 */
function setupSheetHeaders(sheet) {
  const headers = [
    '⏰ Время',
    '👤 Имя',
    '📧 Email',
    '📱 Телефон',
    '💬 Мессенджер',
    '🎯 Цель',
    '🌐 Страница',
    '🔗 Источник',
    '📊 UTM Source',
    '📊 UTM Medium',
    '📊 UTM Campaign',
    '🌐 Источник'
  ];
  
  // Записываем заголовки
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Форматируем заголовки
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  // Замораживаем первую строку
  sheet.setFrozenRows(1);
  
  // Настраиваем ширину колонок
  sheet.setColumnWidth(1, 150); // Время
  sheet.setColumnWidth(2, 200); // Имя
  sheet.setColumnWidth(3, 250); // Email
  sheet.setColumnWidth(4, 150); // Телефон
  sheet.setColumnWidth(5, 120); // Мессенджер
  sheet.setColumnWidth(6, 200); // Цель
  sheet.setColumnWidth(7, 150); // Страница
  sheet.setColumnWidth(8, 150); // Источник
  sheet.setColumnWidth(9, 120); // UTM Source
  sheet.setColumnWidth(10, 120); // UTM Medium
  sheet.setColumnWidth(11, 120); // UTM Campaign
  sheet.setColumnWidth(12, 120); // Источник
}

/**
 * Форматирование данных для Sheets
 */
function formatDataForSheets(data) {
  const now = new Date();
  const formattedTime = Utilities.formatDate(now, CONFIG.TIMEZONE, CONFIG.DATE_FORMAT);
  
  return [
    formattedTime, // ⏰ Время
    data.name || '', // 👤 Имя
    data.email || '', // 📧 Email
    data.phone || '', // 📱 Телефон
    data.messenger || '', // 💬 Мессенджер
    data.goal || '', // 🎯 Цель
    data.page || '', // 🌐 Страница
    data.ref || '', // 🔗 Источник
    data.utm_source || '', // 📊 UTM Source
    data.utm_medium || '', // 📊 UTM Medium
    data.utm_campaign || '', // 📊 UTM Campaign
    'GAS Webhook' // 🌐 Источник
  ];
}

/**
 * Форматирование строки в Sheets
 */
function formatSheetRow(sheet, row, data) {
  const range = sheet.getRange(row, 1, 1, data.length);
  
  // Чередующиеся цвета строк
  if (row % 2 === 0) {
    range.setBackground('#f8f9fa');
  }
  
  // Форматирование времени
  sheet.getRange(row, 1).setNumberFormat('dd.mm.yyyy hh:mm:ss');
  
  // Выравнивание
  range.setHorizontalAlignment('left');
  range.setVerticalAlignment('middle');
  
  // Границы
  range.setBorder(true, true, true, true, true, true);
}

/**
 * Отправка уведомления в Telegram
 */
function sendToTelegram(data) {
  try {
    const message = formatTelegramMessage(data);
    const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const payload = {
      chat_id: CONFIG.MANAGER_CHAT_ID,
      text: message,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      disable_notification: false
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
      console.log('✅ Telegram уведомление отправлено');
      return { success: true, message_id: result.result.message_id };
    } else {
      console.error('❌ Ошибка Telegram:', result.description);
      return { success: false, error: result.description };
    }
    
  } catch (error) {
    console.error('❌ Ошибка отправки в Telegram:', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Форматирование сообщения для Telegram
 */
function formatTelegramMessage(data) {
  const now = new Date();
  const formattedTime = Utilities.formatDate(now, CONFIG.TIMEZONE, CONFIG.DATE_FORMAT);
  
  let message = '*🎯 Новая заявка с лендинга*\n\n';
  
  // Обязательные поля
  message += `👤 *Имя:* ${data.name}\n`;
  
  // Контактные данные
  if (data.email) {
    message += `📧 *Email:* \`${data.email}\`\n`;
  }
  
  if (data.phone) {
    message += `📱 *Телефон:* \`${data.phone}\`\n`;
  }
  
  if (data.messenger) {
    message += `💬 *Мессенджер:* ${data.messenger}\n`;
  }
  
  // Дополнительные поля
  if (data.goal) {
    message += `🎯 *Цель:* ${data.goal}\n`;
  }
  
  if (data.page) {
    message += `🌐 *Страница:* ${data.page}\n`;
  }
  
  if (data.ref) {
    message += `🔗 *Источник:* ${data.ref}\n`;
  }
  
  // UTM метки
  if (data.utm_source || data.utm_medium || data.utm_campaign) {
    message += `\n📊 *UTM метки:*\n`;
    if (data.utm_source) message += `• Source: ${data.utm_source}\n`;
    if (data.utm_medium) message += `• Medium: ${data.utm_medium}\n`;
    if (data.utm_campaign) message += `• Campaign: ${data.utm_campaign}\n`;
  }
  
  message += `\n⏰ *Время:* ${formattedTime}`;
  message += `\n🌐 *Источник:* GAS Webhook`;
  
  return message;
}

/**
 * Создание HTTP ответа (ИСПРАВЛЕННАЯ ВЕРСИЯ)
 */
function createResponse(success, message, data) {
  const response = {
    ok: success,
    message: message,
    data: data,
    timestamp: new Date().toISOString(),
    version: '2.2.0'
  };
  
  // Создаем текстовый вывод
  const output = ContentService
    .createTextOutput(JSON.stringify(response, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
  
  return output;
}

/**
 * Проверка конфигурации
 */
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
    errors: errors,
    configured_fields: {
      telegram: !errors.includes('TELEGRAM_BOT_TOKEN') && !errors.includes('MANAGER_CHAT_ID'),
      sheets: !errors.includes('SPREADSHEET_ID')
    }
  };
}

/**
 * Получение статистики
 */
function getStats() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    
    if (!sheet) {
      return { error: 'Sheet not found' };
    }
    
    const lastRow = sheet.getLastRow();
    const totalLeads = lastRow > 1 ? lastRow - 1 : 0;
    
    // Статистика за сегодня
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
      last_lead_date: lastRow > 1 ? sheet.getRange(lastRow, 1).getValue() : null,
      sheet_name: CONFIG.SHEET_NAME
    };
    
  } catch (error) {
    return { error: error.toString() };
  }
}

/**
 * Тестирование конфигурации
 */
function testConfiguration() {
  console.log('🧪 Тестирование конфигурации GAS Webhook...');
  
  const configCheck = checkConfiguration();
  console.log('⚙️ Конфигурация:', configCheck);
  
  if (!configCheck.valid) {
    console.error('❌ Конфигурация неполная:', configCheck.errors);
    return { success: false, errors: configCheck.errors };
  }
  
  // Тест Sheets
  const sheetsTest = getStats();
  if (sheetsTest.error) {
    console.error('❌ Ошибка доступа к Sheets:', sheetsTest.error);
  } else {
    console.log('✅ Sheets доступен:', sheetsTest);
  }
  
  // Тест Telegram
  const telegramTest = sendToTelegram({
    name: 'Test User',
    email: 'test@example.com',
    phone: '+7 (999) 123-45-67',
    messenger: 'Telegram',
    goal: 'Тестовая заявка',
    page: '/test'
  });
  
  if (telegramTest.success) {
    console.log('✅ Telegram уведомление отправлено');
  } else {
    console.error('❌ Ошибка Telegram:', telegramTest.error);
  }
  
  return {
    success: !sheetsTest.error && telegramTest.success,
    sheets: !sheetsTest.error,
    telegram: telegramTest.success,
    config: configCheck.valid
  };
}
