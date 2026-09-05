// Inline validation message shown under a form field. Renders nothing
// when there's no error, so it's safe to always mount.
export default function FieldError({ children }) {
  if (!children) return null;
  return <p className="mt-1 text-xs text-red-700">{children}</p>;
}

// Shared class builder so every form's inputs get the same red-border
// treatment on an invalid, touched field.
export const fieldClass = (hasError) =>
  `w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-1 ${
    hasError
      ? 'border-red-400 focus:ring-red-400'
      : 'border-ink/15 focus:border-signal focus:ring-signal'
  }`;
