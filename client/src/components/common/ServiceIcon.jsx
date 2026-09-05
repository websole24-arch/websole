import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCode, faPenRuler, faPen, faList } from '@fortawesome/free-solid-svg-icons';
import { faWordpress, faWix } from '@fortawesome/free-brands-svg-icons';

const ICONS = {
  'custom-website-development': faCode,
  'ui-ux-design': faPenRuler,
  'wordpress-development': faWordpress,
  'wix-development': faWix,
  'graphic-design': faPen,
};

const FALLBACK = faList;

export default function ServiceIcon({ slug, className = 'h-5 w-5' }) {
  return (
    <FontAwesomeIcon
      icon={ICONS[slug] || FALLBACK}
      className={className}
      aria-hidden="true"
    />
  );
}
