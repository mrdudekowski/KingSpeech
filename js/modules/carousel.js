/**
 * Carousel Manager - Handles testimonials carousel functionality
 * @class CarouselManager
 */
class CarouselManager {
  constructor() {
    this.carousel = null;
    this.track = null;
    this.slides = [];
    this.indicators = [];
    this.prevButton = null;
    this.nextButton = null;
    
    this.currentSlide = 0;
    this.totalSlides = 0;
    this.isTransitioning = false;
    this.autoplayInterval = null;
    this.autoplayDelay = 5000; // 5 seconds
    
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.minSwipeDistance = 50;
    
    this.init();
  }

  /**
   * Initialize carousel manager
   */
  init() {
    this.setupElements();
    if (this.carousel) {
      this.setupEventListeners();
      this.goToSlide(0); // Сначала устанавливаем первый слайд
      this.setupAutoplay();
      this.updateCarousel();
    }
  }

  /**
   * Setup DOM elements
   */
  setupElements() {
    this.carousel = document.querySelector('[data-carousel]');
    this.track = this.carousel?.querySelector('[data-carousel-track]');
    this.slides = Array.from(this.carousel?.querySelectorAll('[data-carousel-slide]') || []);
    this.indicators = Array.from(this.carousel?.querySelectorAll('[data-carousel-indicator]') || []);
    this.prevButton = this.carousel?.querySelector('[data-carousel-prev]');
    this.nextButton = this.carousel?.querySelector('[data-carousel-next]');
    
    this.totalSlides = this.slides.length;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Navigation buttons
    if (this.prevButton) {
      this.prevButton.addEventListener('click', () => this.previousSlide());
    }
    
    if (this.nextButton) {
      this.nextButton.addEventListener('click', () => this.nextSlide());
    }

    // Indicators
    this.indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => this.goToSlide(index));
    });

    // Touch events for mobile
    this.setupTouchEvents();

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (this.carousel && this.isElementInViewport(this.carousel)) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.previousSlide();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.nextSlide();
        }
      }
    });

    // Pause autoplay on hover
    if (this.carousel) {
      this.carousel.addEventListener('mouseenter', () => this.pauseAutoplay());
      this.carousel.addEventListener('mouseleave', () => this.resumeAutoplay());
    }

    // Visibility change (pause when tab is hidden)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAutoplay();
      } else {
        this.resumeAutoplay();
      }
    });
  }

  /**
   * Setup touch events for mobile
   */
  setupTouchEvents() {
    if (!this.carousel) return;

    this.carousel.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    this.carousel.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    }, { passive: true });
  }

  /**
   * Handle swipe gestures
   */
  handleSwipe() {
    const swipeDistance = this.touchStartX - this.touchEndX;
    
    if (Math.abs(swipeDistance) > this.minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swipe left - next slide
        this.nextSlide();
      } else {
        // Swipe right - previous slide
        this.previousSlide();
      }
    }
  }

  /**
   * Setup autoplay functionality
   */
  setupAutoplay() {
    if (this.totalSlides <= 1) return;
    
    this.autoplayInterval = setInterval(() => {
      this.nextSlide();
    }, this.autoplayDelay);
  }

  /**
   * Pause autoplay
   */
  pauseAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
  }

  /**
   * Resume autoplay
   */
  resumeAutoplay() {
    if (this.totalSlides > 1 && !this.autoplayInterval) {
      this.setupAutoplay();
    }
  }

  /**
   * Go to specific slide
   */
  goToSlide(index) {
    if (this.isTransitioning || index < 0 || index >= this.totalSlides) {
      return;
    }

    this.isTransitioning = true;
    
    // Update current slide
    const previousSlide = this.currentSlide;
    this.currentSlide = index;

    // Update track position
    this.updateTrackPosition();

    // Update indicators
    this.updateIndicators();

    // Update navigation buttons
    this.updateNavigationButtons();

    // Handle slide transition
    this.handleSlideTransition(previousSlide, index);

    // Reset transition flag after animation
    setTimeout(() => {
      this.isTransitioning = false;
    }, 300);
  }

  /**
   * Update track position
   */
  updateTrackPosition() {
    // Remove all active and prev classes from all slides
    this.slides.forEach(slide => {
      slide.classList.remove('active', 'prev');
    });
    
    // Add active class to current slide
    if (this.slides[this.currentSlide]) {
      this.slides[this.currentSlide].classList.add('active');
    }
  }

  /**
   * Update indicators
   */
  updateIndicators() {
    this.indicators.forEach((indicator, index) => {
      if (index === this.currentSlide) {
        indicator.classList.add('carousel-indicator--active');
        indicator.setAttribute('aria-current', 'true');
      } else {
        indicator.classList.remove('carousel-indicator--active');
        indicator.removeAttribute('aria-current');
      }
    });
  }

  /**
   * Update navigation buttons
   */
  updateNavigationButtons() {
    if (this.prevButton) {
      this.prevButton.disabled = false; // Бесконечная карусель - кнопки всегда активны
      this.prevButton.setAttribute('aria-label', 'Предыдущий слайд');
    }

    if (this.nextButton) {
      this.nextButton.disabled = false; // Бесконечная карусель - кнопки всегда активны
      this.nextButton.setAttribute('aria-label', 'Следующий слайд');
    }
  }

  /**
   * Handle slide transition
   */
  handleSlideTransition(previousIndex, newIndex) {
    // Remove active class from previous slide
    if (this.slides[previousIndex]) {
      this.slides[previousIndex].classList.remove('active');
    }

    // Add active class to new slide
    if (this.slides[newIndex]) {
      this.slides[newIndex].classList.add('active');
    }

    // Announce slide change to screen readers
    this.announceSlideChange(newIndex);
  }

  /**
   * Announce slide change to screen readers
   */
  announceSlideChange(slideIndex) {
    const slide = this.slides[slideIndex];
    if (!slide) return;

    const slideText = slide.querySelector('[data-carousel-text]')?.textContent || '';
    const slideNumber = slideIndex + 1;
    
    this.announceToScreenReader(
      `Слайд ${slideNumber} из ${this.totalSlides}. ${slideText}`
    );
  }

  /**
   * Announce to screen readers
   */
  announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  /**
   * Go to next slide
   */
  nextSlide() {
    const nextIndex = (this.currentSlide + 1) % this.totalSlides;
    this.goToSlide(nextIndex);
  }

  /**
   * Go to previous slide
   */
  previousSlide() {
    const prevIndex = this.currentSlide === 0 ? this.totalSlides - 1 : this.currentSlide - 1;
    this.goToSlide(prevIndex);
  }

  /**
   * Update carousel on resize
   */
  updateCarousel() {
    this.updateTrackPosition();
    this.updateIndicators();
    this.updateNavigationButtons();
  }

  /**
   * Check if element is in viewport
   */
  isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Get current slide index
   */
  getCurrentSlide() {
    return this.currentSlide;
  }

  /**
   * Get total number of slides
   */
  getTotalSlides() {
    return this.totalSlides;
  }

  /**
   * Check if carousel is transitioning
   */
  isTransitioning() {
    return this.isTransitioning;
  }

  /**
   * Set autoplay delay
   */
  setAutoplayDelay(delay) {
    this.autoplayDelay = delay;
    if (this.autoplayInterval) {
      this.pauseAutoplay();
      this.resumeAutoplay();
    }
  }

  /**
   * Destroy carousel manager
   */
  destroy() {
    this.pauseAutoplay();
    
    // Remove event listeners
    if (this.prevButton) {
      this.prevButton.removeEventListener('click', this.previousSlide);
    }
    
    if (this.nextButton) {
      this.nextButton.removeEventListener('click', this.nextSlide);
    }

    this.indicators.forEach(indicator => {
      indicator.removeEventListener('click', this.goToSlide);
    });

    if (this.carousel) {
      this.carousel.removeEventListener('mouseenter', this.pauseAutoplay);
      this.carousel.removeEventListener('mouseleave', this.resumeAutoplay);
      this.carousel.removeEventListener('touchstart', this.handleTouchStart);
      this.carousel.removeEventListener('touchend', this.handleTouchEnd);
    }

    document.removeEventListener('keydown', this.handleKeydown);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }
}

// Export for ES modules
export default CarouselManager;
