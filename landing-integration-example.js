// Пример интеграции формы с веб-хуком KingSpeech Bot
// Добавьте этот код на ваш landing page

class KingSpeechLeadForm {
    constructor(formSelector, webhookUrl, secretKey) {
        this.form = document.querySelector(formSelector);
        this.webhookUrl = webhookUrl;
        this.secretKey = secretKey;
        this.init();
    }

    init() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        // Показываем индикатор загрузки
        this.showLoading();
        
        try {
            // Собираем данные формы
            const formData = this.collectFormData();
            
            // Отправляем данные на веб-хук
            const response = await this.sendToWebhook(formData);
            
            if (response.success) {
                this.showSuccess();
            } else {
                this.showError(response.error || 'Ошибка при отправке заявки');
            }
            
        } catch (error) {
            console.error('Error submitting form:', error);
            this.showError('Произошла ошибка. Попробуйте еще раз.');
        }
    }

    collectFormData() {
        const formData = new FormData(this.form);
        const data = {};
        
        // Собираем все поля формы
        for (let [key, value] of formData.entries()) {
            data[key] = value.trim();
        }
        
        // Добавляем дополнительные данные
        data.timestamp = new Date().toISOString();
        data.source = 'landing_website';
        
        // Определяем предпочитаемый способ связи
        const contactPreference = this.getContactPreference();
        if (contactPreference) {
            data.contact_preference = contactPreference;
        }
        
        return data;
    }

    getContactPreference() {
        // Проверяем выбранные способы связи
        const preferences = [];
        
        // Проверяем чекбоксы или радио кнопки для способов связи
        const telegramCheckbox = this.form.querySelector('input[name="telegram"]');
        const whatsappCheckbox = this.form.querySelector('input[name="whatsapp"]');
        const phoneCheckbox = this.form.querySelector('input[name="phone_preferred"]');
        
        if (telegramCheckbox && telegramCheckbox.checked) {
            preferences.push('Telegram');
        }
        if (whatsappCheckbox && whatsappCheckbox.checked) {
            preferences.push('WhatsApp');
        }
        if (phoneCheckbox && phoneCheckbox.checked) {
            preferences.push('Звонок');
        }
        
        return preferences.length > 0 ? preferences.join(', ') : null;
    }

    async sendToWebhook(data) {
        const response = await fetch(this.webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.secretKey}`
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    }

    showLoading() {
        // Скрываем кнопку отправки и показываем индикатор
        const submitBtn = this.form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Отправляем...';
        }
    }

    showSuccess() {
        // Показываем сообщение об успехе
        this.showMessage('Спасибо! Ваша заявка отправлена. Мы свяжемся с вами в ближайшее время.', 'success');
        
        // Сбрасываем форму
        this.form.reset();
        
        // Восстанавливаем кнопку
        this.restoreSubmitButton();
    }

    showError(message) {
        this.showMessage(message, 'error');
        this.restoreSubmitButton();
    }

    showMessage(message, type) {
        // Удаляем предыдущие сообщения
        const existingMessages = document.querySelectorAll('.form-message');
        existingMessages.forEach(msg => msg.remove());
        
        // Создаем элемент для сообщения
        const messageDiv = document.createElement('div');
        messageDiv.className = `form-message form-message--${type}`;
        messageDiv.textContent = message;
        
        // Добавляем стили
        messageDiv.style.cssText = `
            padding: 10px 15px;
            margin: 10px 0;
            border-radius: 5px;
            font-weight: 500;
        `;
        
        if (type === 'success') {
            messageDiv.style.backgroundColor = '#d4edda';
            messageDiv.style.color = '#155724';
            messageDiv.style.border = '1px solid #c3e6cb';
        } else {
            messageDiv.style.backgroundColor = '#f8d7da';
            messageDiv.style.color = '#721c24';
            messageDiv.style.border = '1px solid #f5c6cb';
        }
        
        // Вставляем сообщение после формы
        this.form.parentNode.insertBefore(messageDiv, this.form.nextSibling);
        
        // Удаляем сообщение через 5 секунд
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);
    }

    restoreSubmitButton() {
        const submitBtn = this.form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Отправить заявку';
        }
    }
}

// Пример использования:
// Инициализируем форму при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Замените на ваши реальные данные
    const webhookUrl = 'https://your-domain.com/webhook/lead';
    const secretKey = 'your-secret-key-here';
    
    // Инициализируем форму
    const leadForm = new KingSpeechLeadForm(
        '#leadForm', // Селектор вашей формы
        webhookUrl,
        secretKey
    );
});

// Альтернативный способ - простой fetch без класса
async function submitLeadForm(formData) {
    try {
        const response = await fetch('https://your-domain.com/webhook/lead', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer your-secret-key-here'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Спасибо! Ваша заявка отправлена.');
        } else {
            alert('Ошибка при отправке заявки: ' + (result.error || 'Неизвестная ошибка'));
        }
        
    } catch (error) {
        console.error('Error:', error);
        alert('Произошла ошибка. Попробуйте еще раз.');
    }
}

// Пример HTML формы для интеграции:
/*
<form id="leadForm">
    <input type="text" name="name" placeholder="Ваше имя" required>
    <input type="email" name="email" placeholder="Email">
    <input type="tel" name="phone" placeholder="Телефон" required>
    
    <div class="contact-preferences">
        <label>
            <input type="checkbox" name="telegram" value="telegram">
            Telegram
        </label>
        <label>
            <input type="checkbox" name="whatsapp" value="whatsapp">
            WhatsApp
        </label>
        <label>
            <input type="checkbox" name="phone_preferred" value="phone">
            Звонок
        </label>
    </div>
    
    <button type="submit">Отправить заявку</button>
</form>
*/

// Инструкции по настройке:
/*
1. Замените 'https://your-domain.com/webhook/lead' на реальный URL вашего webhook
2. Замените 'your-secret-key-here' на реальный секретный ключ из переменной WEBHOOK_SECRET_KEY
3. Убедитесь, что форма имеет id="leadForm" или измените селектор в коде
4. Настройте поля формы в соответствии с вашими требованиями

Пример настройки для локальной разработки:
const webhookUrl = 'http://localhost:5000/webhook/lead';
const secretKey = 'your-local-secret-key';

Для продакшена:
const webhookUrl = 'https://your-bot-domain.com/webhook/lead';
const secretKey = 'your-production-secret-key';
*/
