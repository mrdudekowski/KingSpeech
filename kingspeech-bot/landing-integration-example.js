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
                this.showError('Ошибка при отправке заявки');
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
        
        return data;
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
            throw new Error(`HTTP error! status: ${response.status}`);
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
        '#contact-form', // Селектор вашей формы
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
            alert('Ошибка при отправке заявки.');
        }
        
    } catch (error) {
        console.error('Error:', error);
        alert('Произошла ошибка. Попробуйте еще раз.');
    }
}

// Пример HTML формы для интеграции:
/*
<form id="contact-form">
    <input type="text" name="name" placeholder="Ваше имя" required>
    <input type="tel" name="phone" placeholder="Телефон" required>
    <select name="level">
        <option value="">Выберите уровень</option>
        <option value="Начинающий">Начинающий</option>
        <option value="Средний">Средний</option>
        <option value="Продвинутый">Продвинутый</option>
    </select>
    <select name="goals">
        <option value="">Цель изучения</option>
        <option value="Общий язык">Общий язык</option>
        <option value="Бизнес">Бизнес</option>
        <option value="Путешествия">Путешествия</option>
    </select>
    <button type="submit">Отправить заявку</button>
</form>
*/
