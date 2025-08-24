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
// Инициализация темы: если нет сохранённого, по умолчанию тёмная
(() => {
  const saved = getStoredTheme();
  if (saved) {
    applyTheme(saved);
  } else {
    applyTheme('dark');
    setStoredTheme('dark');
  }
  requestAnimationFrame(() => document.documentElement.classList.remove('no-transitions'));
})();

// Modal logic for testimonials
function openReviewModal(startIndex){
  const modal = document.getElementById('reviewModal');
  if (!modal) return;
  const items = Array.from(document.querySelectorAll('#testimonials .testimonial'));
  const avatars = items.map(i => i.querySelector('.testimonial-avatar').getAttribute('src'));
  const names = items.map(i => i.querySelector('.testimonial-name').textContent.trim());
  const fullTexts = items.map(i => i.querySelector('.testimonial-quote').getAttribute('data-full') || i.querySelector('.testimonial-quote').textContent.trim());

  const avatarEl = modal.querySelector('.modal__avatar');
  const nameEl = modal.querySelector('.modal__name');
  const quoteEl = modal.querySelector('.modal__quote');
  const prevBtn = modal.querySelector('.modal__prev');
  const nextBtn = modal.querySelector('.modal__next');
  const closeEls = modal.querySelectorAll('[data-close]');
  const dialog = modal.querySelector('.modal__dialog');

  let index = startIndex;
  // точки навигации в модалке
  let indicatorsWrap = modal.querySelector('.modal__indicators');
  if (!indicatorsWrap) {
    indicatorsWrap = document.createElement('div');
    indicatorsWrap.className = 'carousel__indicators modal__indicators';
    dialog && dialog.appendChild(indicatorsWrap);
  }
  indicatorsWrap.innerHTML = '';
  const modalContent = modal.querySelector('.modal__content');
  const animateModal = (dir) => {
    if (!modalContent) return;
    modalContent.classList.remove('anim-forward', 'anim-back');
    modalContent.getBoundingClientRect();
    modalContent.classList.add(dir > 0 ? 'anim-forward' : 'anim-back');
    setTimeout(() => modalContent.classList.remove('anim-forward', 'anim-back'), 320);
  };

  const dots = avatars.map((_, i) => {
    const b = document.createElement('button');
    b.className = 'carousel__indicator';
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', `Отзыв ${i + 1} из ${avatars.length}`);
    b.addEventListener('click', () => {
      const dir = i > index ? 1 : -1;
      animateModal(dir);
      index = i;
      render();
      updateDots();
    });
    indicatorsWrap.appendChild(b);
    return b;
  });

  const render = () => {
    avatarEl.src = avatars[index];
    avatarEl.alt = `Аватар ${names[index]}`;
    nameEl.textContent = names[index];
    quoteEl.textContent = fullTexts[index];
  };
  const updateDots = () => {
    dots.forEach((d, i) => {
      const active = i === index;
      d.classList.toggle('is-active', active);
      d.setAttribute('aria-selected', String(active));
    });
  };
  const show = () => { modal.setAttribute('aria-hidden', 'false'); render(); updateDots(); };
  const hide = () => { modal.setAttribute('aria-hidden', 'true'); };

  const go = (dir) => {
    const nextIndex = (index + dir + items.length) % items.length;
    animateModal(dir);
    index = nextIndex;
    render();
  };
  // стрелки скрываем, но оставляем клавиатуру
  if (prevBtn) { prevBtn.style.display = 'none'; prevBtn.tabIndex = -1; }
  if (nextBtn) { nextBtn.style.display = 'none'; nextBtn.tabIndex = -1; }
  closeEls.forEach(el => el.onclick = hide);
  modal.addEventListener('click', (e) => { if (e.target.matches('.modal')) hide(); });
  document.addEventListener('keydown', function onEsc(e){ if(e.key==='Escape'){ hide(); document.removeEventListener('keydown', onEsc); } });
  dialog && dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); updateDots(); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); go(-1); updateDots(); }
  });

  show();
}
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

