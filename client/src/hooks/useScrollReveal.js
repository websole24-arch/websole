import { useEffect, useRef, useState } from 'react';

// Marks the element visible the first time it scrolls into view — pairs
// with the `.reveal-3d` CSS class in index.css. Falls back to revealing
// immediately if IntersectionObserver isn't available, so content is never
// permanently stuck at opacity:0 (e.g. very old browsers, some crawlers).
//
// Visibility is tracked as React state (not a raw classList.add) so it
// survives re-renders. A raw classList.add sits outside React's className
// diffing — the next time the parent re-renders with ANY different
// className string (e.g. an accordion toggling its open/closed border
// style), React overwrites the whole class attribute and silently wipes
// the imperatively-added class, snapping the element back to opacity:0
// with no way to recover since the observer already unsubscribed.
export default function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isVisible];
}
