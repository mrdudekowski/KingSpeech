/**
 * KingSpeech Landing Page - Main Application
 * @file main.js
 * @description Main application entry point and module management
 */

// Import modules
import ThemeManager from './modules/theme.js';
import NavigationManager from './modules/navigation.js';
import CarouselManager from './modules/carousel.js';
import FormManager from './modules/forms.js';
import AnimationManager from './modules/animations.js';
import { FAQManager } from './modules/faq.js';
import { ModalManager } from './modules/modal.js';

/**
 * Main application class
 */
class KingSpeechApp {
  constructor() {
    this.modules = {};
    this.isInitialized = false;
    this.performanceMetrics = {};
    
    // Bind methods
    this.init = this.init.bind(this);
    this.destroy = this.destroy.bind(this);
    this.handleError = this.handleError.bind(this);
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this.init);
    } else {
      this.init();
    }
  }

  /**
   * Initialize application
   */
  async init() {
    try {
      console.log('🚀 Initializing KingSpeech Landing Page...');
      
      // Setup error handling
      this.setupErrorHandling();
      
      // Initialize modules
      await this.initializeModules();
      
      // Setup global event handlers
      this.setupGlobalEventHandlers();
      
      // Setup performance monitoring
      this.setupPerformanceMonitoring();
      
      // Setup analytics
      this.setupAnalytics();
      
      // Mark as initialized
      this.isInitialized = true;
      
      console.log('✅ KingSpeech Landing Page initialized successfully');
      
      // Dispatch ready event
      this.dispatchEvent('app:ready', { app: this });
      
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      this.handleError(error);
    }
  }

  /**
   * Initialize all modules
   */
  async initializeModules() {
    try {
      // Theme Manager
      this.modules.theme = new ThemeManager();
      console.log('🎨 Theme Manager initialized');
      
      // Navigation Manager
      this.modules.navigation = new NavigationManager();
      console.log('🧭 Navigation Manager initialized');
      
      // Carousel Manager
      this.modules.carousel = new CarouselManager();
      console.log('🎠 Carousel Manager initialized');
      
      // Form Manager
      this.modules.forms = new FormManager();
      console.log('📝 Form Manager initialized');
      
      // Animation Manager
      this.modules.animations = new AnimationManager();
      console.log('✨ Animation Manager initialized');
      
      // FAQ Manager
      this.modules.faq = new FAQManager();
      console.log('❓ FAQ Manager initialized');
      
      // Modal Manager
      this.modules.modal = new ModalManager();
      console.log('📖 Modal Manager initialized');
      
    } catch (error) {
      console.error('❌ Module initialization error:', error);
      throw error;
    }
  }

  /**
   * Setup global event handlers
   */
  setupGlobalEventHandlers() {
    // Window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.handleResize();
      }, 250);
    });

    // Page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handlePageHidden();
      } else {
        this.handlePageVisible();
      }
    });

    // Before unload
    window.addEventListener('beforeunload', () => {
      this.handleBeforeUnload();
    });

    // Online/offline status
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message));
    });

    // Unhandled promise rejection
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new Error(event.reason));
    });
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    // Core Web Vitals
    if ('PerformanceObserver' in window) {
      try {
        // LCP (Largest Contentful Paint)
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.performanceMetrics.lcp = lastEntry.startTime;
          console.log('📊 LCP:', this.performanceMetrics.lcp);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // FID (First Input Delay)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            this.performanceMetrics.fid = entry.processingStart - entry.startTime;
            console.log('📊 FID:', this.performanceMetrics.fid);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // CLS (Cumulative Layout Shift)
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.performanceMetrics.cls = clsValue;
          console.log('📊 CLS:', this.performanceMetrics.cls);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

      } catch (error) {
        console.warn('⚠️ Performance monitoring setup failed:', error);
      }
    }
  }

  /**
   * Setup analytics
   */
  setupAnalytics() {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href
      });
    }

    // Yandex Metrica
    if (typeof ym !== 'undefined') {
      ym('hit', window.location.href, {
        title: document.title
      });
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    // Update modules that need resize handling
    if (this.modules.carousel) {
      this.modules.carousel.updateCarousel();
    }
    
    if (this.modules.animations) {
      this.modules.animations.refresh();
    }

    // Dispatch resize event
    this.dispatchEvent('app:resize', { width: window.innerWidth, height: window.innerHeight });
  }

  /**
   * Handle page hidden
   */
  handlePageHidden() {
    // Pause animations and autoplay
    if (this.modules.animations) {
      this.modules.animations.pauseAnimations();
    }
    
    if (this.modules.carousel) {
      this.modules.carousel.pauseAutoplay();
    }

    // Track page visibility
    this.trackEvent('page_hidden');
  }

  /**
   * Handle page visible
   */
  handlePageVisible() {
    // Resume animations and autoplay
    if (this.modules.animations) {
      this.modules.animations.resumeAnimations();
    }
    
    if (this.modules.carousel) {
      this.modules.carousel.resumeAutoplay();
    }

    // Track page visibility
    this.trackEvent('page_visible');
  }

  /**
   * Handle before unload
   */
  handleBeforeUnload() {
    // Save any pending data
    if (this.modules.theme) {
      // Theme is auto-saved, no action needed
    }
  }

  /**
   * Handle online status
   */
  handleOnline() {
    console.log('🌐 Application is online');
    this.dispatchEvent('app:online');
  }

  /**
   * Handle offline status
   */
  handleOffline() {
    console.log('📴 Application is offline');
    this.dispatchEvent('app:offline');
  }

  /**
   * Handle errors
   */
  handleError(error) {
    console.error('❌ Application error:', error);
    
    // Track error
    this.trackEvent('error', {
      message: error.message,
      stack: error.stack,
      url: window.location.href
    });

    // Dispatch error event
    this.dispatchEvent('app:error', { error });
  }

  /**
   * Track custom events
   */
  trackEvent(eventName, parameters = {}) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, parameters);
    }

    // Yandex Metrica
    if (typeof ym !== 'undefined') {
      ym('reachGoal', eventName, parameters);
    }

    // Console log for development
    console.log(`📊 Event tracked: ${eventName}`, parameters);
  }

  /**
   * Dispatch custom events
   */
  dispatchEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      detail: { ...detail, timestamp: Date.now() },
      bubbles: true
    });
    
    document.dispatchEvent(event);
  }

  /**
   * Get module instance
   */
  getModule(moduleName) {
    return this.modules[moduleName];
  }

  /**
   * Get all modules
   */
  getAllModules() {
    return { ...this.modules };
  }

  /**
   * Get application state
   */
  getState() {
    return {
      isInitialized: this.isInitialized,
      modules: Object.keys(this.modules),
      performance: this.performanceMetrics,
      timestamp: Date.now()
    };
  }

  /**
   * Refresh application
   */
  refresh() {
    console.log('🔄 Refreshing application...');
    
    // Refresh modules that support it
    if (this.modules.animations) {
      this.modules.animations.refresh();
    }
    
    if (this.modules.carousel) {
      this.modules.carousel.updateCarousel();
    }
    
    console.log('✅ Application refreshed');
  }

  /**
   * Destroy application
   */
  destroy() {
    console.log('🗑️ Destroying application...');
    
    // Destroy all modules
    Object.values(this.modules).forEach(module => {
      if (module && typeof module.destroy === 'function') {
        try {
          module.destroy();
        } catch (error) {
          console.warn('⚠️ Module destruction error:', error);
        }
      }
    });

    // Clear modules
    this.modules = {};
    this.isInitialized = false;

    // Remove event listeners
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);

    console.log('✅ Application destroyed');
  }
}

// Create and export application instance
const app = new KingSpeechApp();

// Make app globally available for debugging
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  window.KingSpeechApp = app;
  console.log('🔧 KingSpeechApp is available globally for debugging');
}

// Export for ES modules
export default app;
