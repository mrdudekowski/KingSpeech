/**
 * Navigation Manager - Handles mobile menu and smooth scrolling
 * @class NavigationManager
 */
class NavigationManager {
  constructor() {
    this.mobileMenu = null;
    this.mobileToggle = null;
    this.navLinks = [];
    this.sections = [];
    this.currentSection = null;
    this.isMobileMenuOpen = false;
    this.scrollTimeout = null;
    
    this.init();
  }

  /**
   * Initialize navigation manager
   */
  init() {
    this.setupElements();
    this.setupEventListeners();
    this.setupIntersectionObserver();
    this.updateActiveNavigation();
  }

  /**
   * Setup DOM elements
   */
  setupElements() {
    this.mobileMenu = document.querySelector('[data-mobile-menu]');
    this.mobileToggle = document.querySelector('[data-mobile-toggle]');
    this.navLinks = document.querySelectorAll('[data-nav-link]');
    this.sections = document.querySelectorAll('section[id]');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Mobile menu toggle
    if (this.mobileToggle) {
      this.mobileToggle.addEventListener('click', () => this.toggleMobileMenu());
      this.mobileToggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggleMobileMenu();
        }
      });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isMobileMenuOpen && 
          !this.mobileMenu?.contains(e.target) && 
          !this.mobileToggle?.contains(e.target)) {
        this.closeMobileMenu();
      }
    });

    // Close mobile menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isMobileMenuOpen) {
        this.closeMobileMenu();
      }
    });

    // Smooth scrolling for navigation links
    this.navLinks.forEach(link => {
      link.addEventListener('click', (e) => this.handleNavClick(e));
    });

    // Handle scroll events for active navigation
    window.addEventListener('scroll', () => {
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
      }
      this.scrollTimeout = setTimeout(() => {
        this.updateActiveNavigation();
      }, 100);
    });

    // Handle resize events
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && this.isMobileMenuOpen) {
        this.closeMobileMenu();
      }
    });
  }

  /**
   * Setup intersection observer for sections
   */
  setupIntersectionObserver() {
    if (!this.sections.length) return;

    const options = {
      root: null,
      rootMargin: '-20% 0px -20% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.currentSection = entry.target.id;
          this.updateActiveNavigation();
        }
      });
    }, options);

    this.sections.forEach(section => {
      observer.observe(section);
    });
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu() {
    if (this.isMobileMenuOpen) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }

  /**
   * Open mobile menu
   */
  openMobileMenu() {
    if (!this.mobileMenu || !this.mobileToggle) return;

    this.isMobileMenuOpen = true;
    this.mobileMenu.classList.add('mobile-menu--open');
    this.mobileToggle.setAttribute('aria-expanded', 'true');
    this.mobileToggle.setAttribute('aria-label', 'Закрыть меню');

    // Focus management
    const firstNavLink = this.mobileMenu.querySelector('[data-nav-link]');
    if (firstNavLink) {
      firstNavLink.focus();
    }

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Announce to screen readers
    this.announceToScreenReader('Меню открыто');
  }

  /**
   * Close mobile menu
   */
  closeMobileMenu() {
    if (!this.mobileMenu || !this.mobileToggle) return;

    this.isMobileMenuOpen = false;
    this.mobileMenu.classList.remove('mobile-menu--open');
    this.mobileToggle.setAttribute('aria-expanded', 'false');
    this.mobileToggle.setAttribute('aria-label', 'Открыть меню');

    // Restore body scroll
    document.body.style.overflow = '';

    // Return focus to toggle button
    this.mobileToggle.focus();

    // Announce to screen readers
    this.announceToScreenReader('Меню закрыто');
  }

  /**
   * Handle navigation link clicks
   */
  handleNavClick(e) {
    const link = e.currentTarget;
    const targetId = link.getAttribute('href')?.substring(1);
    
    if (!targetId) return;

    e.preventDefault();
    
    // Close mobile menu if open
    if (this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }

    // Smooth scroll to target
    this.smoothScrollTo(targetId);
  }

  /**
   * Smooth scroll to element
   */
  smoothScrollTo(targetId) {
    const targetElement = document.getElementById(targetId);
    if (!targetElement) return;

    const headerHeight = this.getHeaderHeight();
    const targetPosition = targetElement.offsetTop - headerHeight - 20;

    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });

    // Update URL hash without scroll jump
    history.replaceState(null, null, `#${targetId}`);
  }

  /**
   * Get header height for scroll offset
   */
  getHeaderHeight() {
    const header = document.querySelector('header');
    return header ? header.offsetHeight : 0;
  }

  /**
   * Update active navigation state
   */
  updateActiveNavigation() {
    if (!this.currentSection) return;

    this.navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === `#${this.currentSection}`) {
        link.classList.add('nav-link--active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('nav-link--active');
        link.removeAttribute('aria-current');
      }
    });
  }

  /**
   * Announce changes to screen readers
   */
  announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  /**
   * Check if mobile menu is open
   */
  isMenuOpen() {
    return this.isMobileMenuOpen;
  }

  /**
   * Get current active section
   */
  getCurrentSection() {
    return this.currentSection;
  }

  /**
   * Programmatically open mobile menu
   */
  openMenu() {
    if (!this.isMobileMenuOpen) {
      this.openMobileMenu();
    }
  }

  /**
   * Programmatically close mobile menu
   */
  closeMenu() {
    if (this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }
  }

  /**
   * Destroy navigation manager
   */
  destroy() {
    // Remove event listeners
    if (this.mobileToggle) {
      this.mobileToggle.removeEventListener('click', this.toggleMobileMenu);
      this.mobileToggle.removeEventListener('keydown', this.handleKeydown);
    }

    this.navLinks.forEach(link => {
      link.removeEventListener('click', this.handleNavClick);
    });

    // Clear timeouts
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    // Close mobile menu if open
    if (this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }
  }
}

// Export for ES modules
export default NavigationManager;
