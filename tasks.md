# tasks.md (Source of Truth) - COMPLETED ✅

- [x] Create responsive landing scaffold
- [x] Implement Hero, About, Method, Testimonials, FAQ, Contact form, Footer
- [x] Add smooth navigation and AOS‑style animations
- [x] Implement form validation (name/email/phone)
- [x] Prepare SEO tags and OG/Twitter
- [x] Provide deploy instructions for GitHub Pages
- [x] Create Memory Bank files
- [x] Optional: convert images to `.webp` and update sources

## Optimization Roadmap

- [x] PR1: Performance quick wins
  - [x] Add lazy/decoding/fetchpriority to images; add width/height where safe
  - [x] Preload hero image; add canonical and theme-color
  - [x] Remove global transitions; add motion tokens and scoped transitions
  - [x] Passive listeners and rAF throttle for scroll; limit contrast scanner (remove MutationObserver)
  - [x] Audit unused heavy assets (Vector Icons.svg, landingscreenshot.jpeg) and remove if unused
- [x] PR2: UI/UX + Animations
  - [x] Testimonials: add prev/next buttons + keyboard
  - [x] content-visibility for sections below the fold
  - [x] Mobile menu: outside click + basic focus trap
  - [x] Header tweaks (lighter backdrop/fallbacks)
  - [x] Parallax for hero (respect prefers-reduced-motion)
  - [x] FAQ: smooth open without CLS
- [x] PR3: Accessibility + SEO
  - [x] FAQ JSON-LD (moved to external file)
  - [x] CSP: remove 'unsafe-inline' for scripts; external preinit
  - [x] CSP: remove 'unsafe-inline' for styles in meta

## Assets Audit
- [x] Check and remove if unused: `Vector Icons.svg` (~1MB) - Retained per request
- [x] Check and remove if unused: `landingscreenshot.jpeg` (~5.8MB) - Retained per request
- [x] Consider converting `photo_2023-02-05_21-22-56.jpg` to webp + update `<picture>` fallback
- [x] Add `srcset/sizes` for hero/about images 