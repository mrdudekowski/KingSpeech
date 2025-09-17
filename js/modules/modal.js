/**
 * Modal Manager - Handles testimonial modal functionality
 * @class ModalManager
 */
class ModalManager {
  constructor() {
    this.modal = null;
    this.backdrop = null;
    this.dialog = null;
    this.closeBtn = null;
    this.prevBtn = null;
    this.nextBtn = null;
    // this.avatar removed
    this.nameEl = null;
    this.quote = null;
    
    // Получаем только оригинальные элементы (без клонов) для модалки
    this.originalTestimonials = [];
    this.currentIndex = -1;
    this.isOpen = false;
    
    this.init();
  }
  
  /**
   * Инициализация модального окна
   */
  init() {
    this.setupElements();
    if (this.modal) {
      this.bindEvents();
      this.setupTestimonialCards();
    }
  }
  
  /**
   * Настройка DOM элементов
   */
  setupElements() {
    this.modal = document.querySelector('#reviewModal');
    this.backdrop = this.modal?.querySelector('.modal__backdrop');
    this.dialog = this.modal?.querySelector('.modal__dialog');
    this.closeBtn = this.modal?.querySelector('.modal__close');
    this.prevBtn = this.modal?.querySelector('.modal__prev');
    this.nextBtn = this.modal?.querySelector('.modal__next');
    // this.avatar removed
    this.nameEl = this.modal?.querySelector('#reviewTitle');
    this.quote = this.modal?.querySelector('.modal__quote');
    
    // Получаем все оригинальные отзывы (без клонов)
    const allTestimonials = document.querySelectorAll('.testimonial');
    this.originalTestimonials = Array.from(allTestimonials);
  }
  
  /**
   * Привязка событий
   */
  bindEvents() {
    // Кнопки модалки
    this.closeBtn?.addEventListener('click', () => this.close());
    this.backdrop?.addEventListener('click', () => this.close());
    
    // Навигация в модалке
    this.prevBtn?.addEventListener('click', () => this.navigate(-1));
    this.nextBtn?.addEventListener('click', () => this.navigate(1));
    
    // Закрытие по Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }
  
  /**
   * Настройка карточек отзывов
   */
  setupTestimonialCards() {
    console.log('Setting up testimonial cards:', this.originalTestimonials.length);
    this.originalTestimonials.forEach((card, i) => {
      card.setAttribute('tabindex', '0');
      card.addEventListener('click', (e) => {
        console.log('Testimonial clicked:', i);
        e.preventDefault();
        this.openAt(i, card);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openAt(i, card);
        }
      });
    });
  }
  
  /**
   * Открытие модального окна
   */
  openAt(index, sourceEl) {
    console.log('Opening modal at index:', index);
    // Бесконечная навигация по оригинальным элементам
    this.currentIndex = (index + this.originalTestimonials.length) % this.originalTestimonials.length;
    
    const card = this.originalTestimonials[this.currentIndex];
    // const img removed (no avatars)
    const name = card.querySelector('.testimonial-name');
    const short = card.querySelector('.testimonial-quote');
    const full = short?.getAttribute('data-full') || short?.textContent || '';
    
    console.log('Modal data:', { name: name?.textContent, full });
    
    // Обновляем содержимое модалки
    if (this.nameEl && name) this.nameEl.textContent = name.textContent || '';
    if (this.quote) this.quote.textContent = full;
    
    // Показываем модалку
    this.modal.setAttribute('aria-hidden', 'false');
    this.isOpen = true;
    
    // Фокус на модалке
    this.dialog.focus();
    
    // Блокируем скролл body
    document.body.style.overflow = 'hidden';
    
    console.log('📖 Modal opened for testimonial:', this.currentIndex + 1);
  }
  
  /**
   * Закрытие модального окна
   */
  close() {
    this.modal.setAttribute('aria-hidden', 'true');
    this.isOpen = false;
    
    // Разблокируем скролл body
    document.body.style.overflow = '';
    
    console.log('📖 Modal closed');
  }
  
  /**
   * Навигация в модалке
   */
  navigate(direction) {
    const newIndex = (this.currentIndex + direction + this.originalTestimonials.length) % this.originalTestimonials.length;
    this.openAt(newIndex);
  }
}

export { ModalManager };
