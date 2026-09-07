import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCode, faPenRuler, faPen, faList, faMobileScreen, faChartLine,
  faCamera, faBullhorn, faPalette, faLaptopCode, faServer,
  faShieldHalved, faRocket, faGear, faMagnifyingGlass, faVideo,
} from '@fortawesome/free-solid-svg-icons';
import { faWordpress, faWix } from '@fortawesome/free-brands-svg-icons';

// Keyed by the service's own `icon` field (set from the admin panel — see
// ServicesTab.jsx) so any service, including ones added after this file was
// last touched, can render a real icon without a code change. `label` is
// only used to build the admin dropdown below.
const ICONS_BY_KEY = {
  code: { icon: faCode, label: 'Code' },
  'laptop-code': { icon: faLaptopCode, label: 'Web development' },
  'pen-ruler': { icon: faPenRuler, label: 'Design / UI-UX' },
  palette: { icon: faPalette, label: 'Palette' },
  pen: { icon: faPen, label: 'Pen / graphic design' },
  video: { icon: faVideo, label: 'Video / motion' },
  wordpress: { icon: faWordpress, label: 'WordPress' },
  wix: { icon: faWix, label: 'Wix' },
  mobile: { icon: faMobileScreen, label: 'Mobile' },
  chart: { icon: faChartLine, label: 'Analytics / SEO' },
  search: { icon: faMagnifyingGlass, label: 'SEO / search' },
  camera: { icon: faCamera, label: 'Photography' },
  megaphone: { icon: faBullhorn, label: 'Marketing' },
  server: { icon: faServer, label: 'Backend / infrastructure' },
  shield: { icon: faShieldHalved, label: 'Security' },
  rocket: { icon: faRocket, label: 'Launch / growth' },
  gear: { icon: faGear, label: 'Automation / ops' },
  list: { icon: faList, label: 'General (default)' },
};

// The dropdown offered in the admin Services form (ServicesTab.jsx) — a
// deliberately smaller, de-duplicated set so the picker isn't cluttered.
export const ICON_OPTIONS = [
  'code', 'laptop-code', 'pen-ruler', 'palette', 'pen', 'video', 'wordpress',
  'wix', 'mobile', 'chart', 'search', 'camera', 'megaphone', 'server',
  'shield', 'rocket', 'gear', 'list',
].map((key) => ({ value: key, label: ICONS_BY_KEY[key].label }));

// Legacy fallback for the original seeded services, in case their `icon`
// column is empty (pre-dates the admin-editable icon field) — keeps their
// current icon rather than dropping everything to the generic fallback.
const ICON_BY_LEGACY_SLUG = {
  'custom-website-development': faCode,
  'ui-ux-design': faPenRuler,
  'wordpress-development': faWordpress,
  'wix-development': faWix,
  'graphic-design': faPen,
};

const FALLBACK = faList;

export default function ServiceIcon({ slug, icon, className = 'h-5 w-5' }) {
  const resolved = ICONS_BY_KEY[icon]?.icon || ICON_BY_LEGACY_SLUG[slug] || FALLBACK;
  return (
    <FontAwesomeIcon
      icon={resolved}
      className={className}
      aria-hidden="true"
    />
  );
}
