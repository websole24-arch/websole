import Reveal from '../common/Reveal';
import { ArrowUpRightIcon, ArrowRightIcon } from '../common/Icon';

const MAX_VISIBLE_TAGS = 3;
const MAX_VISIBLE_FEATURES = 3;

// Card image + hover overlay (About / Key features / click-to-visit hint),
// tech tags, and a Visit Project bar. Shared by the Portfolio page and the
// Home "Recent projects" section so both stay visually in sync.
export default function ProjectCard({ project: p, delay = 0 }) {
  const tags = p.techStack || [];
  const features = p.features || [];
  const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS);
  const extraTags = tags.length - visibleTags.length;
  const meta = [p.service, p.country].filter(Boolean).join(' · ') || 'Project';

  const Overlay = (
    <div
      className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t
                 from-[#12141C]/95 via-[#12141C]/70 to-[#12141C]/10 p-5 opacity-0 transition-opacity duration-300
                 ease-out group-hover:opacity-100"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-white/70">About</p>
      <p className="mt-1 line-clamp-3 text-sm text-white/90">{p.description}</p>

      {features.length > 0 && (
        <>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-white/70">Key features</p>
          <ul className="mt-1 space-y-1">
            {features.slice(0, MAX_VISIBLE_FEATURES).map((f, idx) => (
              <li key={idx} className="flex items-center gap-1.5 text-xs text-white/85">
                <ArrowRightIcon className="text-coral h-2.5 w-2.5" />
                <span className="line-clamp-1">{f}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {p.projectUrl && (
        <p className="mt-3 flex items-center gap-1 text-xs font-medium text-white/60">
          <span>Click image to visit</span>
          <ArrowRightIcon className="h-3 w-3" />
        </p>
      )}
    </div>
  );

  return (
    <Reveal delay={delay} className="group overflow-hidden rounded-2xl border border-ink/10 dark:border-white/10 bg-white/40 dark:bg-white/5">
      <div className="relative aspect-video w-full overflow-hidden">
        {p.imageUrl ? (
          <img
            src={p.imageUrl}
            alt={p.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-ink/10 to-ink/5" />
        )}
        {p.projectUrl ? (
          <a
            href={p.projectUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visit ${p.title}`}
            className="absolute inset-0"
          >
            {Overlay}
          </a>
        ) : (
          Overlay
        )}
      </div>

      <div className="p-5">
        <p className="text-xs text-muted-light">{meta}</p>
        <h3 className="mt-1 font-display text-lg font-medium">{p.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-muted-light">{p.description}</p>

        {visibleTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-ink/10 bg-ink/5 px-2.5 py-1 text-xs font-medium text-ink/80"
              >
                {tag}
              </span>
            ))}
            {extraTags > 0 && (
              <span className="rounded-full border border-ink/10 bg-ink/5 px-2.5 py-1 text-xs font-medium text-ink/80">
                +{extraTags}
              </span>
            )}
          </div>
        )}
      </div>

      {p.projectUrl && (
        <a
          href={p.projectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between border-t border-ink/10 px-5 py-3 text-sm
                     font-medium text-ink transition-colors hover:bg-ink/5"
        >
          Visit Project
          <ArrowUpRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      )}
    </Reveal>
  );
}
