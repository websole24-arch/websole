import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTableCellsLarge,
  faFolderOpen,
  faUserGroup,
  faScrewdriverWrench,
  faBox,
  faTag,
  faEnvelope,
  faStar,
  faImage,
  faWrench,
  faBars,
  faXmark,
  faArrowsRotate,
  faCircleExclamation,
  faRightFromBracket,
  faGear,
} from '@fortawesome/free-solid-svg-icons';

// Small name-keyed icon set for the admin dashboard (sidebar nav, stat
// cards, error/retry states). Kept separate from components/common/Icon.jsx,
// which is a different (named-export) API already used by the public site.
const ICONS = {
  overview: faTableCellsLarge,
  projects: faFolderOpen,
  customers: faUserGroup,
  services: faScrewdriverWrench,
  packages: faBox,
  pricing: faTag,
  inquiries: faEnvelope,
  reviews: faStar,
  portfolio: faImage,
  tools: faWrench,
  menu: faBars,
  close: faXmark,
  retry: faArrowsRotate,
  alert: faCircleExclamation,
  logout: faRightFromBracket,
  settings: faGear,
};

export default function AdminIcon({ name, className = 'h-5 w-5' }) {
  const icon = ICONS[name];
  if (!icon) return null;
  return <FontAwesomeIcon icon={icon} className={className} aria-hidden="true" />;
}
