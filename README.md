### KingSpeech — лендинг онлайн‑курсов английского

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white&style=flat)](https://developer.mozilla.org/docs/Web/Guide/HTML/HTML5)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white&style=flat)](https://developer.mozilla.org/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=000&style=flat)](https://developer.mozilla.org/docs/Web/JavaScript)
[![A11y](https://img.shields.io/badge/a11y-WCAG%20AA-0ea5e9?style=flat)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![Deps](https://img.shields.io/badge/zero_deps-vanilla_js-22c55e?style=flat)](https://developer.mozilla.org/docs/Web/JavaScript)

Лёгкий и быстрый одностраничный сайт с акцентом на доступность (WCAG AA), современную типографику и производительность.

![Скриншот](landingscreenshot.jpeg)

### Демо

- GitHub Pages: [mrdudekowski.github.io/KingSpeech](https://mrdudekowski.github.io/KingSpeech/)

### Главные достижения

- Доступность: семантическая разметка, `aria-*`, фокус‑менеджмент, управление с клавиатуры (меню, модальное, карусель), live‑region в слайдере
- Производительность: `preload` шрифтов/изображений, `fetchpriority`, `content-visibility`, `IntersectionObserver`/`rAF`
- Тёмная тема: по умолчанию — dark, переключатель с `localStorage` и мягкой анимацией
- Графика и LCP: адаптивные изображения (`sizes/srcset`), WebP, композиция hero‑блока
- UX‑компоненты: отзывчивая сетка, доступная карусель отзывов (клавиатура/drag), модальное чтение полного отзыва
- SEO: Open Graph + JSON‑LD (`Organization`, `FAQPage`)

### Технический стек

- HTML5, CSS (vanilla), JavaScript (vanilla)
- Локальные шрифты: Plus Jakarta Sans (woff2)
- Хостинг: GitHub Pages

### Запуск локально

1) Открыть `index.html` в браузере

2) Рекомендуемый локальный сервер для корректной загрузки ассетов:

```bash
npx serve . -p 5173 --single
```

### Структура

```text
index.html       # Страница лендинга
styles.css       # Дизайн‑система, компоненты, анимации
script.js        # Темизация, доступность, карусель, валидация формы
theme-preinit.js # Ранний хук, чтобы избежать миганий темы
fonts/           # Локальные woff2 + @font-face
assets/hero/     # Адаптивные изображения для hero
```


