import { useState, useEffect, useRef } from 'react';
import { ImageIcon } from './Icon';

export default function LazyImage({
  src,
  alt = '',
  className = '',
  wrapperClassName = '',
  aspectRatio = 'aspect-video',
  placeholderSrc,
  fallback = null,
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!imgRef.current) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px 0px' }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800/40 ${aspectRatio} ${wrapperClassName}`}
    >
      {/* Shimmer skeleton placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 z-0 animate-pulse bg-gradient-to-r from-slate-200/60 via-slate-100/80 to-slate-200/60 dark:from-slate-800/60 dark:via-slate-700/80 dark:to-slate-800/60 bg-[length:200%_100%]">
          <div className="flex h-full w-full items-center justify-center text-muted-dark/30">
            <span className="h-6 w-6 rounded-full border-2 border-signal/30 border-t-signal animate-spin" />
          </div>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800/60 p-4 text-center text-xs text-muted-light">
          <ImageIcon className="h-6 w-6 mb-1" />
          <span>Image preview unavailable</span>
        </div>
      )}

      {/* Actual Image */}
      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`h-full w-full object-cover transition-all duration-700 ease-out ${
            isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-sm'
          } ${className}`}
          {...props}
        />
      )}
    </div>
  );
}