import { useEffect, useRef, useState } from 'react';

/**
 * Custom React Hook that triggers smooth CSS animations when an element scrolls into view.
 */
export function useScrollReveal(options = { threshold: 0.15, triggerOnce: true }) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (options.triggerOnce && domRef.current) {
          observer.unobserve(domRef.current);
        }
      } else if (!options.triggerOnce) {
        setIsVisible(false);
      }
    }, {
      threshold: options.threshold || 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    const currentElem = domRef.current;
    if (currentElem) {
      observer.observe(currentElem);
    }

    return () => {
      if (currentElem) {
        observer.unobserve(currentElem);
      }
    };
  }, [options.threshold, options.triggerOnce]);

  return [domRef, isVisible];
}
