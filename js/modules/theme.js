/**
 * Theme Manager - Handles light/dark theme switching
 * @class ThemeManager
 */
class ThemeManager {
  constructor() {
    this.theme = null;
    this.themeToggle = null;
    this.init();
  }

  /**
   * Initialize theme manager
   */
  init() {
    this.detectInitialTheme();
    this.setupThemeToggle();
    this.setupSystemThemeListener();
    this.applyTheme(this.theme);
    this.updateToggleState(); // Обновляем состояние кнопки после инициализации
  }

  /**
   * Detect initial theme from various sources
   */
  detectInitialTheme() {
    // Priority: localStorage > HTML class > system preference
    const savedTheme = localStorage.getItem('kingspeech-theme');
    const htmlHasDarkClass = document.documentElement.classList.contains('dark');
    
    if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
      this.theme = savedTheme;
    } else if (htmlHasDarkClass) {
      this.theme = 'dark';
    } else {
      this.theme = this.getSystemTheme();
    }
  }

  /**
   * Get system theme preference
   */
  getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  /**
   * Setup theme toggle button
   */
  setupThemeToggle() {
    this.themeToggle = document.querySelector('[data-theme-toggle]');
    console.log('🔍 Theme toggle button found:', this.themeToggle);
    
    if (this.themeToggle) {
      this.themeToggle.addEventListener('click', () => {
        console.log('🎯 Theme toggle clicked!');
        this.toggleTheme();
      });
      this.themeToggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          console.log('🎯 Theme toggle activated via keyboard!');
          this.toggleTheme();
        }
      });
      console.log('✅ Theme toggle event listeners added');
    } else {
      console.error('❌ Theme toggle button not found!');
    }
  }

  /**
   * Setup system theme change listener
   */
  setupSystemThemeListener() {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        // Only auto-switch if user hasn't manually set a theme
        if (!localStorage.getItem('kingspeech-theme')) {
          const newTheme = e.matches ? 'dark' : 'light';
          this.applyTheme(newTheme);
        }
      });
    }
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const newTheme = this.theme === 'light' ? 'dark' : 'light';
    console.log(`🔄 Toggling theme from ${this.theme} to ${newTheme}`);
    
    // Add sunset animation ONLY when switching from light to dark
    if (this.theme === 'light' && newTheme === 'dark' && this.themeToggle) {
      const sky = this.themeToggle.querySelector('.theme-sky');
      if (sky) {
        console.log('✨ Adding sunset animation (light → dark)');
        sky.classList.add('sunset-active');
        setTimeout(() => sky.classList.remove('sunset-active'), 1200);
      } else {
        console.warn('⚠️ Theme sky element not found');
      }
    }
    
    this.setTheme(newTheme);
  }

  /**
   * Set specific theme
   */
  setTheme(theme) {
    if (!['light', 'dark'].includes(theme)) {
      console.warn(`Invalid theme: ${theme}`);
      return;
    }

    console.log(`🎨 Setting theme to: ${theme}`);
    this.theme = theme;
    this.applyTheme(theme);
    this.saveTheme(theme);
    this.updateToggleState();
  }

  /**
   * Apply theme to document
   */
  applyTheme(theme) {
    console.log(`🎯 Applying theme: ${theme}`);
    
    // Add transition class to prevent flashing
    document.documentElement.classList.add('theme-transitioning');
    
    // Use class 'dark' on html element (modern approach)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      console.log('✅ Added "dark" class to html element');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      console.log('✅ Added "light" class to html element');
    }
    
    // Update theme-color meta tag
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', theme === 'dark' ? '#0F172A' : '#FFFFFF');
      console.log('✅ Updated theme-color meta tag');
    }

    // Update color-scheme CSS property for browser UI
    document.documentElement.style.colorScheme = theme;
    
    // Remove transition class after a short delay
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 300);
  }

  /**
   * Update CSS custom properties for theme-specific values
   */
  updateThemeVariables(theme) {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      // Dark theme overrides
      root.style.setProperty('--bg', '#0a0a0a');
      root.style.setProperty('--bg-secondary', '#1a1a1a');
      root.style.setProperty('--text', '#ffffff');
      root.style.setProperty('--text-secondary', '#a0a0a0');
      root.style.setProperty('--border', '#333333');
      root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.3)');
    } else {
      // Light theme (default from CSS variables)
      root.style.removeProperty('--bg');
      root.style.removeProperty('--bg-secondary');
      root.style.removeProperty('--text');
      root.style.removeProperty('--text-secondary');
      root.style.removeProperty('--border');
      root.style.removeProperty('--shadow-color');
    }
  }

  /**
   * Save theme preference
   */
  saveTheme(theme) {
    localStorage.setItem('kingspeech-theme', theme);
  }

  /**
   * Update toggle button state
   */
  updateToggleState() {
    if (this.themeToggle) {
      // Update aria-label for accessibility
      this.themeToggle.setAttribute('aria-label', 
        this.theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'
      );
      
      // Update aria-pressed for accessibility
      this.themeToggle.setAttribute('aria-pressed', String(this.theme === 'dark'));
      
      // Update title attribute
      this.themeToggle.setAttribute('title', 
        this.theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'
      );
      
      // Add visual state class for debugging
      this.themeToggle.classList.toggle('theme-dark', this.theme === 'dark');
      this.themeToggle.classList.toggle('theme-light', this.theme === 'light');
      
      console.log(`🎨 Theme toggle state updated: ${this.theme}`);
    }
  }

  /**
   * Get current theme
   */
  getCurrentTheme() {
    return this.theme;
  }

  /**
   * Check if dark theme is active
   */
  isDarkTheme() {
    return this.theme === 'dark';
  }

  /**
   * Check if light theme is active
   */
  isLightTheme() {
    return this.theme === 'light';
  }

  /**
   * Reset to system theme
   */
  resetToSystemTheme() {
    localStorage.removeItem('kingspeech-theme');
    const systemTheme = this.getSystemTheme();
    this.setTheme(systemTheme);
  }

  /**
   * Destroy theme manager
   */
  destroy() {
    if (this.themeToggle) {
      this.themeToggle.removeEventListener('click', this.toggleTheme);
      this.themeToggle.removeEventListener('keydown', this.handleKeydown);
    }
    
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.removeEventListener('change', this.handleSystemThemeChange);
    }
  }
}

// Export for ES modules
export default ThemeManager;