// Контраст: ограничиваем область сканирования до контент‑секций
const scanContrast = () => {
  const scope = document.querySelectorAll('.section :where(p,span,li,small,div,button,label,summary)');
  scope.forEach((el) => {
    if (el.closest('header, nav, footer')) return;
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
  let lastFocus = null;
  const firstFocusable = () => mobileMenu.querySelector('a,button');
  const setMenuState = (open) => {
    mobileBtn.setAttribute('aria-expanded', String(open));
    mobileMenu.classList.toggle('is-open', open);
    mobileMenu.setAttribute('aria-hidden', String(!open));
    if (open) {
      lastFocus = document.activeElement;
      const first = firstFocusable();
      first && first.focus();
    } else if (lastFocus && lastFocus.focus) {
      lastFocus.focus();
    }
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
  const showAfter = 400;
  let ticking = false;
  const updateToTop = () => {
    const shouldShow = window.scrollY > showAfter;
    toTopBtn.classList.toggle('is-visible', shouldShow);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateToTop);
      ticking = true;
    }
  }, { passive: true });
  updateToTop();
  toTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// Telegram CTA analytics
document.getElementById('tgCtaBtn')?.addEventListener('click', () => {
  localStorage.setItem('lead_source', 'telegram_cta');
  console.info('[lead] telegram_cta_clicked');
});

// ===== FX: Mail send animation =====
const supportsMotionPath = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('offset-path', 'path("M0,0 L1,1")');

const getCenter = (el) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

const buildPath = (start, end) => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const c1x = start.x + dx * 0.25, c1y = start.y - Math.abs(dy) * 0.8;
  const midX = start.x + dx * 0.55, midY = start.y - Math.abs(dy) * 0.15;
  const c3x = end.x - dx * 0.20, c3y = end.y + Math.abs(dy) * 0.25;
  return `M ${start.x},${start.y} C ${c1x},${c1y} ${start.x + dx * 0.45},${start.y - Math.abs(dy) * 0.25} ${midX},${midY} S ${c3x},${c3y} ${end.x},${end.y}`;
};

