import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminShell from '../../components/admin/AdminShell';
import OverviewTab from './tabs/OverviewTab';
import ProjectsTab from './tabs/ProjectsTab';
import CustomersTab from './tabs/CustomersTab';
import ServicesTab from './tabs/ServicesTab';
import PackagesTab from './tabs/PackagesTab';
import PricingTab from './tabs/PricingTab';
import InquiriesTab from './tabs/InquiriesTab';
import ReviewsTab from './tabs/ReviewsTab';
import PortfolioTab from './tabs/PortfolioTab';
import FreeToolsTab from './tabs/FreeToolsTab';
import SettingsTab from './tabs/SettingsTab';
import { PageHeader } from './ui';

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'overview' },
  { id: 'projects', label: 'Projects', icon: 'projects' },
  { id: 'customers', label: 'Customers', icon: 'customers' },
  { id: 'services', label: 'Services', icon: 'services' },
  { id: 'packages', label: 'Packages', icon: 'packages' },
  { id: 'pricing', label: 'Pricing', icon: 'pricing' },
  { id: 'inquiries', label: 'Inquiries', icon: 'inquiries' },
  { id: 'reviews', label: 'Reviews', icon: 'reviews' },
  { id: 'portfolio', label: 'Portfolio', icon: 'portfolio' },
  { id: 'freeTools', label: 'Free Tools', icon: 'tools' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

const SUBTITLES = {
  overview: 'A snapshot of the business right now.',
  projects: 'Active and past customer projects.',
  customers: 'Everyone with an account.',
  services: 'What you offer, and to whom.',
  packages: 'Tiers within each service.',
  pricing: 'Rates by country, service, and package.',
  inquiries: 'Leads from the contact form.',
  reviews: 'Customer feedback, published and pending.',
  portfolio: 'Completed work shown on Home and Portfolio.',
  freeTools: "Links shown in the Footer's Free Tools column.",
  settings: 'Show or hide payment options on the customer dashboard.',
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [active, setActive] = useState('overview');
  const activeTab = TABS.find((t) => t.id === active);

  return (
    <AdminShell tabs={TABS} active={active} onChange={setActive}>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader
          title={active === 'overview' ? `Hi, ${user?.name || 'Admin'}` : activeTab?.label}
          subtitle={SUBTITLES[active]}
        />

        {active === 'overview' && <OverviewTab onNavigate={setActive} />}
        {active === 'projects' && <ProjectsTab />}
        {active === 'customers' && <CustomersTab />}
        {active === 'services' && <ServicesTab />}
        {active === 'packages' && <PackagesTab />}
        {active === 'pricing' && <PricingTab />}
        {active === 'inquiries' && <InquiriesTab />}
        {active === 'reviews' && <ReviewsTab />}
        {active === 'portfolio' && <PortfolioTab />}
        {active === 'freeTools' && <FreeToolsTab />}
        {active === 'settings' && <SettingsTab />}
      </section>
    </AdminShell>
  );
}
