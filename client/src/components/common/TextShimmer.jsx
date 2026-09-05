export default function TextShimmer({
  children,
  as: Component = 'span',
  className = '',
  shimmerColor = 'rgba(255, 255, 255, 0.8)',
}) {
  return (
    <Component
      className={`inline-block bg-[length:250%_100%] bg-clip-text text-transparent animate-text-shimmer bg-gradient-to-r from-ink via-signal to-ink dark:from-paper dark:via-signal-soft dark:to-paper ${className}`}
    >
      {children}
    </Component>
  );
}