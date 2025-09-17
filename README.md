# 🎯 KingSpeech Landing Page

**Современная лендинг-страница для курсов английского языка**  
*Полностью функциональная, адаптивная и оптимизированная*

---

## 🚀 Быстрый старт

### ⚠️ Важно: Не открывайте index.html напрямую!
**Причина:** ES6 модули и современный JavaScript не работают с `file://` протоколом.

### 🛠️ Правильные способы запуска:

#### **Способ 1: Автоматический запуск (Windows)**
```bash
# Двойной клик на файл:
start-server.bat
```

#### **Способ 2: PowerShell (Windows)**
```powershell
.\start-server.ps1
```

#### **Способ 3: Python сервер**
```bash
python server.py
# или
python -m http.server 8000
```

#### **Способ 4: Node.js сервер**
```bash
npx serve .
# или
npx http-server
```

### 🌐 Откройте в браузере:
```
http://localhost:8000
```

---

## ✨ Особенности

### 🎨 Современный дизайн
- **Адаптивный дизайн** - Mobile-first подход
- **Тёмная/светлая тема** - Автоматическое определение системных настроек
- **Плавные анимации** - CSS transitions и keyframes
- **Aurora эффект** - Красивый фоновый градиент

### ⚡ JavaScript функциональность
- **Theme Manager** - Переключение тем с localStorage
- **Navigation Manager** - Мобильное меню и плавная прокрутка
- **Carousel Manager** - Карусель отзывов с touch поддержкой
- **Form Manager** - Валидация форм и обработка отправки
- **Animation Manager** - Scroll-triggered анимации

### 📱 Адаптивность
- **Desktop**: 1280px+
- **Tablet**: 768px - 1279px
- **Mobile**: 320px - 767px
- **Touch-friendly** - Оптимизировано для мобильных устройств

### ♿ Доступность
- **WCAG 2.1 AA** - Соответствие стандартам
- **ARIA атрибуты** - Screen reader поддержка
- **Keyboard navigation** - Полная навигация с клавиатуры
- **Focus management** - Правильное управление фокусом

---

## 🏗️ Архитектура проекта

```
kingspeech-landing/
├── index.html              # Главная страница
├── css/                    # Стили
│   ├── main.css           # Основной CSS файл
│   ├── base/              # Базовые стили
│   │   ├── reset.css      # CSS reset
│   │   ├── variables.css  # CSS переменные
│   │   └── typography.css # Типографика
│   └── components/        # Компоненты
│       ├── button.css     # Кнопки
│       ├── header.css     # Хедер и навигация
│       ├── hero.css       # Главный экран
│       ├── about.css      # О преподавателе
│       ├── cards.css      # Карточки методики
│       ├── carousel.css   # Карусель отзывов
│       ├── faq.css        # FAQ секция
│       ├── forms.css      # Формы
│       └── footer.css     # Футер
├── js/                     # JavaScript
│   ├── main.js            # Главное приложение
│   ├── modules/           # Модули
│   │   ├── theme.js       # Управление темами
│   │   ├── navigation.js  # Навигация
│   │   ├── carousel.js    # Карусель
│   │   ├── forms.js       # Формы
│   │   └── animations.js  # Анимации
│   ├── theme-preinit.js   # Предварительная инициализация темы
│   └── structured-data.js # SEO разметка
└── assets/                 # Ресурсы
    ├── images/            # Изображения
    ├── hero/              # Hero изображения
    └── favicon.ico        # Иконка сайта
```

---

## 🎨 CSS система

### CSS переменные
```css
:root {
  /* Цвета */
  --accent: #FF7A00;
  --bg: #FFFFFF;
  --text: #1A202C;
  
  /* Размеры */
  --container-max-width: 1280px;
  --header-height: 72px;
  
  /* Анимации */
  --transition-fast: 150ms;
  --transition-normal: 300ms;
  --transition-slow: 500ms;
}
```

### Анимации
```css
/* Fade in */
.animate-fade-in {
  opacity: 0;
  animation: fadeIn 0.6s ease-out forwards;
}

/* Slide up */
.animate-slide-up {
  opacity: 0;
  transform: translateY(30px);
  animation: slideUp 0.6s ease-out forwards;
}
```

---

## ⚡ JavaScript модули

### Theme Manager
```javascript
const themeManager = new ThemeManager();
// Автоматически определяет и применяет тему
// Поддерживает localStorage и системные настройки
```

