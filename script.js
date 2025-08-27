/**
 * KingSpeech Landing Page - Enhanced JavaScript
 * Интеграция с GAS Webhook для отправки лидов в Telegram
 * С поддержкой CORS и fallback методов
 */

// Конфигурация
const CONFIG = {
    // Замените на ваш реальный URL GAS webhook
    GAS_WEBHOOK_URL: 'https://script.google.com/macros/s/AKfycbyY8wAVsmBFqxgjN_UtnyPX3l2viFn3kuBErJzdrXNYQujvAWYDxrEPfQ7wHNzXOvBFJg/exec',
    
    // Fallback URL (если основной не работает)
    FALLBACK_URL: null, // Можно добавить резервный endpoint
    
    // Настройки форм
    FORM_SELECTORS: {
        main: '#leadForm',
        name: '#name',
        email: '#email', 
        phone: '#phone',
        messenger: '#messenger',
        goal: '#goal',
        submit: 'button[type="submit"]'
    },
    
    // Настройки уведомлений
    NOTIFICATIONS: {
        success: {
            title: 'Успешно!',
            message: 'Заявка отправлена! Мы свяжемся с вами в ближайшее время.',
            type: 'success'
        },
        error: {
            title: 'Ошибка',
            message: 'Произошла ошибка при отправке. Попробуйте позже.',
            type: 'error'
        },
        validation: {
            title: 'Проверьте данные',
            message: 'Пожалуйста, заполните все обязательные поля.',
            type: 'warning'
        },
        cors_error: {
            title: 'Проблема с подключением',
            message: 'Не удается подключиться к серверу. Проверьте настройки.',
            type: 'error'
        }
    },
    
    // Анимации
    ANIMATIONS: {
        duration: 300,
        easing: 'ease-in-out'
    },
    
    // Настройки запросов
    REQUEST: {
        timeout: 10000, // 10 секунд
        retries: 2,
        retryDelay: 1000
    }
};

