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

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = containerRef.current || document;

    const applyReveals = () => {
      const elements = root.querySelectorAll<HTMLElement>(
        '.reveal-fade-up, .reveal-fade-side, .reveal-image-curtain, .reveal-card, .reveal-scale-in'
      );

      elements.forEach((el: HTMLElement) => {
        // If element was previously revealed or marked in dataset, preserve is-revealed class across React re-renders
        if (el.dataset.revealed === 'true') {
          el.classList.add('is-revealed');
          return;
        }

        if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
          el.dataset.revealed = 'true';
          el.classList.add('is-revealed');
          return;
        }

        // Reveal immediately if element is in or near viewport on mount/update
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight + 150 && rect.bottom > -150) {
          el.dataset.revealed = 'true';
          el.classList.add('is-revealed');
        }
      });

      return elements;
    };

    const elements = applyReveals();

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement;
          if (entry.isIntersecting || target.dataset.revealed === 'true') {
            target.dataset.revealed = 'true';
            target.classList.add('is-revealed');
            obs.unobserve(target);
          }
        });
      },
      {
        root: null,
        rootMargin: '100px 0px 100px 0px',
        threshold: 0.01,
      }
    );

    elements.forEach((el: HTMLElement) => {
      if (el.dataset.revealed !== 'true') {
        observer.observe(el);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, dependencies);

  return containerRef;
}
