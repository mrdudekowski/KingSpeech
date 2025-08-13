### KingSpeech — лендинг онлайн‑курсов английского

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white&style=flat)](https://developer.mozilla.org/docs/Web/Guide/HTML/HTML5)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white&style=flat)](https://developer.mozilla.org/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=000&style=flat)](https://developer.mozilla.org/docs/Web/JavaScript)
[![A11y](https://img.shields.io/badge/a11y-WCAG%20AA-0ea5e9?style=flat)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![Deps](https://img.shields.io/badge/zero_deps-vanilla_js-22c55e?style=flat)](https://developer.mozilla.org/docs/Web/JavaScript)

Лёгкий и быстрый одностраничный сайт с акцентом на доступность (WCAG AA), современную типографику и производительность. Исходники лежат в каталоге `KingSpeech/`.

<img width="1898" height="980" alt="image" src="https://github.com/user-attachments/assets/195fdef8-8898-49f9-8671-088f3462cc22" />


### Демо

- **GitHub Pages**: [mrdudekowski.github.io/KingSpeech](https://mrdudekowski.github.io/KingSpeech/)

### Главные достижения

- **Доступность**: семантическая разметка, `aria-*`, фокус‑менеджмент, управление с клавиатуры (меню, модальное окно, карусель), live‑region в слайдере.
- **Производительность**: `preload` ключевых шрифтов и изображений, `fetchpriority`, `content-visibility`, ленивые вычисления через `requestAnimationFrame` и `IntersectionObserver`.
- **Тёмная тема**: по умолчанию — dark, переключатель с сохранением в `localStorage`, мягкая анимация «заката».
- **Графика и LCP**: адаптивные изображения (`sizes/srcset`), WebP, чёткая композиция hero‑блока.
- **UX-компоненты**: отзывчивая сетка, доступная карусель отзывов (клавиатура/drag), модальное чтение полного отзыва.
- **SEO**: Open Graph + JSON‑LD (`Organization`, `FAQPage`).

### Технический стек

- **HTML5**, **CSS3 (vanilla)**, **JavaScript (vanilla)** — без фреймворков и сборщиков
- Локальные шрифты: Plus Jakarta Sans (woff2‑сабсеты)
- Хостинг: GitHub Pages

### Запуск локально

Вариант 1: просто открыть файл.

1. Откройте файл `KingSpeech/index.html` в браузере.

Вариант 2: локальный сервер (рекомендуется для корректной загрузки ассетов):

```bash
npx serve KingSpeech -p 5173 --single
```

### Структура

```text
KingSpeech/
  index.html          # Страница лендинга
  styles.css          # Дизайн‑система, компоненты, анимации
  script.js           # Темизация, доступность, карусель, валидация формы
  theme-preinit.js    # Ранний хук, чтобы избежать миганий темы
  fonts/              # Локальные woff2 + @font-face
  assets/hero/        # Адаптивные изображения для hero
  Vector_clean_*.png/.webp
```

### Разработка

- Сборка не требуется; правки в `KingSpeech/` сразу видны в браузере.
- Цель — держать код простым, читаемым и без лишних зависимостей.

