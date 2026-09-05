import { useEffect, useState } from 'react';
import client from '../api/client';
import Reveal from '../components/common/Reveal';
import ProjectCard from '../components/portfolio/ProjectCard';

export default function Portfolio() {
  const [projects, setProjects] = useState(null);

  useEffect(() => {
    client.get('/portfolio').then(({ data }) => setProjects(data.projects || [])).catch(() => setProjects([]));
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-light">All projects</p>
        <h1 className="mt-2 font-display text-3xl">
          Crafted <span className="text-signal">Projects</span>
        </h1>
        <p className="mt-4 max-w-xl text-muted-light">Real projects we've delivered.</p>
      </Reveal>

      {projects === null && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-video animate-pulse rounded-2xl border border-ink/10 bg-ink/5" />
          ))}
        </div>
      )}

      {projects?.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-ink/20 p-10 text-center text-muted-light">
          Nothing published yet — check back soon.
        </div>
      )}

      {projects?.length > 0 && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <ProjectCard key={p.id} project={p} delay={(i % 6) * 60} />
          ))}
        </div>
      )}
    </section>
  );
}
