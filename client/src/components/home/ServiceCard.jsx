import { Link } from 'react-router-dom';
import ServiceIcon from '../common/ServiceIcon';
import Reveal from '../common/Reveal';
import useTilt from '../../hooks/useTilt';
import { ArrowRightIcon } from '../common/Icon';

export default function ServiceCard({ service, index = 0 }) {
  const tilt = useTilt(4);

  return (
    <Reveal delay={index * 80}>
      <Link
        ref={tilt.ref}
        onMouseMove={tilt.onMouseMove}
        onMouseLeave={tilt.onMouseLeave}
        to={`/${service.slug}`}
        className="tilt group relative flex flex-col justify-between h-full rounded-2xl glass-card p-7 transition-all duration-300 hover:shadow-xl hover:shadow-signal/10 hover:border-signal/40 hover:-translate-y-1 overflow-hidden"
      >
        {/* Ambient hover glow inside card */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-signal/10 rounded-full blur-2xl group-hover:bg-signal/20 transition-all duration-500 pointer-events-none" />

        <div>
          <div className="flex items-center justify-between">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-signal/10 text-signal transition-all duration-300 group-hover:bg-signal group-hover:text-white group-hover:scale-110 shadow-xs">
              <ServiceIcon slug={service.slug} icon={service.icon} className="h-6 w-6" />
            </span>
            <span className="font-mono text-xs text-muted-dark group-hover:text-signal transition-colors">
              0{index + 1}
            </span>
          </div>

          <h3 className="mt-5 font-display text-xl font-semibold text-ink group-hover:text-signal transition-colors">
            {service.name}
          </h3>
          <p className="mt-2.5 text-sm leading-relaxed text-muted-light">
            {service.shortDescription || service.description}
          </p>
        </div>

        <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-signal">
          <span>Explore service</span>
          <span className="transition-transform duration-300 group-hover:translate-x-1">
            <ArrowRightIcon className="h-3 w-3" />
          </span>
        </div>
      </Link>
    </Reveal>
  );
}
