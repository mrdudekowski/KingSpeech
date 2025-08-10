// Год в футере
const yearSpan = document.getElementById('year');
if (yearSpan) yearSpan.textContent = new Date().getFullYear();

// Тема (toggle + сохранение)
const root = document.documentElement;
const getStoredTheme = () => localStorage.getItem('theme');
const setStoredTheme = (t) => localStorage.setItem('theme', t);
const applyTheme = (t) => {
  if (t === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
};
// Инициализация темы
(() => {
  const saved = getStoredTheme();
  if (saved) applyTheme(saved);
})();

const bindToggle = (btn) => {
  if (!btn) return;
  const updateAria = () => btn.setAttribute('aria-pressed', String(root.classList.contains('dark')));
  btn.addEventListener('click', () => {
    const toDark = !root.classList.contains('dark');
    // Включаем короткий эффект заката при переходе к тёмной теме
    if (toDark) {
      root.classList.add('sunset-active');
      setTimeout(() => root.classList.remove('sunset-active'), 700);
    }
    applyTheme(toDark ? 'dark' : 'light');
    setStoredTheme(toDark ? 'dark' : 'light');
    updateAria();
  });
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
  });
  updateAria();
};

bindToggle(document.getElementById('themeToggle'));
bindToggle(document.getElementById('themeToggleMobile'));

// Автоматическая проверка контраста и коррекция цвета текста
const clamp01 = (n) => Math.min(1, Math.max(0, n));
const srgbToLinear = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const parseRGB = (css) => {
  if (!css) return null;
  const m = css.match(/rgba?\(([^)]+)\)/i);
  if (!m) return null;
  const parts = m[1].split(',').map((p) => parseFloat(p.trim()));
  return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 };
};
const relLuminance = ({ r, g, b }) => {
  const R = srgbToLinear(clamp01(r / 255));
  const G = srgbToLinear(clamp01(g / 255));
  const B = srgbToLinear(clamp01(b / 255));
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};
const contrastRatio = (fg, bg) => {
  const L1 = relLuminance(fg);
  const L2 = relLuminance(bg);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
};
const getComputedBackground = (el) => {
  const rootDark = document.documentElement.classList.contains('dark');
  const fallback = parseRGB(getComputedStyle(document.documentElement).backgroundColor) || parseRGB(rootDark ? 'rgb(11,15,25)' : 'rgb(255,248,243)');
  let node = el;
  while (node && node !== document.documentElement) {
    const bg = getComputedStyle(node).backgroundColor;
    const p = parseRGB(bg);
    if (p && p.a > 0) return p;
    node = node.parentElement;
  }
  // html background
  const htmlBg = parseRGB(getComputedStyle(document.documentElement).backgroundColor);
  return htmlBg || fallback;
};
const ensureReadable = (el) => {
  if (!el || !el.isConnected) return;
  const style = getComputedStyle(el);
  if (style.visibility === 'hidden' || style.display === 'none') return;
  if (!el.textContent || !el.textContent.trim()) return;
  const color = parseRGB(style.color);
  if (!color) return;
  const bg = getComputedBackground(el);
  const ratio = contrastRatio(color, bg);
  const fontSize = parseFloat(style.fontSize || '16');
  const isBold = parseInt(style.fontWeight || '400', 10) >= 600;
  const largeText = fontSize >= 18 || (isBold && fontSize >= 16);
  const threshold = largeText ? 3 : 4.5;
  if (ratio >= threshold) return;
  // Выбираем светлый или тёмный текст в зависимости от фона
  const bgLum = relLuminance(bg);
  const target = bgLum < 0.35 ? 'rgb(230,237,245)' : 'rgb(31,41,55)';
  el.style.color = target;
};
const scanContrast = () => {
  const candidates = document.querySelectorAll('p,span,li,a,small,div,button,label,summary,h1,h2,h3,h4,h5,h6');
  candidates.forEach(ensureReadable);
};

// Запуск при загрузке
window.addEventListener('DOMContentLoaded', () => {
  scanContrast();
  // Наблюдаем за динамическими изменениями
  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes && m.addedNodes.forEach((n) => {
        if (n.nodeType === 1) {
          ensureReadable(n);
          n.querySelectorAll && n.querySelectorAll('*').forEach(ensureReadable);
        }
      });
      if (m.target && m.target.nodeType === 1) ensureReadable(m.target);
    }
  });
  mo.observe(document.body, { childList: true, subtree: true, characterData: true });
});

// Перепроверяем после смены темы (после анимации заката)
const recheckAfterTheme = () => setTimeout(scanContrast, 750);
['themeToggle', 'themeToggleMobile'].forEach((id) => {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.addEventListener('click', recheckAfterTheme);
});

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

// Active nav link on scroll
const sections = ['home','about','method','testimonials','faq','contact']
  .map(id => document.getElementById(id));
const navLinks = Array.from(document.querySelectorAll('.nav__link'));
function setActive(id){
  navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`));
}
const so = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) setActive(e.target.id);
  });
}, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });
sections.forEach(s => s && so.observe(s)); 