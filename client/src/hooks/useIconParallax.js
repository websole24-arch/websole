import { useRef } from 'react';

// Imperative (no re-render) mouse-parallax: each icon gets its own --mx/--my
// CSS vars scaled by a per-icon "depth" so closer-feeling icons drift more
// than distant ones — real 3D-parallax, not a shared flat offset. Pairs
// with .parallax-icon in index.css. The continuous auto-float (.float-icon,
// same file) keeps running underneath regardless of the mouse, so icons are
// always in motion even before the pointer enters — same pattern as
// hooks/useTilt.js.
export default function useIconParallax(maxShift = 22) {
  const containerRef = useRef(null);
  const iconRefs = useRef([]);

  const setIconRef = (i) => (el) => {
    iconRefs.current[i] = el;
  };

  const onMouseMove = (e) => {
    const node = containerRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;

    iconRefs.current.forEach((el) => {
      if (!el) return;
      const depth = Number(el.dataset.depth || 1);
      el.style.setProperty('--mx', `${(px * maxShift * depth).toFixed(1)}px`);
      el.style.setProperty('--my', `${(py * maxShift * depth).toFixed(1)}px`);
    });
  };

  const onMouseLeave = () => {
    iconRefs.current.forEach((el) => {
      if (!el) return;
      el.style.setProperty('--mx', '0px');
      el.style.setProperty('--my', '0px');
    });
  };

  return { containerRef, setIconRef, onMouseMove, onMouseLeave };
}
