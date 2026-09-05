import useScrollReveal from '../../hooks/useScrollReveal';

export default function Reveal({
  as: Tag = 'div',
  delay = 0,
  duration = 600,
  variant = 'fade-up', // 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'scale-up' | 'blur-in' | '3d'
  threshold = 0.12,
  className = '',
  style = {},
  children,
  ...rest
}) {
  const [ref, isVisible] = useScrollReveal(threshold);

  const variantClasses = {
    'fade-up': 'reveal-fade-up',
    'fade-down': 'reveal-fade-down',
    'fade-left': 'reveal-fade-left',
    'fade-right': 'reveal-fade-right',
    'scale-up': 'reveal-scale-up',
    'blur-in': 'reveal-blur-in',
    '3d': 'reveal-3d',
  };

  const chosenClass = variantClasses[variant] || 'reveal-fade-up';

  return (
    <Tag
      ref={ref}
      className={`${chosenClass} ${isVisible ? 'is-visible' : ''} ${className}`}
      style={{
        transitionDelay: delay ? `${delay}ms` : undefined,
        transitionDuration: duration !== 600 ? `${duration}ms` : undefined,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

