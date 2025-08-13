// Год в футере
const yearSpan = document.getElementById('year');
if (yearSpan) yearSpan.textContent = new Date().getFullYear();

// Тема (toggle + хранение + автоопределение по prefers-color-scheme)
const root = document.documentElement;
const getStoredTheme = () => localStorage.getItem('theme');
const setStoredTheme = (t) => localStorage.setItem('theme', t);
const applyTheme = (t) => {
  if (t === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
};
// Инициализация темы: если нет сохранённого, берём системную
(() => {
  const saved = getStoredTheme();
  if (saved) {
    applyTheme(saved);
  } else {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }
  requestAnimationFrame(() => document.documentElement.classList.remove('no-transitions'));
})();

const clearAutoContrast = () => {
  document.querySelectorAll('[data-autocontrast-applied="1"]').forEach((el) => {
    el.style.color = '';
    el.removeAttribute('data-autocontrast-applied');
  });
};

const bindToggle = (btn) => {
  if (!btn) return;
  const updateAria = () => btn.setAttribute('aria-pressed', String(root.classList.contains('dark')));
  btn.addEventListener('click', () => {
    const toDark = !root.classList.contains('dark');
    if (toDark) {
      root.classList.add('sunset-active');
      setTimeout(() => root.classList.remove('sunset-active'), 700);
    }
    applyTheme(toDark ? 'dark' : 'light');
    setStoredTheme(toDark ? 'dark' : 'light');
    updateAria();
    // Сбрасываем ранее принудительно выставленные цвета перед пересканом
    clearAutoContrast();
    // recheck contrast once after theme switch
    recheckAfterTheme();
  });
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
  });
  updateAria();
};

bindToggle(document.getElementById('themeToggle'));
bindToggle(document.getElementById('themeToggleMobile'));

// Автоматическая проверка контраста и коррекция текста (WCAG AA)
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
  const fallback = parseRGB(getComputedStyle(document.documentElement).backgroundColor) || parseRGB(rootDark ? 'rgb(18,18,18)' : 'rgb(255,255,255)');
  let node = el;
  while (node && node !== document.documentElement) {
    const bg = getComputedStyle(node).backgroundColor;
    const p = parseRGB(bg);
    if (p && p.a > 0) return p;
    node = node.parentElement;
  }
  const htmlBg = parseRGB(getComputedStyle(document.documentElement).backgroundColor);
  return htmlBg || fallback;
};

const shouldSkipAutoContrast = (el) => {
  // Не трогаем брендовые заголовки/ссылки/кнопки/CTA и элементы с явным классом отключения
  if (!el || el.closest('.no-contrast')) return true;
  if (el.matches('h1,h2,h3,h4,h5,h6,.section-title,.footer__title,.card-title')) return true;
  if (el.matches('.btn,.contact-cta,.nav__link,.footer__link')) return true;
  return false;
};

const ensureReadable = (el) => {
  if (!el || !el.isConnected) return;
  if (shouldSkipAutoContrast(el)) return;
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
  const bgLum = relLuminance(bg);
  const target = bgLum < 0.35 ? 'rgb(230,237,245)' : 'rgb(31,41,55)';
  el.style.color = target;
  el.setAttribute('data-autocontrast-applied', '1');
};

const scanContrast = () => {
  // Исключаем заголовки/брендовые элементы из сканирования
  const candidates = document.querySelectorAll('p,span,li,a,small,div,button,label,summary');
  candidates.forEach((el) => {
    // Пропустить брендовые/навигационные ссылки
    if (el.matches('.nav__link,.footer__link,.contact-cta')) return;
    ensureReadable(el);
  });
};

window.addEventListener('DOMContentLoaded', () => {
  scanContrast();
});

const recheckAfterTheme = () => setTimeout(scanContrast, 400);
['themeToggle', 'themeToggleMobile'].forEach((id) => {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.addEventListener('click', () => {
    clearAutoContrast();
    recheckAfterTheme();
  });
});