async function playMailAnimation() {
  const btn = document.querySelector('#leadForm button[type="submit"]');
  const slotAnchor = document.getElementById('mailSlotAnchor');
  const fxLayer = document.getElementById('fxLayer');
  if (!btn || !slotAnchor || !fxLayer) return;

  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Press‑bounce before liftoff
  try { await (btn.animate([
    { transform: 'translateY(0) scale(1)' },
    { transform: 'translateY(1px) scale(0.98)' },
    { transform: 'translateY(0) scale(1)' },
  ], { duration: 90, easing: 'cubic-bezier(.2,.9,.2,1)' }).finished); } catch(_) {}

  const start = getCenter(btn);
  const end = getCenter(slotAnchor);

  if (reduce) {
    // Без полёта: подсветка слота и сообщение
    const slot = document.createElement('div');
    slot.className = 'fx-slot';
    slot.style.left = `${end.x - 60}px`;
    slot.style.top = `${end.y - 6}px`;
    fxLayer.appendChild(slot);
    try { await slot.animate([{ transform:'scaleY(1)' }, { transform:'scaleY(0.86)' }, { transform:'scaleY(1)' }], { duration: 220 }).finished; } catch(_) {}
    slot.remove();
    showFxSuccess();
    return;
  }

  const path = buildPath(start, end);
  const env = document.createElement('div');
  env.className = 'fx-envelope';
  env.style.left = `${start.x}px`;
  env.style.top = `${start.y}px`;
  fxLayer.appendChild(env);

  const slot = document.createElement('div');
  slot.className = 'fx-slot';
  slot.style.left = `${end.x - 60}px`;
  slot.style.top = `${end.y - 6}px`;
  fxLayer.appendChild(slot);

  if (supportsMotionPath) {
    env.style.offsetPath = `path("${path}")`;
    env.style.offsetRotate = 'auto 12deg';
    // Trails
    const trails = [];
    for (let i = 0; i < 3; i++) {
      const t = document.createElement('div');
      t.className = 'fx-trail';
      t.style.offsetPath = `path("${path}")`;
      t.style.offsetRotate = 'auto';
      fxLayer.appendChild(t);
      t.animate([
        { offsetDistance: '0%', opacity: 0.6 },
        { offsetDistance: '100%', opacity: 0 }
      ], { duration: 900, delay: i * 60, easing: 'cubic-bezier(.33,1,.68,1)' }).finished.then(() => t.remove()).catch(() => t.remove());
      trails.push(t);
    }

    // Segmented timing: 60% + 40%
    try { await env.animate([
      { offsetDistance: '0%' },
      { offsetDistance: '60%' }
    ], { duration: 560, easing: 'cubic-bezier(.16,1,.3,1)' }).finished; } catch(_) {}

    try { await env.animate([
      { offsetDistance: '60%' },
      { offsetDistance: '100%' }
    ], { duration: 340, easing: 'cubic-bezier(.4,0,.6,1)' }).finished; } catch(_) {}
  } else {
    // Fallback: simple translate
    const dx = end.x - start.x, dy = end.y - start.y;
    try { await env.animate([
      { transform: `translate(-50%, -50%) translate(0px,0px)` },
      { transform: `translate(-50%, -50%) translate(${dx * 0.6}px, ${dy * 0.6}px)` },
      { transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px)` }
    ], { duration: 900, easing: 'cubic-bezier(.2,.9,.2,1)' }).finished; } catch(_) {}
  }

  // Dive into slot and cleanup
  try { await Promise.all([
    env.animate([
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
      { transform: 'translate(-50%,-50%) scale(0.82)', opacity: 0 }
    ], { duration: 180, easing: 'cubic-bezier(.2,.9,.2,1)' }).finished,
    slot.animate([
      { transform: 'scaleY(1)' },
      { transform: 'scaleY(0.84)' },
      { transform: 'scaleY(1)' }
    ], { duration: 200, easing: 'cubic-bezier(.2,.9,.2,1)' }).finished
  ]); } catch(_) {}
  env.remove();
  slot.remove();
  showFxSuccess();
}

function showFxSuccess(){
  const old = document.querySelector('.fx-success');
  if (old) old.remove();
  const box = document.createElement('div');
  box.className = 'fx-success';
  box.textContent = 'Преподаватель скоро с вами свяжется';
  document.body.appendChild(box);
  try { box.animate([
    { transform:'translateY(8px)', opacity: 0 },
    { transform:'translateY(0)', opacity: 1 }
  ], { duration: 260, easing: 'cubic-bezier(.16,1,.3,1)' }); } catch(_) {}
  setTimeout(() => {
    try { box.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 280, delay: 2600, fill: 'forwards' }).finished.then(() => box.remove()); } catch(_) { box.remove(); }
  }, 0);
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
    const hiddenMessenger = form.querySelector('#messenger');
    const hiddenGoal = form.querySelector('#goal');
    const honeypot = form.querySelector('#website');

    const nameOk = name.value.trim().length >= 2;
    const emailOk = email.value.trim() ? validateEmail(email.value) : false;
    const phoneDigits = digits(phone.value);
    const phoneOk = phone.value.trim() ? phoneDigits.length >= 10 : false;
    const contactOk = emailOk || phoneOk;

    if (!nameOk) { setFieldState(name, false, 'Пожалуйста, укажите имя (минимум 2 символа).'); return; }
    if (!contactOk) {
      setFieldState(email, false);
      setFieldState(phone, false, 'Укажите email или телефон.');
      return;
    }

    setFieldState(name, true);
    // Email и телефон: если поле пустое, не подсвечиваем как ошибку (оно опционально)
    setFieldState(email, email.value.trim() ? emailOk : true);
    setFieldState(phone, phone.value.trim() ? phoneOk : true);

    const consent = form.querySelector('#consent');
    if (consent && !consent.checked) {
      if (message) {
        message.textContent = 'Пожалуйста, подтвердите согласие с политикой конфиденциальности.';
        message.className = 'text-sm text-red-600';
      }
      consent.focus();
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Отправка…'; }

    try {
      const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxcjbU-GAUIZuRYQsPD877Y8p7HkJ0xRcGoeHTNflbvqtOMy21r8OKu97fWNll6hlLVVQ/exec';
      const body = new URLSearchParams();
      body.set('name', name.value.trim());
      body.set('email', email.value.trim());
      body.set('phone', phone.value.trim());
      body.set('messenger', hiddenMessenger ? hiddenMessenger.value : '');
      body.set('goal', hiddenGoal ? hiddenGoal.value : '');
      body.set('page', window.location.href);
      body.set('ref', document.referrer || '');
      body.set('website', honeypot ? (honeypot.value || '') : '');

      const res = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body
      });

      let json = {};
      try { json = await res.json(); } catch (_) { json = {}; }
      if (!json || json.ok !== true) {
        const details = json && json.tg && json.tg.description ? `: ${json.tg.description}` : '';
        console.error('Lead send failed', { json });
        throw new Error('server_error' + details);
      }

      if (message) { message.textContent = ''; message.className = 'text-sm'; }
      form.reset();
      // Clean up focus and validation visuals so no outline remains
      const inputs = form.querySelectorAll('.form__input');
      inputs.forEach((el) => {
        el.blur();
        el.classList.remove('ring-2','ring-red-400','border-red-300','border-gray-200');
        el.removeAttribute('aria-invalid');
      });
      // FX mail animation + success toast
      playMailAnimation();
    } catch (err) {
      if (message) {
        message.textContent = 'Не удалось отправить заявку. Попробуйте позже или напишите в Telegram.';
        message.className = 'text-sm text-red-600';
      }
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Отправить заявку'; }
    }
  });
}

// Messenger chips + goal cards wiring
(() => {
  const formEl = document.getElementById('leadForm');
  if (!formEl) return;
  const chips = Array.from(formEl.querySelectorAll('.chip'));
  const hiddenMessenger = formEl.querySelector('#messenger');
  const hiddenGoal = formEl.querySelector('#goal');
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => { c.classList.remove('is-selected'); c.setAttribute('aria-pressed', 'false'); });
      chip.classList.add('is-selected');
      chip.setAttribute('aria-pressed', 'true');
      if (hiddenMessenger) hiddenMessenger.value = chip.getAttribute('data-value') || '';
    });
  });
  document.querySelectorAll('.goal-card-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const goal = btn.getAttribute('data-goal') || '';
      if (hiddenGoal) hiddenGoal.value = goal;
      const name = formEl.querySelector('#name');
      name && name.focus();
    });
  });
})();

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

// Testimonials carousel: group scroll + drag + keyboard
(() => {
  const rootEl = document.getElementById('testimonialsCarousel');
  if (!rootEl) return;
  const track = rootEl.querySelector('.carousel__track');
  const status = document.getElementById('carouselStatus');
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');
  if (!track) return;

  // индикаторы под каруселью
  const items = Array.from(track.querySelectorAll('.testimonial'));
  const indicatorsWrap = rootEl.querySelector('.carousel__indicators');
  const indicators = indicatorsWrap ? Array.from(indicatorsWrap.querySelectorAll('.carousel__indicator')) : [];

  const cols = () => (window.matchMedia('(min-width: 1200px)').matches ? 3 : (window.matchMedia('(min-width: 768px)').matches ? 2 : 1));
  const step = () => {
    const gap = 16; // sync with CSS --gap
    const visible = cols();
    const itemWidth = (track.clientWidth - (visible - 1) * gap) / visible;
    return itemWidth + gap;
  };

  const announce = () => {
    if (!status) return;
    const items = Array.from(track.querySelectorAll('.testimonial'));
    const visible = cols();
    const idx = Math.round(track.scrollLeft / step()) + 1; // 1-based index of first visible
    const last = Math.min(items.length, idx + visible - 1);
    status.textContent = `Отзыв(ы) ${idx}–${last} из ${items.length}`;
  };

  // buttons (на странице их нет, но оставляем на случай будущего использования)
  if (prevBtn) prevBtn.addEventListener('click', () => { track.scrollBy({ left: -step() * cols(), behavior: 'smooth' }); announce(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { track.scrollBy({ left: step() * cols(), behavior: 'smooth' }); announce(); });

  // keyboard on track
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); track.scrollBy({ left: step(), behavior: 'smooth' }); announce(); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); track.scrollBy({ left: -step(), behavior: 'smooth' }); announce(); }
  });

  // drag to scroll
  let isDown = false, startX = 0, startScroll = 0;
  const onDown = (x) => { isDown = true; startX = x; startScroll = track.scrollLeft; track.classList.add('is-dragging'); };
  const onMove = (x) => { if (!isDown) return; const dx = x - startX; track.scrollLeft = startScroll - dx; };
  const onUp = () => { if (!isDown) return; isDown = false; track.classList.remove('is-dragging'); announce(); };

  const isInteractive = (el) => !!(el && el.closest('button,a,input,textarea,select,[role="button"]'));
  track.addEventListener('pointerdown', (e) => {
    if (isInteractive(e.target)) return; // do not start drag on interactive elements
    track.setPointerCapture(e.pointerId);
    onDown(e.clientX);
  }, { passive: true });
  track.addEventListener('pointermove', (e) => {
    if (isInteractive(e.target)) return;
    onMove(e.clientX);
  }, { passive: true });
  track.addEventListener('pointerup', (e) => { if (isInteractive(e.target)) return; onUp(); }, { passive: true });
  track.addEventListener('pointercancel', onUp, { passive: true });

  // expand/collapse long quotes with animated height and proper clamp
  const cards = Array.from(track.querySelectorAll('.testimonial'));
  cards.forEach((card, idx) => {
    const quote = card.querySelector('.testimonial-quote');
    const textWrap = card.querySelector('.testimonial-text');
    if (!quote || !textWrap) return;
    const preview = (quote.textContent || '').trim();
    const full = quote.getAttribute('data-full');
    const needsToggle = (full && full.trim().length > preview.length) || (preview.length > 180);
    if (!needsToggle) return;
    if (!quote.hasAttribute('data-preview')) quote.setAttribute('data-preview', preview);

    const id = `ttext-${idx}`;
    textWrap.id = id;
    textWrap.style.maxHeight = `${textWrap.scrollHeight}px`; // establish current height
    // collapse to preview height after first frame to enable transition
    requestAnimationFrame(() => {
      textWrap.style.maxHeight = `${textWrap.scrollHeight}px`;
    });

    // Entire card opens modal
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');

    const getPreviewHeight = () => {
      // temporarily clamp and measure
      quote.style.webkitLineClamp = '6';
      quote.style.display = '-webkit-box';
      const h = textWrap.scrollHeight;
      quote.style.webkitLineClamp = '';
      quote.style.display = '';
      return h;
    };

    const expand = () => {
      card.classList.add('is-expanded');
      quote.textContent = full;
      // measure
      textWrap.style.maxHeight = `${textWrap.scrollHeight}px`; // set to current
      requestAnimationFrame(() => {
        textWrap.style.maxHeight = `${textWrap.scrollHeight}px`;
      });
      btn.setAttribute('aria-expanded', 'true');
    };

    const collapse = () => {
      card.classList.remove('is-expanded');
      quote.textContent = quote.getAttribute('data-preview') || preview;
      const ph = getPreviewHeight();
      textWrap.style.maxHeight = `${ph}px`;
      btn.setAttribute('aria-expanded', 'false');
    };

    // initialize collapsed height correctly: set preview content first and measure
    card.classList.remove('is-expanded');
    quote.textContent = quote.getAttribute('data-preview') || preview;
    // force collapsed clamp state via class for initial render
    card.classList.add('is-collapsed');
    const ph = getPreviewHeight();
    textWrap.style.maxHeight = `${ph}px`;
    // open modal on click/Enter
    const open = () => openReviewModal(idx);
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });

  const ro = new ResizeObserver(() => announce());
  ro.observe(track);

  // Активная точка по текущему первому видимому элементу
  const setActiveDot = (i) => {
    if (!indicators.length) return;
    const clamped = Math.max(0, Math.min(items.length - 1, i));
    indicators.forEach((b, idx) => {
      const active = idx === clamped;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-selected', String(active));
    });
  };

  const updateFromScroll = () => {
    const idx = Math.round(track.scrollLeft / step());
    setActiveDot(idx);
    announce();
    ticking = false;
  };
  let ticking = false;
  track.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(updateFromScroll); ticking = true; }
  }, { passive: true });

  // Клик по точкам — перейти к соответствующему посту
  indicators.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      const currentIdx = Math.round(track.scrollLeft / step());
      const forward = i > currentIdx;
      track.classList.remove('anim-forward', 'anim-back');
      track.getBoundingClientRect(); // reflow для рестарта анимации
      track.classList.add(forward ? 'anim-forward' : 'anim-back');
      track.scrollTo({ left: i * step(), behavior: 'smooth' });
      setActiveDot(i);
      announce();
      setTimeout(() => track.classList.remove('anim-forward', 'anim-back'), 320);
    });
  });

  // init
  setActiveDot(0);
  announce();
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