/**
 * GAS Integration Module
 * Интеграция с Google Apps Script для отправки заявок в Telegram
 */

class GASIntegration {
  constructor() {
    this.config = {
      // Замените на ваш реальный URL GAS webhook
      GAS_WEBHOOK_URL: 'https://script.google.com/macros/s/AKfycbzGqv62eDqHzeM91KNKpuJzw6sKrYhYWsfjmjMfoNlb5TKr5cmajA-BLh5aIiFG_EWA/exec',
      
      // Fallback URL (если основной не работает)
      FALLBACK_URL: null,
      
      // Настройки запросов
      REQUEST: {
        timeout: 10000, // 10 секунд
        retries: 2
      },
      
      // Уведомления
      NOTIFICATIONS: {
        success: {
          title: 'Заявка отправлена!',
          message: 'Мы свяжемся с вами в ближайшее время.'
        },
        error: {
          title: 'Ошибка отправки',
          message: 'Попробуйте еще раз или свяжитесь с нами напрямую.'
        },
        cors_error: {
          title: 'Проблема с подключением',
          message: 'Проверьте настройки GAS webhook.'
        }
      }
    };
    
    this.isHealthy = false;
    this.init();
  }

  /**
   * Инициализация модуля
   */
  init() {
    console.log('🔗 GAS Integration initialized');
    this.checkHealth();
  }

  /**
   * Проверка доступности GAS webhook
   */
  async checkHealth() {
    try {
      const response = await fetch(this.config.GAS_WEBHOOK_URL, {
        method: 'GET',
        mode: 'cors',
        timeout: this.config.REQUEST.timeout
      });

      if (response.ok) {
        const data = await response.json();
        this.isHealthy = data.ok === true;
        console.log('✅ GAS Webhook healthy:', data);
      } else {
        this.isHealthy = false;
        console.warn('⚠️ GAS Webhook unhealthy:', response.status);
      }
    } catch (error) {
      this.isHealthy = false;
      console.error('❌ GAS Webhook check failed:', error);
    }
  }

  /**
   * Отправка заявки через GAS webhook с улучшенной обработкой ошибок
   */
  async submitLead(formData) {
    try {
      console.log('📤 Отправка заявки через GAS...', formData);

      // Добавляем honeypot поле (защита от спама)
      const dataWithHoneypot = {
        ...formData,
        website: '', // Honeypot - должно быть пустым
        page: window.location.pathname,
        ref: document.referrer,
        utm_source: this.getUrlParameter('utm_source'),
        utm_medium: this.getUrlParameter('utm_medium'),
        utm_campaign: this.getUrlParameter('utm_campaign')
      };

      const response = await this.sendRequest(dataWithHoneypot);
      
      if (response.ok) {
        console.log('✅ Заявка успешно отправлена:', response);
        return {
          success: true,
          data: response.data,
          message: response.message
        };
      } else {
        console.error('❌ Ошибка отправки заявки:', response);
        return {
          success: false,
          error: response.message || 'Неизвестная ошибка'
        };
      }

    } catch (error) {
      console.error('❌ Ошибка при отправке заявки:', error);
      
      // Детальная обработка ошибок
      let errorMessage = 'Ошибка сети. Попробуйте еще раз.';
      
      if (error.message.includes('CORS')) {
        errorMessage = 'Проблема с CORS. Заявка может быть отправлена, но ответ не получен.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Не удалось подключиться к серверу. Проверьте интернет-соединение.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Превышено время ожидания. Попробуйте еще раз.';
      }
      
      return {
        success: false,
        error: errorMessage,
        details: error.message
      };
    }
  }

  /**
   * Отправка HTTP запроса с fallback методами
   */
  async sendRequest(data, retryCount = 0) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.REQUEST.timeout);
    
    try {
      // Метод 1: Стандартный fetch с CORS
      const response = await fetch(this.config.GAS_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: this.encodeFormData(data),
        signal: controller.signal,
        mode: 'cors'  // Пробуем с CORS
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      clearTimeout(timeoutId);
      
      // Если CORS ошибка, пробуем no-cors
      if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        console.log('🔄 CORS error, trying no-cors method...');
        return this.sendRequestNoCors(data, retryCount);
      }
      
      // Retry logic
      if (retryCount < this.config.REQUEST.retries) {
        console.log(`🔄 Retry ${retryCount + 1}/${this.config.REQUEST.retries}`);
        await this.delay(1000 * (retryCount + 1)); // Exponential backoff
        return this.sendRequest(data, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Отправка запроса без CORS (fallback)
   */
  async sendRequestNoCors(data, retryCount = 0) {
    try {
      const response = await fetch(this.config.GAS_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: this.encodeFormData(data),
        mode: 'no-cors'  // Без CORS
      });

      // При no-cors мы не можем прочитать ответ, но запрос отправлен
      console.log('✅ Запрос отправлен (no-cors mode)');
      return {
        ok: true,
        message: 'Заявка отправлена (no-cors mode)',
        data: { no_cors: true }
      };

    } catch (error) {
      console.error('❌ No-cors request failed:', error);
      
      // Retry logic
      if (retryCount < this.config.REQUEST.retries) {
        console.log(`🔄 No-cors retry ${retryCount + 1}/${this.config.REQUEST.retries}`);
        await this.delay(1000 * (retryCount + 1));
        return this.sendRequestNoCors(data, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Кодирование данных формы
   */
  encodeFormData(data) {
    const params = new URLSearchParams();
    
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined) {
        params.append(key, value.toString());
      }
    }
    
    return params.toString();
  }

  /**
   * Получение URL параметра
   */
  getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name) || '';
  }

  /**
   * Задержка
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Показать уведомление
   */
  showNotification(notification) {
    // Создаем уведомление
    const notificationEl = document.createElement('div');
    notificationEl.className = `gas-notification ${notification.title.includes('Ошибка') ? 'error' : 'success'}`;
    notificationEl.innerHTML = `
      <div class="gas-notification__content">
        <h4>${notification.title}</h4>
        <p>${notification.message}</p>
      </div>
    `;

    // Добавляем стили
    if (!document.querySelector('#gas-notification-styles')) {
      const styles = document.createElement('style');
      styles.id = 'gas-notification-styles';
      styles.textContent = `
        .gas-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          padding: 20px;
          max-width: 400px;
          z-index: 10000;
          animation: slideIn 0.3s ease-out;
        }
        
        .gas-notification.success {
          border-left: 4px solid #10B981;
        }
        
        .gas-notification.error {
          border-left: 4px solid #EF4444;
        }
        
        .gas-notification__content h4 {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        .gas-notification__content p {
          margin: 0;
          font-size: 14px;
          color: #666;
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        html.dark .gas-notification {
          background: #1f2937;
          color: white;
        }
        
        html.dark .gas-notification__content p {
          color: #d1d5db;
        }
      `;
      document.head.appendChild(styles);
    }

    document.body.appendChild(notificationEl);

    // Автоматически скрываем через 5 секунд
    setTimeout(() => {
      notificationEl.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (notificationEl.parentNode) {
          notificationEl.parentNode.removeChild(notificationEl);
        }
      }, 300);
    }, 5000);
  }

  /**
   * Получение статистики
   */
  async getStats() {
    try {
      const response = await fetch(this.config.GAS_WEBHOOK_URL, {
        method: 'GET',
        mode: 'cors'
      });

      if (response.ok) {
        const data = await response.json();
        return data.data?.stats || null;
      }
    } catch (error) {
      console.error('Ошибка получения статистики:', error);
    }
    return null;
  }
}

// Экспорт для использования в других модулях
export default GASIntegration;
