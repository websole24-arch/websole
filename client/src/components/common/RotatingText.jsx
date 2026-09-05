import { useEffect, useState } from 'react';

export default function RotatingText({
  words = [],
  interval = 2800,
  className = '',
  gradient = 'rainbow',
}) {
  const [index, setIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (words.length <= 1) return undefined;

    const timer = setInterval(() => {
      setIsFlipping(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % words.length);
        setIsFlipping(false);
      }, 350);
    }, interval);

    return () => clearInterval(timer);
  }, [words, interval]);

  const currentWord = words[index] || '';

  const gradientStyles = {
    rainbow: 'bg-gradient-to-r from-signal via-indigo-500 to-coral bg-clip-text text-transparent',
    signal: 'bg-gradient-to-r from-signal via-blue-500 to-indigo-600 bg-clip-text text-transparent',
    coral: 'bg-gradient-to-r from-coral via-orange-500 to-amber-500 bg-clip-text text-transparent',
    emerald: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-signal bg-clip-text text-transparent',
  };

  return (
    <span
      className={`inline-flex overflow-hidden py-1 align-bottom ${className}`}
      style={{ perspective: '600px' }}
    >
      <span
        className={`inline-block font-bold transition-all duration-350 transform ${
          gradientStyles[gradient] || gradientStyles.rainbow
        } ${
          isFlipping
            ? '-translate-y-full opacity-0 rotate-x-45 blur-xs'
            : 'translate-y-0 opacity-100 rotate-x-0 blur-0'
        }`}
        style={{ willChange: 'transform, opacity, filter' }}
      >
        {currentWord}
      </span>
    </span>
  );
}