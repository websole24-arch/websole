import { useRef } from 'react';

// Subtle pointer-following 3D tilt. Spread the returned handlers onto an
// element with the `.tilt` class (index.css reads the --rx/--ry custom
// properties this sets). No-ops harmlessly on touch devices — there's no
// mousemove to react to, so the element just never tilts.
export default function useTilt(maxDeg = 6) {
  const ref = useRef(null);

  const onMouseMove = (e) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    node.style.setProperty('--ry', `${(px * maxDeg * 2).toFixed(2)}deg`);
    node.style.setProperty('--rx', `${(-py * maxDeg * 2).toFixed(2)}deg`);
  };

  const onMouseLeave = () => {
    const node = ref.current;
    if (!node) return;
    node.style.setProperty('--rx', '0deg');
    node.style.setProperty('--ry', '0deg');
  };

  return { ref, onMouseMove, onMouseLeave };
}