// Утилиты
const Utils = {
    // Получение UTM параметров
    getUTMParams() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            utm_source: urlParams.get('utm_source') || '',
            utm_medium: urlParams.get('utm_medium') || '',
            utm_campaign: urlParams.get('utm_campaign') || '',
            ref: document.referrer || ''
        };
    },
    
    // Валидация email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    // Валидация телефона
    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        return phoneRegex.test(phone);
    },
    
    // Форматирование телефона
    formatPhone(phone) {
        return phone.replace(/\D/g, '').replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, '+$1 ($2) $3-$4-$5');
    },
    
    // Debounce функция
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Показ уведомлений
    showNotification(config) {
        // Создаем элемент уведомления
        const notification = document.createElement('div');
        notification.className = `notification notification-${config.type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <h4>${config.title}</h4>
                <p>${config.message}</p>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        // Добавляем стили
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${config.type === 'success' ? '#4CAF50' : config.type === 'error' ? '#f44336' : '#ff9800'};
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 12px;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;
        
        // Добавляем в DOM
        document.body.appendChild(notification);
        
        // Автоматическое удаление через 5 секунд
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    },
    
    // Показ загрузки
    showLoading(button, text = 'Отправка...') {
        if (!button) return;
        button.disabled = true;
        button.dataset.originalText = button.textContent || '';
        button.innerHTML = `
            <svg class="spinner" width="16" height="16" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="31.416" stroke-dashoffset="31.416">
                    <animate attributeName="stroke-dashoffset" dur="1s" values="0;31.416" repeatCount="indefinite"/>
                </circle>
            </svg>
            ${text}
        `;
    },
    
    // Скрытие загрузки
    hideLoading(button) {
        if (!button) return;
        button.disabled = false;
        button.textContent = button.dataset?.originalText || 'Отправить';
    },
    
    // Проверка доступности GAS webhook
    async checkGASHealth() {
        try {
            const response = await fetch(CONFIG.GAS_WEBHOOK_URL, {
                method: 'GET',
                mode: 'cors',
                timeout: CONFIG.REQUEST.timeout
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.ok === true;
            }
            return false;
        } catch (error) {
            console.warn('GAS health check failed:', error);
            return false;
        }
    },
    
    // Задержка
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // Анимация «письмо улетает» к правому нижнему слоту
    flyEnvelope(fromElement) {
        return new Promise((resolve) => {
            const anchor = document.getElementById('mailSlotAnchor');
            const fxLayer = document.getElementById('fxLayer');
            if (!fromElement || !anchor || !fxLayer) {
                resolve();
                return;
            }

            const start = fromElement.getBoundingClientRect();
            const end = anchor.getBoundingClientRect();

            const env = document.createElement('div');
            env.className = 'fx-envelope';
            const trail = document.createElement('div');
            trail.className = 'fx-trail';

            fxLayer.appendChild(env);
            fxLayer.appendChild(trail);

            const pStart = { x: start.left + start.width - 20, y: start.top + start.height / 2 };
            const pEnd = { x: end.left, y: end.top };

            const duration = 900;
            const startTs = performance.now();
            const ease = (t) => 1 - Math.pow(1 - t, 3);

            const raf = (now) => {
                const t = Math.min(1, (now - startTs) / duration);
                const k = ease(t);
                const cx = pStart.x + (pEnd.x - pStart.x) * k;
                const cy = pStart.y + (pEnd.y - pStart.y) * k;
                env.style.left = `${cx}px`;
                env.style.top = `${cy}px`;
                env.style.position = 'fixed';
                trail.style.left = `${cx - 12}px`;
                trail.style.top = `${cy - 8}px`;
                trail.style.position = 'fixed';
                if (t < 1) {
                    requestAnimationFrame(raf);
                } else {
                    env.remove();
                    trail.remove();
                    resolve();
                }
            };
            requestAnimationFrame(raf);
        });
    },

    // Небольшой тост справа внизу
    showSuccessToast(text = 'Преподаватель скоро с вами свяжется!') {
        const el = document.createElement('div');
        el.className = 'fx-success';
        el.textContent = text;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 5000);
    }
};

// Класс для работы с формами
class LeadForm {
    constructor(selector) {
        this.form = document.querySelector(selector);
        this.submitBtn = this.form?.querySelector(CONFIG.FORM_SELECTORS.submit);
        this.fields = this.getFormFields();
        
        this.init();
    }
    
    // Получение полей формы
    getFormFields() {
        return {
            name: this.form?.querySelector(CONFIG.FORM_SELECTORS.name),
            email: this.form?.querySelector(CONFIG.FORM_SELECTORS.email),
            phone: this.form?.querySelector(CONFIG.FORM_SELECTORS.phone),
            messenger: this.form?.querySelector(CONFIG.FORM_SELECTORS.messenger),
            goal: this.form?.querySelector(CONFIG.FORM_SELECTORS.goal)
        };
    }
    
    // Инициализация
    init() {
        if (!this.form) {
            console.error('Форма не найдена:', CONFIG.FORM_SELECTORS.main);
            return;
        }
        
        this.bindEvents();
        this.setupValidation();
        this.setupPhoneFormatting();
        this.checkGASConnection();
    }
    
    // Проверка подключения к GAS
    async checkGASConnection() {
        const isHealthy = await Utils.checkGASHealth();
        if (!isHealthy) {
            console.warn('⚠️ GAS webhook недоступен. Проверьте настройки.');
            Utils.showNotification(CONFIG.NOTIFICATIONS.cors_error);
        }
    }
    
    // Привязка событий
    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Валидация в реальном времени
        Object.values(this.fields).forEach(field => {
            if (field) {
                field.addEventListener('blur', () => this.validateField(field));
                field.addEventListener('input', Utils.debounce(() => this.validateField(field), 300));
            }
        });
    }
    
    // Настройка валидации
    setupValidation() {
        // Добавляем CSS для валидации
        const style = document.createElement('style');
        style.textContent = `
            .field-error {
                border-color: #f44336 !important;
                box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.2) !important;
            }
            
            .field-success {
                border-color: #4CAF50 !important;
                box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2) !important;
            }
            
            .error-message {
                color: #f44336;
                font-size: 12px;
                margin-top: 4px;
                display: none;
            }
            
            .spinner {
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Настройка форматирования телефона
    setupPhoneFormatting() {
        if (this.fields.phone) {
            this.fields.phone.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 0 && !value.startsWith('7') && !value.startsWith('8')) {
                    value = '7' + value;
                }
                if (value.length > 1) {
                    e.target.value = Utils.formatPhone(value);
                } else {
                    e.target.value = value;
                }
            });
        }
    }
    
    // Валидация поля
    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';
        
        // Удаляем предыдущие сообщения об ошибках
        const existingError = field.parentElement.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Удаляем предыдущие классы
        field.classList.remove('field-error', 'field-success');
        
        // Валидация по типу поля
        if (field === this.fields.name) {
            if (value.length < 2) {
                isValid = false;
                errorMessage = 'Имя должно содержать минимум 2 символа';
            }
        } else if (field === this.fields.email) {
            if (value && !Utils.isValidEmail(value)) {
                isValid = false;
                errorMessage = 'Введите корректный email';
            }
        } else if (field === this.fields.phone) {
            if (value && !Utils.isValidPhone(value)) {
                isValid = false;
                errorMessage = 'Введите корректный номер телефона';
            }
        }
        
        // Применяем результат валидации
        if (value) {
            field.classList.add(isValid ? 'field-success' : 'field-error');
            
            if (!isValid) {
                const errorElement = document.createElement('div');
                errorElement.className = 'error-message';
                errorElement.textContent = errorMessage;
                field.parentElement.appendChild(errorElement);
                errorElement.style.display = 'block';
            }
        }
        
        return isValid;
    }
    
    // Валидация всей формы
    validateForm() {
        let isValid = true;
        
        // Проверяем обязательные поля
        if (!this.fields.name.value.trim()) {
            this.validateField(this.fields.name);
            isValid = false;
        }
        
        if (!this.fields.email.value.trim() && !this.fields.phone.value.trim()) {
            if (this.fields.email.value.trim()) {
                this.validateField(this.fields.email);
            }
            if (this.fields.phone.value.trim()) {
                this.validateField(this.fields.phone);
            }
            isValid = false;
        }
        
        // Проверяем остальные поля
        Object.values(this.fields).forEach(field => {
            if (field && field.value.trim() && !this.validateField(field)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    // Получение данных формы
    getFormData() {
        const utmParams = Utils.getUTMParams();
        
        return {
            name: this.fields.name.value.trim(),
            email: this.fields.email.value.trim(),
            phone: this.fields.phone.value.trim(),
            messenger: this.fields.messenger?.value || '',
            goal: this.fields.goal?.value || '',
            page: window.location.pathname || '/',
            ref: utmParams.ref,
            utm_source: utmParams.utm_source,
            utm_medium: utmParams.utm_medium,
            utm_campaign: utmParams.utm_campaign,
            website: '' // honeypot поле
        };
    }
    
    // Обработка отправки формы
    async handleSubmit(e) {
        e.preventDefault();
        
        // Валидация
        if (!this.validateForm()) {
            Utils.showNotification(CONFIG.NOTIFICATIONS.validation);
            return;
        }
        
        // Показываем загрузку
        Utils.showLoading(this.submitBtn);
        
        try {
            const formData = this.getFormData();
            const result = await this.submitLeadWithRetry(formData);
            
            if (result.ok) {
                this.form.reset();
                this.clearValidation();
                await Utils.flyEnvelope(this.submitBtn);
                Utils.showSuccessToast('Преподаватель скоро с вами свяжется!');
                
                // Аналитика (если настроена)
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'lead_submitted', {
                        'event_category': 'form',
                        'event_label': 'main_form'
                    });
                }
            } else {
                throw new Error(result.error || 'Unknown error');
            }
            
        } catch (error) {
            console.error('Ошибка отправки:', error);
            
            // Определяем тип ошибки
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                Utils.showNotification(CONFIG.NOTIFICATIONS.cors_error);
            } else {
                Utils.showNotification(CONFIG.NOTIFICATIONS.error);
            }
        } finally {
            Utils.hideLoading(this.submitBtn);
        }
    }
    
    // Отправка лида с повторными попытками
    async submitLeadWithRetry(data, attempt = 1) {
        try {
            return await this.submitLead(data);
        } catch (error) {
            if (attempt < CONFIG.REQUEST.retries) {
                console.log(`Попытка ${attempt} не удалась, повторяем через ${CONFIG.REQUEST.retryDelay}ms...`);
                await Utils.delay(CONFIG.REQUEST.retryDelay);
                return this.submitLeadWithRetry(data, attempt + 1);
            }
            throw error;
        }
    }
    
    // Отправка лида на сервер
    async submitLead(data) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST.timeout);
        
        try {
            const response = await fetch(CONFIG.GAS_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(data),
                signal: controller.signal,
                mode: 'cors'
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Timeout: запрос превысил время ожидания');
            }
            
            throw error;
        }
    }
    
    // Очистка валидации
    clearValidation() {
        Object.values(this.fields).forEach(field => {
            if (field) {
                field.classList.remove('field-error', 'field-success');
                const errorElement = field.parentElement.querySelector('.error-message');
                if (errorElement) {
                    errorElement.remove();
                }
            }
        });
    }
}

