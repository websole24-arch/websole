import { useEffect, useRef, useState } from 'react';

export default function AnimatedText({
  text = '',
  as: Component = 'span',
  className = '',
  wordClassName = '',
  stagger = 35,
  delay = 0,
  variant = 'slide-up', // 'slide-up' | 'fade' | 'blur-in' | 'scale'
  once = true,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

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
          if (once) observer.disconnect();
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once]);

  const words = text.split(' ');

  const getWordStyle = (i) => {
    const totalDelay = delay + i * stagger;

    const baseTransition = {
      transitionProperty: 'opacity, transform, filter',
      transitionDuration: '600ms',
      transitionDimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      transitionDelay: `${totalDelay}ms`,
      willChange: 'transform, opacity, filter',
    };

    if (variant === 'blur-in') {
      return {
        ...baseTransition,
        opacity: isVisible ? 1 : 0,
        filter: isVisible ? 'blur(0px)' : 'blur(8px)',
        transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
      };
    }

    if (variant === 'scale') {
      return {
        ...baseTransition,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.85)',
      };
    }

    // Default 'slide-up'
    return {
      ...baseTransition,
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
    };
  };

  return (
    <Component ref={ref} className={`inline-flex flex-wrap gap-x-[0.28em] ${className}`}>
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className={`inline-block ${wordClassName}`}
          style={getWordStyle(i)}
        >
          {word}
        </span>
      ))}
    </Component>
  );
}