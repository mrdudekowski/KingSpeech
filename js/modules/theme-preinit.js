/**
 * Theme Pre-initialization
 * Предотвращение FOUC (Flash of Unstyled Content)
 */

(function() {
  'use strict';

  // Получаем сохраненную тему из localStorage
  function getStoredTheme() {
    try {
      return localStorage.getItem('kingspeech-theme');
    } catch (error) {
      return null;
    }
  }

  // Определяем системную тему
  function getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  // Определяем начальную тему
  function getInitialTheme() {
    const storedTheme = getStoredTheme();
    if (storedTheme && ['light', 'dark'].includes(storedTheme)) {
      return storedTheme;
    }
    return getSystemTheme();
  }

  // Применяем тему до загрузки CSS
  function applyTheme() {
    const theme = getInitialTheme();
    
    // Используем класс 'dark' на html элементе
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Обновляем мета-тег theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const color = theme === 'dark' ? '#0F172A' : '#FFFFFF';
      metaThemeColor.setAttribute('content', color);
    }
    
    console.log(`🎨 Тема предварительно установлена: ${theme}`);
  }

  // Запускаем сразу
  if (document.readyState === 'loading') {
    applyTheme();
  } else {
    // DOM уже загружен
    setTimeout(applyTheme, 0);
  }
})();
