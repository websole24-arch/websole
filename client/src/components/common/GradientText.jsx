export default function GradientText({
  children,
  className = '',
  variant = 'signal',
  as: Component = 'span',
}) {
  const variantStyles = {
    signal: 'bg-gradient-to-r from-signal via-indigo-500 to-coral bg-clip-text text-transparent',
    rainbow: 'bg-gradient-to-r from-blue-600 via-indigo-500 to-coral bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-shift',
    coral: 'bg-gradient-to-r from-coral via-orange-400 to-amber-500 bg-clip-text text-transparent',
    dark: 'bg-gradient-to-r from-ink via-slate-700 to-signal bg-clip-text text-transparent',
  };

  return (
    <Component className={`inline-block ${variantStyles[variant] || variantStyles.signal} ${className}`}>
      {children}
    </Component>
  );
}
