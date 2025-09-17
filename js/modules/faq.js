/**
 * FAQ Module - Управление FAQ секцией
 * Автоматическое закрывание при открытии другого вопроса
 */

export class FAQManager {
  constructor() {
    this.faqElements = document.querySelectorAll('.faq');
    this.init();
  }

  init() {
    if (this.faqElements.length === 0) {
      console.log('❓ FAQ Manager: No FAQ elements found');
      return;
    }

    console.log(`❓ FAQ Manager: Found ${this.faqElements.length} FAQ elements`);

    this.faqElements.forEach((faq, index) => {
      const answer = faq.querySelector('.faq__answer');
      if (answer) {
        // Сохраняем оригинальную высоту контента
        this.setupFAQAnimation(faq, answer, index);
      }

      // Слушаем событие toggle на details элементе
      faq.addEventListener('toggle', (e) => {
        console.log(`❓ FAQ ${index + 1} toggled:`, faq.open ? 'opened' : 'closed');
        if (faq.open) {
          // Если FAQ открывается, закрываем все другие
          this.closeOtherFAQs(faq);
        }
      });
    });
  }

  setupFAQAnimation(faq, answer, index) {
    // Временно открываем FAQ для измерения высоты
    const wasOpen = faq.open;
    faq.open = true;
    
    // Получаем реальную высоту контента
    const contentHeight = answer.scrollHeight;
    
    // Возвращаем исходное состояние
    faq.open = wasOpen;
    
    // Устанавливаем CSS переменную с реальной высотой
    answer.style.setProperty('--content-height', `${contentHeight}px`);
    
    console.log(`❓ FAQ ${index + 1}: Content height = ${contentHeight}px`);
  }

  closeOtherFAQs(openFAQ) {
    // Закрываем все другие FAQ
    this.faqElements.forEach(faq => {
      if (faq !== openFAQ && faq.open) {
        faq.open = false;
      }
    });
  }
}

// Автоинициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
  new FAQManager();
});
