import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import PageHeader from '../components/common/PageHeader';
import Reveal from '../components/common/Reveal';
import ProjectCard from '../components/portfolio/ProjectCard';
import WhatsAppButton from '../components/common/WhatsAppButton';
import { BriefcaseIcon } from '../components/common/Icon';

export default function Portfolio() {
  const [projects, setProjects] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    client
      .get('/portfolio')
      .then(({ data }) => setProjects(data.projects || []))
      .catch(() => setProjects([]));
  }, []);

  const categories = ['All', 'Custom Web', 'UI/UX Design', 'WordPress', 'Wix'];

  const filteredProjects = projects
    ? projects.filter((p) => {
        if (activeFilter === 'All') return true;
        if (activeFilter === 'Custom Web') return p.service?.toLowerCase().includes('custom') || p.service?.toLowerCase().includes('web');
        if (activeFilter === 'UI/UX Design') return p.service?.toLowerCase().includes('ui') || p.service?.toLowerCase().includes('ux');
        if (activeFilter === 'WordPress') return p.service?.toLowerCase().includes('wordpress');
        if (activeFilter === 'Wix') return p.service?.toLowerCase().includes('wix');
        return true;
      })
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-24">
      <PageHeader
        badge="Showcase"
        title="Curated work delivered with"
        gradientWord="precision"
        description="A selection of custom web applications, e-commerce stores, design systems, and platforms crafted for global businesses."
      />

      {/* Filter Tabs */}
      {projects && projects.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveFilter(cat)}
              className={`rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 ${
                activeFilter === cat
                  ? 'bg-signal text-white shadow-md shadow-signal/25 scale-105'
                  : 'glass-card text-ink/80 hover:bg-white dark:hover:bg-white/10 hover:text-ink'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Loading Skeletons */}
      {projects === null && (
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-video animate-pulse rounded-3xl glass-card" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {projects?.length === 0 && (
        <div className="mt-12 rounded-3xl border border-dashed border-ink/20 glass-card p-16 text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-signal-soft text-signal mb-4">
            <BriefcaseIcon className="h-7 w-7" />
          </div>
          <h3 className="font-display text-xl font-bold text-ink">Showcase projects updating</h3>
          <p className="mt-2 text-sm text-muted-light max-w-md mx-auto">
            New case studies are being published. You can view all our services or start a project inquiry directly.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              to="/services"
              className="rounded-xl bg-signal px-6 py-2.5 text-sm font-semibold text-white"
            >
              Browse Services
            </Link>
            <WhatsAppButton className="glass-card text-ink" />
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {projects && projects.length > 0 && (
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((p, i) => (
            <ProjectCard key={p.id} project={p} delay={(i % 6) * 60} />
          ))}
          {filteredProjects.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm text-muted-light">
              No projects found matching the selected filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
