import { useEffect, useState } from 'react';

export default function TypewriterText({
  phrases = [],
  speed = 80,
  deleteSpeed = 45,
  pauseTime = 1800,
  className = '',
  cursorClassName = 'text-signal',
}) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!phrases || phrases.length === 0) return undefined;

    const currentPhrase = phrases[phraseIndex] || '';

    let timeout;
    if (!isDeleting && text === currentPhrase) {
      // Pause at end of phrase
      timeout = setTimeout(() => setIsDeleting(true), pauseTime);
    } else if (isDeleting && text === '') {
      // Move to next phrase
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    } else {
      const nextCharLength = isDeleting ? text.length - 1 : text.length + 1;
      timeout = setTimeout(() => {
        setText(currentPhrase.substring(0, nextCharLength));
      }, isDeleting ? deleteSpeed : speed);
    }

    return () => clearTimeout(timeout);
  }, [text, isDeleting, phraseIndex, phrases, speed, deleteSpeed, pauseTime]);

  return (
    <span className={`inline-flex items-center ${className}`}>
      <span>{text}</span>
      <span className={ml-0.5 inline-block font-mono font-normal animate-pulse ${cursorClassName}`}>|</span>
    </span>
  );
}