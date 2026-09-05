import { useEffect, useState, useRef } from 'react';

export default function AnimatedCounter({
  target = 0,
  duration = 1200,
  prefix = '',
  suffix = '',
  className = '',
}) {
  const [count, setCount] = useState(0);
  const elementRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const numericTarget = typeof target === 'number' ? target : parseFloat(target) || 0;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let startTime = null;

          const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            // Ease out cubic
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);
            
            if (Number.isInteger(numericTarget)) {
              setCount(Math.floor(easeOutProgress * numericTarget));
            } else {
              setCount(parseFloat((easeOutProgress * numericTarget).toFixed(1)));
            }

            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              setCount(numericTarget);
            }
          };

          requestAnimationFrame(step);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={elementRef} className={`tabular-nums ${className}`}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}
