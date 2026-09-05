import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLocationDot,
  faCircleCheck,
  faChevronRight,
  faArrowUpRightFromSquare,
  faArrowRight,
  faStar as faStarSolid,
  faCommentDots,
  faEnvelope,
  faPhone,
  faClock,
  faXmark,
  faCheck,
  faCopy,
  faTriangleExclamation,
  faCircleXmark,
  faShieldHalved,
  faImage,
  faCreditCard,
  faBolt,
  faBullseye,
  faMagnifyingGlass,
  faRocket,
  faEarthAmericas,
  faChartLine,
  faGem,
  faKey,
  faTag,
  faPalette,
  faRulerCombined,
  faFolderOpen,
  faArrowTrendUp,
  faArrowsRotate,
  faSackDollar,
  faChartColumn,
  faBriefcase,
} from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';

// Font Awesome-backed icon set. Every export keeps the same name and
// `className` prop shape as before, so call sites across the app didn't
// need to change.

export function PinIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faLocationDot} className={className} aria-hidden="true" />;
}

export function CheckIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faCircleCheck} className={className} aria-hidden="true" />;
}

export function ChevronIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faChevronRight} className={className} aria-hidden="true" />;
}

export function ArrowUpRightIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faArrowUpRightFromSquare} className={className} aria-hidden="true" />;
}

export function StarIcon({ className = 'h-4 w-4', filled = true }) {
  return (
    <FontAwesomeIcon
      icon={filled ? faStarSolid : faStarRegular}
      className={className}
      aria-hidden="true"
    />
  );
}

// Generic chat bubble — not the trademarked WhatsApp glyph, just a mark
// in the same visual family, so we're not reproducing branded IP.
export function ChatIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faCommentDots} className={className} aria-hidden="true" />;
}

export function MailIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faEnvelope} className={className} aria-hidden="true" />;
}

export function PhoneIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faPhone} className={className} aria-hidden="true" />;
}

export function ClockIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faClock} className={className} aria-hidden="true" />;
}

export function ArrowRightIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faArrowRight} className={className} aria-hidden="true" />;
}

export function CloseIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faXmark} className={className} aria-hidden="true" />;
}

export function CheckMarkIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faCheck} className={className} aria-hidden="true" />;
}

export function CopyIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faCopy} className={className} aria-hidden="true" />;
}

export function WarningIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faTriangleExclamation} className={className} aria-hidden="true" />;
}

export function XCircleIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faCircleXmark} className={className} aria-hidden="true" />;
}

export function ShieldIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faShieldHalved} className={className} aria-hidden="true" />;
}

export function ImageIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faImage} className={className} aria-hidden="true" />;
}

export function CreditCardIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faCreditCard} className={className} aria-hidden="true" />;
}

export function BoltIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faBolt} className={className} aria-hidden="true" />;
}

export function TargetIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faBullseye} className={className} aria-hidden="true" />;
}

export function SearchIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faMagnifyingGlass} className={className} aria-hidden="true" />;
}

export function RocketIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faRocket} className={className} aria-hidden="true" />;
}

export function GlobeIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faEarthAmericas} className={className} aria-hidden="true" />;
}

export function ChartLineIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faChartLine} className={className} aria-hidden="true" />;
}

export function GemIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faGem} className={className} aria-hidden="true" />;
}

export function KeyIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faKey} className={className} aria-hidden="true" />;
}

export function TagIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faTag} className={className} aria-hidden="true" />;
}

export function PaletteIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faPalette} className={className} aria-hidden="true" />;
}

export function RulerIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faRulerCombined} className={className} aria-hidden="true" />;
}

export function FolderIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faFolderOpen} className={className} aria-hidden="true" />;
}

export function TrendUpIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faArrowTrendUp} className={className} aria-hidden="true" />;
}

export function RefreshIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faArrowsRotate} className={className} aria-hidden="true" />;
}

export function MoneyIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faSackDollar} className={className} aria-hidden="true" />;
}

export function ChartBarIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faChartColumn} className={className} aria-hidden="true" />;
}

export function BriefcaseIcon({ className = 'h-4 w-4' }) {
  return <FontAwesomeIcon icon={faBriefcase} className={className} aria-hidden="true" />;
}
