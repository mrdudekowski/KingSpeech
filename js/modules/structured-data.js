/**
 * Structured Data for SEO
 * JSON-LD разметка для поисковых систем
 */

(function() {
  'use strict';

  // Основные данные о сайте
  const siteData = {
    name: 'KingSpeech',
    description: 'Онлайн-уроки английского языка: индивидуально и в мини‑группах',
    url: window.location.origin,
    logo: window.location.origin + '/assets/images/logo.png',
    telephone: '+7 (900) 123-45-67',
    email: 'hello@kingspeech.com'
  };

  // Создаем структурированные данные для организации
  function createOrganizationSchema() {
    return {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      "name": siteData.name,
      "description": siteData.description,
      "url": siteData.url,
      "logo": {
        "@type": "ImageObject",
        "url": siteData.logo
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": siteData.telephone,
        "email": siteData.email,
        "contactType": "customer service",
        "availableLanguage": ["Russian", "English"]
      },
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "RU"
      },
      "sameAs": [
        "https://t.me/kingspeech",
        "https://wa.me/79001234567"
      ]
    };
  }

  // Создаем структурированные данные для услуг
  function createServiceSchema() {
    return {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "Онлайн-уроки английского языка",
      "description": "Индивидуальные и групповые онлайн‑занятия английским языком с опытным преподавателем",
      "provider": {
        "@type": "EducationalOrganization",
        "name": siteData.name
      },
      "serviceType": "Language Learning",
      "audience": {
        "@type": "Audience",
        "audienceType": "Students of all levels"
      },
      "offers": {
        "@type": "Offer",
        "availability": "https://schema.org/InStock",
        "priceCurrency": "RUB",
        "description": "Бесплатное пробное занятие 30 минут"
      }
    };
  }

  // Создаем структурированные данные для веб-сайта
  function createWebSiteSchema() {
    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": siteData.name,
      "description": siteData.description,
      "url": siteData.url,
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": siteData.url + "/?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    };
  }

  // Создаем FAQ Schema
  function createFAQSchema() {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Как проходит первое занятие?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Первое занятие — это 30-минутное знакомство. Мы определим ваш уровень, обсудим цели и составим план обучения. Вы попробуете формат занятий и поймете, подходит ли вам мой подход."
          }
        },
        {
          "@type": "Question",
          "name": "Сколько нужно времени для результата?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Первые результаты видны уже через 2-3 недели регулярных занятий. Для уверенного общения на базовом уровне нужно 3-6 месяцев. Все зависит от вашей цели и частоты занятий."
          }
        },
        {
          "@type": "Question",
          "name": "Какие материалы используются на занятиях?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Я использую современные учебники, интерактивные приложения, видео и аудио материалы. Все материалы подбираются индивидуально под ваши интересы и цели."
          }
        },
        {
          "@type": "Question",
          "name": "Можно ли заниматься в группе?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Да! У нас есть мини-группы по 2-4 человека. Групповые занятия дешевле индивидуальных, но при этом сохраняют эффективность благодаря небольшому количеству участников."
          }
        }
      ]
    };
  }

  // Функция для добавления структурированных данных
  function addStructuredData(schema) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  // Инициализация структурированных данных
  function initStructuredData() {
    try {
      // Добавляем различные схемы
      addStructuredData(createOrganizationSchema());
      addStructuredData(createServiceSchema());
      addStructuredData(createWebSiteSchema());
      addStructuredData(createFAQSchema());
      
      console.log('📊 Структурированные данные добавлены');
    } catch (error) {
      console.error('❌ Ошибка добавления структурированных данных:', error);
    }
  }

  // Запускаем инициализацию
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStructuredData);
  } else {
    initStructuredData();
  }
})();
