import { StarIcon } from './Icon';

export default function StarRating({ value, onChange, size = 'h-4 w-4' }) {
  const stars = [1, 2, 3, 4, 5];

  if (!onChange) {
    return (
      <div className="flex gap-1" aria-label={`${value} out of 5 stars`}>
        {stars.map((n) => (
          <StarIcon
            key={n}
            filled={n <= value}
            className={`${size} transition-colors ${
              n <= value ? 'text-amber-400 drop-shadow-[0_1px_4px_rgba(251,191,36,0.4)]' : 'text-ink/15'
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {stars.map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onClick={() => onChange(n)}
          className="transition-transform duration-150 hover:scale-125 focus:outline-none"
        >
          <StarIcon
            filled={n <= value}
            className={`${size} transition-colors ${
              n <= value ? 'text-amber-400 drop-shadow-[0_1px_4px_rgba(251,191,36,0.5)]' : 'text-ink/20'
            }`}
          />
        </button>
      ))}
    </div>
  );
}
