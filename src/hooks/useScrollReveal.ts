import { useEffect, useRef } from 'react';

/**
 * Custom hook to detect when elements enter the viewport and trigger
 * one-time editorial scroll animations using IntersectionObserver.
 * 
 * Respects prefers-reduced-motion and gracefully unobserves elements
 * once revealed to prevent repetitive distracting animations.
 */
export function useScrollReveal(dependencies: any[] = []) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const root = containerRef.current || document;
    const elements = root.querySelectorAll(
      '.reveal-fade-up, .reveal-fade-side, .reveal-image-curtain, .reveal-card, .reveal-scale-in'
    );

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      elements.forEach((el) => {
        el.classList.add('is-revealed');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            // Unobserve so animation runs only once
            obs.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -60px 0px', // trigger slightly before it hits mid-screen
        threshold: 0.1,
      }
    );

    elements.forEach((el) => {
      // If element is already in viewport on load, reveal immediately
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 50 && rect.bottom > 0) {
        el.classList.add('is-revealed');
      } else {
        observer.observe(el);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, dependencies);

  return containerRef;
}
