import Reveal from '../common/Reveal';
import LazyImage from '../common/LazyImage';
import { ArrowUpRightIcon, ArrowRightIcon } from '../common/Icon';
import { faCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const MAX_VISIBLE_TAGS = 3;
const MAX_VISIBLE_FEATURES = 3;

export default function ProjectCard({ project: p, delay = 0 }) {
  const tags = p.techStack || [];
  const features = p.features || [];
  const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS);
  const extraTags = tags.length - visibleTags.length;
  const meta = [p.service, p.country].filter(Boolean).join(' · ') || 'Web Project';

  const Overlay = (
    <div
      className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t
                 from-[#12141C]/95 via-[#12141C]/80 to-transparent p-6 opacity-0 transition-opacity duration-300
                 ease-out group-hover:opacity-100 backdrop-blur-xs"
    >
      <p className="text-[11px] font-mono uppercase tracking-widest text-signal">Project Overview</p>
      <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-white/90">{p.description}</p>

      {features.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/50">Key Highlights</p>
          <ul className="mt-1 space-y-1">
            {features.slice(0, MAX_VISIBLE_FEATURES).map((f, idx) => (
              <li key={idx} className="flex items-center gap-1.5 text-xs text-white/85">
                <FontAwesomeIcon icon={faCircle} className="text-coral h-1.5 w-1.5" aria-hidden="true" />
                <span className="line-clamp-1">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {p.projectUrl && (
        <p className="mt-3 flex items-center gap-1 text-xs font-medium text-signal">
          <span>Click to view live site</span>
          <ArrowRightIcon className="h-3 w-3" />
        </p>
      )}
    </div>
  );

  return (
    <Reveal
      delay={delay}
      variant="fade-up"
      className="group relative flex flex-col justify-between overflow-hidden rounded-3xl glass-card transition-all duration-300 hover:shadow-2xl hover:shadow-signal/15 hover:border-signal/40 hover:-translate-y-1.5"
    >
      <div>
        <div className="relative aspect-video w-full overflow-hidden bg-slate-900/5">
          {p.imageUrl ? (
            <LazyImage
              src={p.imageUrl}
              alt={p.title}
              aspectRatio="aspect-video"
              className="transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-50/50 text-muted-dark aspect-video">
              <span className="font-mono text-xs">Preview Not Available</span>
            </div>
          )}

          {p.projectUrl ? (
            <a
              href={p.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Visit ${p.title}`}
              className="absolute inset-0 z-10"
            >
              {Overlay}
            </a>
          ) : (
            Overlay
          )}
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <span className="inline-block rounded-full bg-signal/10 px-2.5 py-0.5 text-[11px] font-medium text-signal">
              {p.service || 'Design & Dev'}
            </span>
            {p.country && (
              <span className="text-xs font-mono text-muted-dark">{p.country}</span>
            )}
          </div>

          <h3 className="mt-3 font-display text-lg font-bold text-ink group-hover:text-signal transition-colors">
            {p.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-light">
            {p.description}
          </p>

          {visibleTags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {visibleTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg border border-ink/10 dark:border-white/10 bg-white/80 dark:bg-white/5 px-2.5 py-1 text-xs font-medium text-ink/75 shadow-2xs"
                >
                  {tag}
                </span>
              ))}
              {extraTags > 0 && (
                <span className="rounded-lg border border-ink/10 dark:border-white/10 bg-white/80 dark:bg-white/5 px-2 py-1 text-xs font-medium text-muted-light">
                  +{extraTags}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {p.projectUrl && (
        <a
          href={p.projectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between border-t border-ink/10 bg-white/40 dark:bg-white/5 px-6 py-3.5 text-xs font-semibold text-ink transition-colors hover:bg-signal-soft hover:text-signal"
        >
          <span>Visit Live Website</span>
          <ArrowUpRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      )}
    </Reveal>
  );
}
