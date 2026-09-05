import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import ProjectCard from '../portfolio/ProjectCard';
import GradientText from '../common/GradientText';
import { ArrowRightIcon } from '../common/Icon';

export default function RecentProjects({ limit = 3 }) {
  const [projects, setProjects] = useState(null);

  useEffect(() => {
    client.get('/portfolio').then(({ data }) => setProjects(data.projects || [])).catch(() => setProjects([]));
  }, []);

  if (projects === null) return null;

  const shown = projects.slice(0, limit);

  return (
    <section className="relative mx-auto max-w-6xl px-4 sm:px-6 py-24">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill text-xs font-mono tracking-widest uppercase text-signal mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-signal" />
            Selected Work
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            Recent <GradientText variant="signal">Projects</GradientText>
          </h2>
          <p className="mt-3 max-w-xl text-muted-light">
            Explore a curated selection of websites, e-commerce stores, and brand identities we've shipped.
          </p>
        </div>

        {projects.length > 0 && (
          <Link
            to="/portfolio"
            className="group inline-flex items-center gap-2 rounded-xl glass-card px-5 py-2.5 text-sm font-semibold text-ink transition-all duration-200 hover:border-signal/40 hover:text-signal shadow-xs"
          >
            <span>View All Showcase</span>
            <span className="transition-transform duration-200 group-hover:translate-x-1">
              <ArrowRightIcon className="h-3 w-3" />
            </span>
          </Link>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-dashed border-ink/15 glass-card p-12 text-center text-sm text-muted-light">
          No showcase projects published yet — explore services or request a custom quotation.
        </div>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p, i) => (
            <ProjectCard key={p.id} project={p} delay={i * 80} />
          ))}
        </div>
      )}
    </section>
  );
}
