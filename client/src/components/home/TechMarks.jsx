import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReact, faNodeJs, faJs, faHtml5, faTypescript, faTailwindCss } from '@fortawesome/free-brands-svg-icons';
import { faFire, faCaretUp } from '@fortawesome/free-solid-svg-icons';

// Decorative badges for the Home "tech stack" section. The six named
// technologies use their real Font Awesome brand marks; FlameMark and
// TriangleMark use generic Font Awesome solid shapes (no specific brand
// to match, so no brand glyph applies).

export function ReactMark() {
  return <FontAwesomeIcon icon={faReact} className="h-full w-full" style={{ color: '#61DAFB' }} aria-hidden="true" />;
}

export function TailwindMark() {
  return <FontAwesomeIcon icon={faTailwindCss} className="h-full w-full" style={{ color: '#38BDF8' }} aria-hidden="true" />;
}

export function FlameMark() {
  return <FontAwesomeIcon icon={faFire} className="h-full w-full" style={{ color: '#F5820D' }} aria-hidden="true" />;
}

export function JsMark() {
  return <FontAwesomeIcon icon={faJs} className="h-full w-full" style={{ color: '#F0DB4F' }} aria-hidden="true" />;
}

export function TsMark() {
  return <FontAwesomeIcon icon={faTypescript} className="h-full w-full" style={{ color: '#3178C6' }} aria-hidden="true" />;
}

export function NodeMark() {
  return <FontAwesomeIcon icon={faNodeJs} className="h-full w-full" style={{ color: '#3C873A' }} aria-hidden="true" />;
}

export function Html5Mark() {
  return <FontAwesomeIcon icon={faHtml5} className="h-full w-full" style={{ color: '#E34F26' }} aria-hidden="true" />;
}

export function TriangleMark() {
  return <FontAwesomeIcon icon={faCaretUp} className="h-full w-full text-white/70" aria-hidden="true" />;
}
