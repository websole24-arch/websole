import Reveal from './Reveal';
import GradientText from './GradientText';

export default function PageHeader({
  badge,
  title,
  gradientWord,
  titleSuffix = '',
  description,
  children,
  align = 'center',
  className = '',
  variant = 'fade-up',
}) {
  const isCenter = align === 'center';

  return (
    <div className={`relative pt-12 pb-8 sm:pt-16 sm:pb-12 ${isCenter ? 'text-center' : 'text-left'} ${className}`}>
      {/* Subtle ambient light glow behind header */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-32 bg-signal/5 blur-3xl rounded-full pointer-events-none animate-float-slow"
        aria-hidden="true"
      />

      <Reveal variant={variant}>
        {badge && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill text-xs font-mono tracking-widest uppercase text-signal mb-4 shadow-sm animate-pulse-soft">
            <span className="w-1.5 h-1.5 rounded-full bg-signal animate-pulse" />
            {badge}
          </div>
        )}

        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-ink">
          {title}{' '}
          {gradientWord && <GradientText variant="signal">{gradientWord}</GradientText>}
          {titleSuffix && ` ${titleSuffix}`}
        </h1>

        {description && (
          <p className={`mt-4 text-base sm:text-lg text-muted-light max-w-2xl ${isCenter ? 'mx-auto' : ''} leading-relaxed`}>
            {description}
          </p>
        )}

        {children && <div className="mt-6">{children}</div>}
      </Reveal>
    </div>
  );
}