// Класс для анимаций
class Animations {
    static init() {
        // Анимация появления элементов при скролле
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        // Наблюдаем за элементами с атрибутом data-animate
        document.querySelectorAll('[data-animate]').forEach(el => {
            observer.observe(el);
        });
    }
}

// Класс для аналитики
class Analytics {
    static init() {
        // Отслеживание кликов по кнопкам
        document.addEventListener('click', (e) => {
            if (e.target.matches('button, a')) {
                const label = e.target.textContent.trim() || e.target.dataset.analytics || 'button_click';
                
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'click', {
                        'event_category': 'engagement',
                        'event_label': label
                    });
                }
            }
        });
        
        // Отслеживание времени на странице
        let startTime = Date.now();
        window.addEventListener('beforeunload', () => {
            const timeSpent = Math.round((Date.now() - startTime) / 1000);
            
            if (typeof gtag !== 'undefined') {
                gtag('event', 'time_on_page', {
                    'event_category': 'engagement',
                    'value': timeSpent
                });
            }
        });
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 KingSpeech Landing Page initialized');

    // 1) Тема: переключение и анимация переключателя
    const root = document.documentElement;
    const THEME_KEY = 'theme';
    const getStoredTheme = () => localStorage.getItem(THEME_KEY);
    const setStoredTheme = (t) => localStorage.setItem(THEME_KEY, t);
    const applyTheme = (t) => {
        if (t === 'dark') root.classList.add('dark');
        else root.classList.remove('dark');
    };
    // начальная тема
    const initTheme = () => {
        const saved = getStoredTheme();
        if (saved) applyTheme(saved);
        else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            applyTheme('dark');
        }
    };
    initTheme();
    // обработчики
    const toggles = [document.getElementById('themeToggle'), document.getElementById('themeToggleMobile')].filter(Boolean);
    toggles.forEach(btn => {
        btn.addEventListener('click', () => {
            const next = root.classList.contains('dark') ? 'light' : 'dark';
            applyTheme(next);
            setStoredTheme(next);
            // короткая анимация заката
            const sky = btn.querySelector('.theme-sky');
            if (sky) {
                sky.classList.add('sunset-active');
                setTimeout(() => sky.classList.remove('sunset-active'), 800);
            }
        });
    });

    // 2) Плавные якоря
    document.addEventListener('click', (e) => {
        const a = e.target.closest('a[href^="#"]');
        if (!a) return;
        const id = a.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // 3) Карусель отзывов + индикаторы
    (function initCarousel(){
        const track = document.getElementById('testimonialsTrack');
        if (!track) return;
        const items = Array.from(track.children);
        const dots = Array.from(document.querySelectorAll('.carousel__indicator'));
        const offsets = items.map(el => el.offsetLeft);
        const setActive = (idx) => {
            dots.forEach(d => d.classList.remove('is-active'));
            if (dots[idx]) dots[idx].classList.add('is-active');
        };
        dots.forEach((dot, i) => dot.addEventListener('click', () => {
            track.scrollTo({ left: offsets[i] || 0, behavior: 'smooth' });
            setActive(i);
        }));
        let rafId = 0;
        track.addEventListener('scroll', () => {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                const left = track.scrollLeft;
                let nearest = 0; let best = Infinity;
                offsets.forEach((x, i) => { const d = Math.abs(left - x); if (d < best) { best = d; nearest = i; } });
                setActive(nearest);
            });
        });
        track.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const left = track.scrollLeft;
                let idx = 0; let best = Infinity;
                offsets.forEach((x, i) => { const d = Math.abs(left - x); if (d < best) { best = d; idx = i; } });
                idx += (e.key === 'ArrowRight' ? 1 : -1);
                if (idx < 0) idx = items.length - 1;
                if (idx >= items.length) idx = 0;
                track.scrollTo({ left: offsets[idx] || 0, behavior: 'smooth' });
                setActive(idx);
            }
        });
        setActive(0);
    })();

    // 4) Модалка полного отзыва
    (function initReviewModal(){
        const modal = document.getElementById('reviewModal');
        if (!modal) return;
        const backdrop = modal.querySelector('.modal__backdrop');
        const btnClose = modal.querySelector('.modal__close');
        const btnPrev = modal.querySelector('.modal__prev');
        const btnNext = modal.querySelector('.modal__next');
        const avatar = modal.querySelector('.modal__avatar');
        const nameEl = modal.querySelector('#reviewTitle');
        const quote = modal.querySelector('.modal__quote');
        const items = Array.from(document.querySelectorAll('.testimonial'));
        let index = -1;
        const openAt = (i) => {
            index = (i + items.length) % items.length;
            const card = items[index];
            const img = card.querySelector('.testimonial-avatar');
            const nm = card.querySelector('.testimonial-name');
            const short = card.querySelector('.testimonial-quote');
            const full = short?.getAttribute('data-full') || short?.textContent || '';
            if (avatar && img) avatar.src = img.src;
            if (nameEl && nm) nameEl.textContent = nm.textContent || '';
            if (quote) quote.textContent = full;
            modal.setAttribute('aria-hidden', 'false');
        };
        const close = () => modal.setAttribute('aria-hidden', 'true');
        items.forEach((card, i) => card.addEventListener('click', () => openAt(i)));
        btnClose?.addEventListener('click', close);
        backdrop?.addEventListener('click', close);
        btnPrev?.addEventListener('click', () => openAt(index - 1));
        btnNext?.addEventListener('click', () => openAt(index + 1));
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    })();

    // 5) Кнопка «Наверх»
    (function initToTop(){
        const toTop = document.getElementById('toTop');
        if (!toTop) return;
        const onScroll = () => {
            if (window.scrollY > 400) toTop.classList.add('is-visible');
            else toTop.classList.remove('is-visible');
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    })();

    // 6) Подсветка активного пункта меню
    (function initActiveSection(){
        const sections = ['home','about','method','testimonials','faq','contact']
            .map(id => document.getElementById(id)).filter(Boolean);
        const links = Array.from(document.querySelectorAll('.nav__link'));
        const setActive = (id) => {
            links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`));
        };
        const io = new IntersectionObserver((entries) => {
            entries.forEach(en => { if (en.isIntersecting) setActive(en.target.id); });
        }, { threshold: 0.55 });
        sections.forEach(sec => io.observe(sec));
    })();

    // Инициализация формы
    new LeadForm(CONFIG.FORM_SELECTORS.main);

    // Инициализация анимаций
    Animations.init();

    // Инициализация аналитики
    Analytics.init();

    // Проверка конфигурации (dev‑подсказка)
    if (CONFIG.GAS_WEBHOOK_URL.includes('YOUR_SCRIPT_ID')) {
        console.warn('⚠️ Не забудьте заменить YOUR_SCRIPT_ID на реальный ID вашего GAS скрипта!');
        Utils.showNotification({
            title: 'Настройка',
            message: 'Замените YOUR_SCRIPT_ID на реальный ID в script.js',
            type: 'warning'
        });
    }
});

// Экспорт для глобального использования
window.KingSpeech = {
    Utils,
    LeadForm,
    Animations,
    Analytics,
    CONFIG
}; 