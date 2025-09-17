/**
 * Simple Theme Manager - Simplified version for debugging
 * @class SimpleThemeManager
 */
class SimpleThemeManager {
  constructor() {
    this.theme = 'light';
    this.themeToggle = null;
    console.log('🚀 SimpleThemeManager constructor called');
    this.init();
  }

  /**
   * Initialize theme manager
   */
  init() {
    console.log('🔧 SimpleThemeManager init() called');
    this.detectInitialTheme();
    this.setupThemeToggle();
    this.applyTheme(this.theme);
    this.updateToggleState();
    console.log('✅ SimpleThemeManager initialized');
  }

  /**
   * Detect initial theme
   */
  detectInitialTheme() {
    console.log('🔍 Detecting initial theme...');
    const savedTheme = localStorage.getItem('kingspeech-theme');
    const htmlHasDarkClass = document.documentElement.classList.contains('dark');
    
    if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
      this.theme = savedTheme;
      console.log(`📱 Using saved theme: ${savedTheme}`);
    } else if (htmlHasDarkClass) {
      this.theme = 'dark';
      console.log('🌙 Using HTML dark class theme');
    } else {
      this.theme = 'light';
      console.log('☀️ Using default light theme');
    }
  }

  /**
   * Setup theme toggle button
   */
  setupThemeToggle() {
    console.log('🎯 Setting up theme toggle...');
    this.themeToggle = document.querySelector('[data-theme-toggle]');
    console.log('🔍 Theme toggle button found:', this.themeToggle);
    
    if (this.themeToggle) {
      this.themeToggle.addEventListener('click', (e) => {
        console.log('🎯 Theme toggle clicked!');
        e.preventDefault();
        this.toggleTheme();
      });
      console.log('✅ Theme toggle event listener added');
    } else {
      console.error('❌ Theme toggle button not found!');
    }
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const newTheme = this.theme === 'light' ? 'dark' : 'light';
    console.log(`🔄 Toggling theme from ${this.theme} to ${newTheme}`);
    
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
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      console.log('✅ Added "dark" class to html element');
    } else {
      document.documentElement.classList.remove('dark');
      console.log('✅ Removed "dark" class from html element');
    }
  }

  /**
   * Save theme preference
   */
  saveTheme(theme) {
    localStorage.setItem('kingspeech-theme', theme);
    console.log(`💾 Saved theme to localStorage: ${theme}`);
  }

  /**
   * Update toggle button state
   */
  updateToggleState() {
    if (this.themeToggle) {
      this.themeToggle.setAttribute('aria-pressed', String(this.theme === 'dark'));
      this.themeToggle.setAttribute('title', 
        this.theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'
      );
      console.log(`🎨 Theme toggle state updated: ${this.theme}`);
    }
  }

  /**
   * Get current theme
   */
  getCurrentTheme() {
    return this.theme;
  }
}

// Export for ES modules
export default SimpleThemeManager;