### Navigation Manager
```javascript
const navigationManager = new NavigationManager();
// Управляет мобильным меню
// Плавная прокрутка к якорям
// Active link highlighting
```

### Carousel Manager
```javascript
const carouselManager = new CarouselManager();
// Автоматическая прокрутка
// Touch/swipe поддержка
// Keyboard navigation
```

---

## 📊 Производительность

### Core Web Vitals
- **LCP**: < 2.5s ✅
- **FID**: < 100ms ✅
- **CLS**: < 0.1 ✅

### Оптимизации
- **CSS Variables** - Эффективная система тем
- **Hardware acceleration** - Transform-based анимации
- **Intersection Observer** - Оптимизированные scroll анимации
- **Image optimization** - WebP формат с fallbacks

---

## 🌐 Браузерная поддержка

| Браузер | Версия | Статус |
|---------|--------|--------|
| Chrome | 90+ | ✅ Полная поддержка |
| Firefox | 88+ | ✅ Полная поддержка |
| Safari | 14+ | ✅ Полная поддержка |
| Edge | 90+ | ✅ Полная поддержка |
| Mobile Safari | 14+ | ✅ Полная поддержка |
| Chrome Mobile | 90+ | ✅ Полная поддержка |

---

## 🧪 Тестирование

### Тестовая страница
```
http://localhost:8000/test-modules.html
```
- Тестирование всех JavaScript модулей
- Проверка функциональности
- Валидация CSS анимаций

### Performance тест
```
http://localhost:8000/performance-test.html
```
- Мониторинг Core Web Vitals
- Анализ производительности
- Resource timing

---

## 🚀 Развертывание

### Статический хостинг
```bash
# Сборка для продакшена
npm run build

# Загрузка на хостинг
# (Netlify, Vercel, GitHub Pages, etc.)
```

### Docker
```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 📝 Скрипты

### Разработка
```bash
# Запуск локального сервера
npm run dev

# Линтинг CSS
npm run lint:css

# Линтинг JavaScript
npm run lint:js
```

### Сборка
```bash
# Минификация CSS
npm run build:css

# Минификация JavaScript
npm run build:js

# Полная сборка
npm run build
```

---

## 🔧 Настройка

### Переменные окружения
```bash
# .env
ANALYTICS_GA_ID=your-ga-id
ANALYTICS_YANDEX_ID=your-yandex-id
API_ENDPOINT=https://api.example.com
```

### Конфигурация
```javascript
// config.js
export const CONFIG = {
  analytics: {
    gaId: process.env.ANALYTICS_GA_ID,
    yandexId: process.env.ANALYTICS_YANDEX_ID
  },
  api: {
    endpoint: process.env.API_ENDPOINT
  }
};
```

---

## 📚 Документация

### Компоненты
- [Button System](./docs/components/button.md)
- [Navigation](./docs/components/navigation.md)
- [Carousel](./docs/components/carousel.md)
- [Forms](./docs/components/forms.md)

### Модули
- [Theme Manager](./docs/modules/theme.md)
- [Navigation Manager](./docs/modules/navigation.md)
- [Carousel Manager](./docs/modules/carousel.md)
- [Form Manager](./docs/modules/forms.md)

### Утилиты
- [CSS Variables](./docs/utilities/css-variables.md)
- [Animations](./docs/utilities/animations.md)
- [Responsive Design](./docs/utilities/responsive.md)

---

## 🤝 Вклад в проект

1. **Fork** репозиторий
2. **Создайте** feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** изменения (`git commit -m 'Add amazing feature'`)
4. **Push** в branch (`git push origin feature/amazing-feature`)
5. **Откройте** Pull Request

---

## 📄 Лицензия

Этот проект распространяется под лицензией MIT. См. файл [LICENSE](LICENSE) для подробностей.

---

## 🆘 Поддержка

- **Issues**: [GitHub Issues](https://github.com/username/kingspeech-landing/issues)
- **Discussions**: [GitHub Discussions](https://github.com/username/kingspeech-landing/discussions)
- **Email**: support@kingspeech.com

---

## 🏆 Достижения

- ✅ **Stage 1**: Базовая структура
- ✅ **Stage 2**: CSS компоненты
- ✅ **Stage 3**: JavaScript функциональность
- ✅ **Stage 4**: Оптимизация и тестирование

**Проект готов для продакшена! 🎉**

---

*Последнее обновление: 3 сентября 2025*  
*Версия: 1.0.0*  
*Статус: PRODUCTION READY*