// Мобильное меню
const mobileBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
if (mobileBtn && mobileMenu) {
  const setMenuState = (open) => {
    mobileBtn.setAttribute('aria-expanded', String(open));
    mobileMenu.classList.toggle('is-open', open);
    mobileMenu.setAttribute('aria-hidden', String(!open));
  };
  setMenuState(false);
  mobileBtn.addEventListener('click', () => {
    const expanded = mobileBtn.getAttribute('aria-expanded') === 'true';
    setMenuState(!expanded);
  });
  mobileMenu.querySelectorAll('a').forEach((link) =>
    link.addEventListener('click', () => setMenuState(false))
  );
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenuState(false);
  });
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
  { threshold: 0.2 }
);
animated.forEach((el) => observer.observe(el));

// Кнопка «наверх»
const toTopBtn = document.getElementById('toTop');
if (toTopBtn) {
  let ticking = false;
  const updateToTop = () => { toTopBtn.hidden = !(window.scrollY > 600); ticking = false; };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateToTop);
      ticking = true;
    }
  }, { passive: true });
  updateToTop();
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
  navLinks.forEach(a => {
    const isActive = a.getAttribute('href') === `#${id}`;
    a.classList.toggle('is-active', isActive);
    if (isActive) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}
const so = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) setActive(e.target.id);
  });
}, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });
sections.forEach(s => s && so.observe(s));

// Testimonials carousel: drag scroll only (no buttons, no autoplay)
(() => {
  const rootEl = document.getElementById('testimonialsCarousel');
  if (!rootEl) return;
  const track = rootEl.querySelector('.carousel__track');
  if (!track) return;

  // keyboard support when track is focused
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); track.scrollBy({ left: 80, behavior: 'smooth' }); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); track.scrollBy({ left: -80, behavior: 'smooth' }); }
  });

  // drag to scroll
  let isDown = false, startX = 0, startScroll = 0;
  const onDown = (x) => { isDown = true; startX = x; startScroll = track.scrollLeft; track.classList.add('is-dragging'); };
  const onMove = (x) => { if (!isDown) return; const dx = x - startX; track.scrollLeft = startScroll - dx; };
  const onUp = () => { if (!isDown) return; isDown = false; track.classList.remove('is-dragging'); };

  track.addEventListener('pointerdown', (e) => { track.setPointerCapture(e.pointerId); onDown(e.clientX); }, { passive: true });
  track.addEventListener('pointermove', (e) => onMove(e.clientX), { passive: true });
  track.addEventListener('pointerup', onUp, { passive: true });
  track.addEventListener('pointercancel', onUp, { passive: true });
})();

// Enhance testimonials carousel with buttons
(() => {
  const rootEl = document.getElementById('testimonialsCarousel');
  if (!rootEl) return;
  const track = rootEl.querySelector('.carousel__track');
  const prev = document.getElementById('carouselPrev');
  const next = document.getElementById('carouselNext');
  if (!track || !prev || !next) return;
  const step = () => Math.max(80, Math.min(360, track.clientWidth * 0.6));
  prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
})();

// Parallax for hero media (respect prefers-reduced-motion)
(() => {
  const prm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prm) return;
  const media = document.querySelector('.hero__media .media-frame');
  if (!media) return;
  let ticking = false;
  const maxShift = 14; // px
  const onScroll = () => {
    const rect = media.getBoundingClientRect();
    const vp = window.innerHeight || document.documentElement.clientHeight;
    const center = rect.top + rect.height / 2;
    const ratio = Math.max(-1, Math.min(1, (center - vp / 2) / (vp / 2)));
    media.style.transform = `translateY(${(-ratio * maxShift).toFixed(1)}px)`;
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking){ requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();
})();

// content-visibility for below-the-fold sections
(() => {
  const sections = Array.from(document.querySelectorAll('#about, #method, #testimonials, #faq, #contact'));
  sections.forEach((sec) => {
    sec.style.contentVisibility = 'auto';
    sec.style.containIntrinsicSize = '1000px';
  });
})();

// Mobile menu: outside click and basic focus trap
(() => {
  const btn = document.getElementById('mobileMenuBtn');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;
  const focusable = () => Array.from(menu.querySelectorAll('a,button,[tabindex]:not([tabindex="-1"])'));
  const isOpen = () => menu.classList.contains('is-open');
  const onDocClick = (e) => {
    if (!isOpen()) return;
    if (!menu.contains(e.target) && e.target !== btn) {
      menu.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
    }
  };
  document.addEventListener('click', onDocClick, { passive: true });
  menu.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key !== 'Tab') return;
    const nodes = focusable();
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
})(); 