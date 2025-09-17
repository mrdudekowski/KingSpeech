/**
 * Animation Manager - Handles scroll-triggered animations and effects
 * @class AnimationManager
 */
class AnimationManager {
  constructor() {
    this.animatedElements = [];
    this.intersectionObserver = null;
    this.scrollObserver = null;
    this.animationQueue = [];
    this.isProcessingQueue = false;
    
    this.animationClasses = {
      fadeIn: 'animate-fade-in',
      slideUp: 'animate-slide-up',
      slideLeft: 'animate-slide-left',
      slideRight: 'animate-slide-right',
      scaleIn: 'animate-scale-in',
      rotateIn: 'animate-rotate-in'
    };
    
    this.init();
  }

  /**
   * Initialize animation manager
   */
  init() {
    this.setupIntersectionObserver();
    this.setupScrollObserver();
    this.findAnimatedElements();
    this.setupResizeObserver();
  }

  /**
   * Setup intersection observer for scroll-triggered animations
   */
  setupIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: '0px 0px -10% 0px', // Start animation when element is 10% from bottom
      threshold: 0.1
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.triggerAnimation(entry.target);
        }
      });
    }, options);
  }

  /**
   * Setup scroll observer for scroll-based effects
   */
  setupScrollObserver() {
    let ticking = false;
    
    const updateScrollEffects = () => {
      this.updateParallaxEffects();
      this.updateScrollProgress();
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollEffects);
        ticking = true;
      }
    }, { passive: true });
  }

  /**
   * Setup resize observer for responsive animations
   */
  setupResizeObserver() {
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver((entries) => {
        entries.forEach(entry => {
          this.handleResize(entry);
        });
      });

      // Observe animated elements for size changes
      this.animatedElements.forEach(element => {
        resizeObserver.observe(element);
      });
    }
  }

  /**
   * Find elements with animation attributes
   */
  findAnimatedElements() {
    // Elements with data-animate attribute
    const animateElements = document.querySelectorAll('[data-animate]');
    
    // Elements with animation classes
    const classElements = document.querySelectorAll(
      Object.values(this.animationClasses).map(cls => `.${cls}`).join(', ')
    );
    
    // Elements with data-scroll attributes
    const scrollElements = document.querySelectorAll('[data-scroll]');
    
    // Combine all elements
    this.animatedElements = [
      ...animateElements,
      ...classElements,
      ...scrollElements
    ];

    // Observe elements for animations
    this.animatedElements.forEach(element => {
      if (this.intersectionObserver) {
        this.intersectionObserver.observe(element);
      }
    });
  }

  /**
   * Trigger animation for element
   */
  triggerAnimation(element) {
    const animationType = element.getAttribute('data-animate') || 'fadeInUp';
    const delay = parseInt(element.getAttribute('data-delay')) || 0;
    const duration = parseInt(element.getAttribute('data-duration')) || 600;
    
    // Add to animation queue
    this.animationQueue.push({
      element,
      animationType,
      delay,
      duration
    });

    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      this.processAnimationQueue();
    }
  }

  /**
   * Process animation queue
   */
  async processAnimationQueue() {
    if (this.isProcessingQueue || this.animationQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.animationQueue.length > 0) {
      const animation = this.animationQueue.shift();
      
      try {
        await this.executeAnimation(animation);
      } catch (error) {
        console.error('Animation execution error:', error);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Execute individual animation
   */
  async executeAnimation(animation) {
    const { element, animationType, delay, duration } = animation;

    // Wait for delay
    if (delay > 0) {
      await this.wait(delay);
    }

    // Check if element is still in DOM
    if (!document.contains(element)) {
      return;
    }

    // Apply animation
    this.applyAnimation(element, animationType, duration);

    // Mark as animated
    element.setAttribute('data-animated', 'true');
    
    // Remove from intersection observer
    if (this.intersectionObserver) {
      this.intersectionObserver.unobserve(element);
    }
  }

  /**
   * Apply animation to element
   */
  applyAnimation(element, animationType, duration) {
    // Set custom duration if specified
    if (duration) {
      element.style.setProperty('--animation-duration', `${duration}ms`);
    }

    // Add animation class
    const animationClass = this.animationClasses[animationType] || animationType;
    element.classList.add(animationClass);

    // Add animated state
    element.classList.add('animated');

    // Trigger reflow for animation to work
    element.offsetHeight;

    // Remove animation class after completion
    setTimeout(() => {
      if (document.contains(element)) {
        element.classList.remove(animationClass);
        element.classList.add('animation-complete');
      }
    }, duration);
  }

  /**
   * Update parallax effects
   */
  updateParallaxEffects() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    const scrollY = window.pageYOffset;
    
    parallaxElements.forEach(element => {
      const speed = parseFloat(element.getAttribute('data-parallax')) || 0.5;
      const yPos = -(scrollY * speed);
      
      element.style.transform = `translateY(${yPos}px)`;
    });
  }

  /**
   * Update scroll progress indicators
   */
  updateScrollProgress() {
    const progressElements = document.querySelectorAll('[data-scroll-progress]');
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    
    progressElements.forEach(element => {
      const type = element.getAttribute('data-scroll-progress');
      
      switch (type) {
        case 'width':
          element.style.width = `${scrollPercent}%`;
          break;
        case 'height':
          element.style.height = `${scrollPercent}%`;
          break;
        case 'transform':
          element.style.transform = `scaleX(${scrollPercent / 100})`;
          break;
        case 'opacity':
          element.style.opacity = scrollPercent / 100;
          break;
      }
    });
  }

  /**
   * Handle resize events
   */
  handleResize(entry) {
    const element = entry.target;
    
    // Recalculate animation positions if needed
    if (element.hasAttribute('data-animate')) {
      this.recalculateAnimationPosition(element);
    }
  }

  /**
   * Recalculate animation position
   */
  recalculateAnimationPosition(element) {
    // Reset animation state
    element.classList.remove('animated', 'animation-complete');
    element.removeAttribute('data-animated');
    
    // Re-observe element
    if (this.intersectionObserver) {
      this.intersectionObserver.observe(element);
    }
  }

  /**
   * Add animation to element programmatically
   */
  addAnimation(element, animationType, options = {}) {
    const {
      delay = 0,
      duration = 600,
      callback = null
    } = options;

    // Add animation attributes
    element.setAttribute('data-animate', animationType);
    element.setAttribute('data-delay', delay);
    element.setAttribute('data-duration', duration);

    // Add to animated elements
    if (!this.animatedElements.includes(element)) {
      this.animatedElements.push(element);
      
      // Observe element
      if (this.intersectionObserver) {
        this.intersectionObserver.observe(element);
      }
    }

    // Execute callback if provided
    if (callback && typeof callback === 'function') {
      setTimeout(callback, delay + duration);
    }
  }

  /**
   * Remove animation from element
   */
  removeAnimation(element) {
    // Remove animation attributes
    element.removeAttribute('data-animate');
    element.removeAttribute('data-delay');
    element.removeAttribute('data-duration');
    element.removeAttribute('data-animated');

    // Remove animation classes
    element.classList.remove(
      'animated',
      'animation-complete',
      ...Object.values(this.animationClasses)
    );

    // Remove from animated elements
    const index = this.animatedElements.indexOf(element);
    if (index > -1) {
      this.animatedElements.splice(index, 1);
    }

    // Unobserve element
    if (this.intersectionObserver) {
      this.intersectionObserver.unobserve(element);
    }
  }

  /**
   * Pause all animations
   */
  pauseAnimations() {
    document.body.style.setProperty('--animation-play-state', 'paused');
  }

  /**
   * Resume all animations
   */
  resumeAnimations() {
    document.body.style.setProperty('--animation-play-state', 'running');
  }

  /**
   * Check if element is animated
   */
  isAnimated(element) {
    return element.hasAttribute('data-animated') || 
           element.classList.contains('animated');
  }

  /**
   * Get animation state
   */
  getAnimationState(element) {
    return {
      isAnimated: this.isAnimated(element),
      hasAnimation: element.hasAttribute('data-animate'),
      animationType: element.getAttribute('data-animate') || 'fadeInUp',
      delay: parseInt(element.getAttribute('data-delay')) || 0,
      duration: parseInt(element.getAttribute('data-duration')) || 600
    };
  }

  /**
   * Utility function to wait
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Refresh animations (useful after DOM changes)
   */
  refresh() {
    // Clear existing elements
    this.animatedElements.forEach(element => {
      if (this.intersectionObserver) {
        this.intersectionObserver.unobserve(element);
      }
    });

    // Clear arrays
    this.animatedElements = [];
    this.animationQueue = [];

    // Reset processing flag
    this.isProcessingQueue = false;

    // Re-find and setup elements
    this.findAnimatedElements();
  }

  /**
   * Destroy animation manager
   */
  destroy() {
    // Disconnect observers
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    // Clear animation queue
    this.animationQueue = [];
    this.isProcessingQueue = false;

    // Remove all animations
    this.animatedElements.forEach(element => {
      this.removeAnimation(element);
    });

    // Clear arrays
    this.animatedElements = [];

    // Remove scroll event listener
    window.removeEventListener('scroll', this.updateScrollEffects);
  }
}

// Export for ES modules
export default AnimationManager;
