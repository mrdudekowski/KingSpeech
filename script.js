// Год в футере
const yearSpan = document.getElementById('year');
if (yearSpan) yearSpan.textContent = new Date().getFullYear();

// Мобильное меню
const mobileBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const primaryMenu = document.getElementById('primary-menu');
if (mobileBtn && mobileMenu) {
  mobileBtn.addEventListener('click', () => {
    const expanded = mobileBtn.getAttribute('aria-expanded') === 'true';
    mobileBtn.setAttribute('aria-expanded', String(!expanded));
    mobileMenu.classList.toggle('hidden');
  });
  // Закрывать меню при выборе ссылки
  mobileMenu.querySelectorAll('a').forEach((link) =>
    link.addEventListener('click', () => mobileMenu.classList.add('hidden'))
  );
}

// Плавная прокрутка
const smoothLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');
smoothLinks.forEach((link) => {
  link.addEventListener('click', (e) => {
    const targetId = link.getAttribute('href');
    const target = document.querySelector(targetId);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
  });
});

// Появление при скролле
const animated = document.querySelectorAll('[data-animate]');
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
animated.forEach((el) => observer.observe(el));

// Кнопка «наверх»
const toTopBtn = document.getElementById('toTop');
if (toTopBtn) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 600) toTopBtn.classList.remove('hidden');
    else toTopBtn.classList.add('hidden');
  });
  toTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// Валидация формы
const form = document.getElementById('leadForm');
const message = document.getElementById('formMessage');

const setFieldState = (input, ok, text = '') => {
  if (!input) return;
  input.setAttribute('aria-invalid', String(!ok));
  if (ok) {
    input.classList.remove('ring-2', 'ring-red-400', 'border-red-300');
    input.classList.add('border-gray-200');
  } else {
    input.classList.add('ring-2', 'ring-red-400', 'border-red-300');
  }
  if (message) {
    message.textContent = text;
    message.className = ok ? 'text-sm text-green-600' : 'text-sm text-red-600';
  }
};

const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
const digits = (v) => v.replace(/\D/g, '');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = form.querySelector('#name');
    const email = form.querySelector('#email');
    const phone = form.querySelector('#phone');

    const nameOk = name.value.trim().length >= 2;
    const emailOk = validateEmail(email.value);
    const phoneOk = digits(phone.value).length >= 10;

    if (!nameOk) setFieldState(name, false, 'Пожалуйста, укажите имя (минимум 2 символа).');
    else if (!emailOk) setFieldState(email, false, 'Укажите корректный email.');
    else if (!phoneOk) setFieldState(phone, false, 'Укажите телефон (не менее 10 цифр).');
    else {
      setFieldState(phone, true);
      setFieldState(email, true);
      setFieldState(name, true);

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Отправка…';

      // Имитация отправки. Здесь можно подключить ваш бэкенд/форм‑сервис.
      await new Promise((res) => setTimeout(res, 800));

      if (message) {
        message.textContent = 'Спасибо! Я свяжусь с вами в ближайшее время.';
        message.className = 'text-sm text-green-600';
      }
      submitBtn.disabled = false;
      submitBtn.textContent = 'Отправить заявку';
      form.reset();
    }
  });
} 