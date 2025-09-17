/**
 * Form Manager - Handles form validation and submission
 * @class FormManager
 */
import GASIntegration from './gas-integration.js';

class FormManager {
  constructor() {
    this.forms = [];
    this.submitButtons = [];
    this.gasIntegration = new GASIntegration();
    this.validationRules = {
      required: (value) => value.trim().length > 0,
      email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      phone: (value) => /^[\+]?[0-9\s\-\(\)]{10,}$/.test(value),
      minLength: (value, min) => value.length >= min,
      maxLength: (value, max) => value.length <= max
    };
    
    this.init();
  }

  /**
   * Initialize form manager
   */
  init() {
    this.setupForms();
    this.setupEventListeners();
    this.setupProgressBar();
  }

  /**
   * Setup forms
   */
  setupForms() {
    this.forms = Array.from(document.querySelectorAll('form[data-form]'));
    this.submitButtons = Array.from(document.querySelectorAll('[data-form-submit]'));
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Form submission
    this.forms.forEach(form => {
      form.addEventListener('submit', (e) => this.handleFormSubmit(e));
      
      // Real-time validation + live CTA state
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        input.addEventListener('blur', () => this.validateField(input));
        input.addEventListener('input', () => {
          this.clearFieldError(input);
          this.updateCTAState(form);
        });
      });
      
      // Initial CTA state
      this.updateCTAState(form);
    });

    // Submit button clicks
    this.submitButtons.forEach(button => {
      button.addEventListener('click', (e) => this.handleSubmitClick(e));
    });
  }

  /**
   * Handle form submission
   */
  async handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.currentTarget;
    const formId = form.getAttribute('data-form');
    
    // Live CTA state update
    this.updateCTAState(form);

    // Validate only required fields for minimal form
    if (!this.validateForm(form)) {
      this.focusFirstError(form);
      return false;
    }

    // Show loading state
    this.setFormLoading(form, true);

    try {
      // Collect form data
      const formData = this.collectFormData(form);
      
      // Submit form
      const result = await this.submitForm(formData, formId);
      
      if (result.success) {
        this.handleFormSuccess(form, result);
      } else {
        this.handleFormError(form, result.error);
      }
      
    } catch (error) {
      console.error('Form submission error:', error);
      this.handleFormError(form, 'Произошла ошибка при отправке формы. Попробуйте еще раз.');
    } finally {
      this.setFormLoading(form, false);
    }
  }

  /**
   * Handle submit button click
   */
  handleSubmitClick(e) {
    const button = e.currentTarget;
    const form = button.closest('form');
    
    if (form) {
      form.requestSubmit();
    }
  }

  /**
   * Validate entire form
   */
  validateForm(form) {
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    let isValid = true;

    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });

    return isValid;
  }

  /**
   * Enable/disable CTA based on required fields
   */
  updateCTAState(form) {
    const submitButton = form.querySelector('[data-form-submit]');
    if (!submitButton) return;

    const requiredInputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    const allFilled = Array.from(requiredInputs).every(inp => inp.value.trim() !== '');

    submitButton.disabled = !allFilled;
    submitButton.style.opacity = allFilled ? '1' : '0.6';
    submitButton.style.cursor = allFilled ? 'pointer' : 'not-allowed';
  }

  /**
   * Validate individual field
   */
  validateField(field) {
    const value = field.value;
    const rules = this.getFieldRules(field);
    let isValid = true;
    let errorMessage = '';

    // Check each rule
    for (const [ruleName, ruleValue] of Object.entries(rules)) {
      if (ruleName === 'required' && ruleValue && !this.validationRules.required(value)) {
        isValid = false;
        errorMessage = 'Это поле обязательно для заполнения';
        break;
      } else if (ruleName === 'email' && ruleValue && !this.validationRules.email(value)) {
        isValid = false;
        errorMessage = 'Введите корректный email адрес';
        break;
      } else if (ruleName === 'phone' && ruleValue && !this.validationRules.phone(value)) {
        isValid = false;
        errorMessage = 'Введите корректный номер телефона';
        break;
      } else if (ruleName === 'minLength' && value && !this.validationRules.minLength(value, ruleValue)) {
        isValid = false;
        errorMessage = `Минимальная длина: ${ruleValue} символов`;
        break;
      } else if (ruleName === 'maxLength' && value && !this.validationRules.maxLength(value, ruleValue)) {
        isValid = false;
        errorMessage = `Максимальная длина: ${ruleValue} символов`;
        break;
      }
    }

    // Update field state
    this.updateFieldState(field, isValid, errorMessage);
    
    return isValid;
  }

  /**
   * Get validation rules for field
   */
  getFieldRules(field) {
    const rules = {};
    
    // Required
    if (field.hasAttribute('required')) {
      rules.required = true;
    }
    
    // Email
    if (field.type === 'email') {
      rules.email = true;
    }
    
    // Phone
    if (field.type === 'tel') {
      rules.phone = true;
    }
    
    // Min length
    if (field.hasAttribute('minlength')) {
      rules.minLength = parseInt(field.getAttribute('minlength'));
    }
    
    // Max length
    if (field.hasAttribute('maxlength')) {
      rules.maxLength = parseInt(field.getAttribute('maxlength'));
    }
    
    // Custom rules from data attributes
    if (field.hasAttribute('data-validate')) {
      const customRules = field.getAttribute('data-validate').split(',');
      customRules.forEach(rule => {
        const [ruleName, ruleValue] = rule.trim().split(':');
        rules[ruleName] = ruleValue || true;
      });
    }
    
    return rules;
  }

  /**
   * Update field state
   */
  updateFieldState(field, isValid, errorMessage) {
    const fieldContainer = field.closest('.form-field') || field.parentElement;
    
    if (!fieldContainer) return;
    
    // Remove existing error
    const existingError = fieldContainer.querySelector('.form-error');
    if (existingError) {
      existingError.remove();
    }
    
    // Update field classes
    field.classList.remove('form-input--error', 'form-input--valid');
    
    if (!isValid && errorMessage) {
      field.classList.add('form-input--error');
      this.showFieldError(fieldContainer, errorMessage);
    } else if (isValid && field.value.trim()) {
      field.classList.add('form-input--valid');
    }
  }

  /**
   * Show field error
   */
  showFieldError(container, message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'form-error';
    errorElement.setAttribute('role', 'alert');
    errorElement.textContent = message;
    
    container.appendChild(errorElement);
  }

  /**
   * Clear field error
   */
  clearFieldError(field) {
    const fieldContainer = field.closest('.form-field') || field.parentElement;
    if (!fieldContainer) return;
    
    const errorElement = fieldContainer.querySelector('.form-error');
    if (errorElement) {
      errorElement.remove();
    }
    
    field.classList.remove('form-input--error');
  }

  /**
   * Focus first error field
   */
  focusFirstError(form) {
    const firstError = form.querySelector('.form-input--error');
    if (firstError) {
      firstError.focus();
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /**
   * Collect form data
   */
  collectFormData(form) {
    const formData = new FormData(form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }
    
    // Add form metadata
    data.formId = form.getAttribute('data-form');
    data.timestamp = new Date().toISOString();
    data.userAgent = navigator.userAgent;
    
    return data;
  }

  /**
   * Submit form data
   */
  async submitForm(formData, formId) {
    try {
      // Отправляем через GAS Integration
      const result = await this.gasIntegration.submitLead(formData);
      
      if (result.success) {
        return {
          success: true,
          message: 'Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.',
          data: result.data
        };
      } else {
        return {
          success: false,
          error: result.error || 'Ошибка при отправке заявки'
        };
      }
    } catch (error) {
      console.error('GAS submission error:', error);
      return {
        success: false,
        error: 'Ошибка сети. Попробуйте еще раз.'
      };
    }
  }

  /**
   * Handle form success
   */
  handleFormSuccess(form, result) {
    // Show success message
    this.showFormMessage(form, result.message, 'success');
    
    // Reset form
    form.reset();
    
    // Clear validation states
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.classList.remove('form-input--error', 'form-input--valid');
    });
    
    // Track success (analytics)
    this.trackFormSubmission(form, 'success');
  }

  /**
   * Handle form error
   */
  handleFormError(form, error) {
    this.showFormMessage(form, error, 'error');
    
    // Track error (analytics)
    this.trackFormSubmission(form, 'error', error);
  }

  /**
   * Show form message
   */
  showFormMessage(form, message, type) {
    // Remove existing messages
    const existingMessage = form.querySelector('.form-message');
    if (existingMessage) {
      existingMessage.remove();
    }
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = `form-message form-message--${type}`;
    messageElement.setAttribute('role', 'alert');
    messageElement.textContent = message;
    
    // Insert before form
    form.parentNode.insertBefore(messageElement, form);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.remove();
      }
    }, 5000);
  }

  /**
   * Set form loading state
   */
  setFormLoading(form, isLoading) {
    const submitButton = form.querySelector('[data-form-submit]');
    if (!submitButton) return;
    
    if (isLoading) {
      submitButton.disabled = true;
      submitButton.setAttribute('aria-busy', 'true');
      submitButton.innerHTML = '<span class="loading-spinner"></span> Отправка...';
    } else {
      submitButton.disabled = false;
      submitButton.removeAttribute('aria-busy');
      submitButton.innerHTML = submitButton.getAttribute('data-original-text') || 'Отправить';
    }
  }

  /**
   * Track form submission
   */
  trackFormSubmission(form, status, error = null) {
    const formId = form.getAttribute('data-form');
    
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', 'form_submit', {
        form_id: formId,
        status: status,
        error_message: error
      });
    }
    
    // Yandex Metrica
    if (typeof ym !== 'undefined') {
      ym('reachGoal', 'form_submit', {
        form_id: formId,
        status: status,
        error_message: error
      });
    }
    
    // Console log for development
    console.log(`Form submission tracked: ${formId} - ${status}`, { error });
  }

  /**
   * Get form validation state
   */
  getFormValidationState(form) {
    const inputs = form.querySelectorAll('input, textarea, select');
    const state = {
      isValid: true,
      errors: [],
      validFields: 0,
      totalFields: inputs.length
    };
    
    inputs.forEach(input => {
      if (input.classList.contains('form-input--error')) {
        state.isValid = false;
        const errorElement = input.parentElement?.querySelector('.form-error');
        if (errorElement) {
          state.errors.push({
            field: input.name || input.id,
            message: errorElement.textContent
          });
        }
      } else if (input.classList.contains('form-input--valid')) {
        state.validFields++;
      }
    });
    
    return state;
  }

  /**
   * Reset form validation
   */
  resetFormValidation(form) {
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.classList.remove('form-input--error', 'form-input--valid');
      this.clearFieldError(input);
    });
    
    // Remove form messages
    const messages = form.parentNode?.querySelectorAll('.form-message');
    messages?.forEach(message => message.remove());
  }

  /**
   * Destroy form manager
   */
  destroy() {
    // Remove event listeners
    this.forms.forEach(form => {
      form.removeEventListener('submit', this.handleFormSubmit);
      
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        input.removeEventListener('blur', this.validateField);
        input.removeEventListener('input', this.clearFieldError);
      });
    });

    this.submitButtons.forEach(button => {
      button.removeEventListener('click', this.handleSubmitClick);
    });
  }

  /**
   * Setup progress bar for minimal form
   */
  setupProgressBar() {
    const minimalForm = document.querySelector('.form--minimal');
    if (!minimalForm) return;

    const progressFill = minimalForm.querySelector('.progress__fill');
    const progressText = minimalForm.querySelector('.progress__text');
    const inputs = minimalForm.querySelectorAll('input[required]');

    if (!progressFill || !progressText || !inputs.length) return;

    const updateProgress = () => {
      let filledCount = 0;
      inputs.forEach(input => {
        if (input.value.trim() !== '') {
          filledCount++;
        }
      });

      const progress = (filledCount / inputs.length) * 100;
      progressFill.style.width = `${progress}%`;

      if (progress === 100) {
        progressText.textContent = 'Готово! Можете отправлять заявку';
        progressFill.style.background = 'linear-gradient(90deg, #22C55E, #16A34A)';
      } else if (progress > 0) {
        progressText.textContent = `Заполнено ${filledCount} из ${inputs.length} полей`;
        progressFill.style.background = 'linear-gradient(90deg, var(--accent), var(--accent-600))';
      } else {
        progressText.textContent = 'Заполните форму для записи';
        progressFill.style.background = 'linear-gradient(90deg, var(--accent), var(--accent-600))';
      }
    };

    inputs.forEach(input => {
      input.addEventListener('input', updateProgress);
      input.addEventListener('blur', updateProgress);
    });

    // Initial update
    updateProgress();
  }
}

// Export for ES modules
export default FormManager;
