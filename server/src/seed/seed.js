require('dotenv').config();
const pool = require('../db/pool');
const { getSupabaseAdmin } = require('../lib/supabase');
const Service = require('../models/Service');
const Package = require('../models/Package');
const CountryPricing = require('../models/CountryPricing');
const User = require('../models/User');
const Project = require('../models/Project');
const Inquiry = require('../models/Inquiry');
const Review = require('../models/Review');
const PortfolioProject = require('../models/PortfolioProject');
const FreeToolLink = require('../models/FreeToolLink');

const SERVICES = [
  { name: 'Custom Website Development', slug: 'custom-website-development', shortDescription: 'Bespoke websites and web apps.', description: 'Business websites, portfolios, landing pages, and custom web applications built from scratch.', examples: ['Business websites', 'Portfolio websites', 'Landing pages', 'Company websites', 'Custom web applications'] },
  { name: 'UI/UX Design', slug: 'ui-ux-design', shortDescription: 'Interfaces people enjoy using.', description: 'Website UI, mobile UI, dashboards, wireframes, prototypes, and design systems.', examples: ['Website UI design', 'Mobile UI', 'Dashboard UI', 'Wireframes', 'Prototypes', 'Design systems'] },
  { name: 'WordPress Development', slug: 'wordpress-development', shortDescription: 'WordPress sites built right.', description: 'Business sites, Elementor/Gutenberg builds, WooCommerce, theme customization, and maintenance.', examples: ['WordPress business websites', 'Elementor/Gutenberg websites', 'WooCommerce', 'Theme customization', 'Plugin integration', 'Website optimization', 'Website maintenance'] },
  { name: 'Wix Development', slug: 'wix-development', shortDescription: 'Fast, polished Wix builds.', description: 'Business websites, landing pages, portfolios, and Wix customization.', examples: ['Wix business websites', 'Landing pages', 'Portfolio websites', 'Wix customization', 'Responsive design'] },
  { name: 'Graphic Design', slug: 'graphic-design', shortDescription: 'Visual identity that stands out.', description: 'Logos, social media graphics, brand identity, business cards, and marketing graphics.', examples: ['Logo design', 'Social media graphics', 'Brand identity', 'Business cards', 'Marketing graphics', 'Website graphics'] },
];

const PACKAGE_TEMPLATES = [
  { name: 'Basic', features: ['Small website', 'Responsive design', 'Basic SEO', 'Contact form'], order: 0 },
  { name: 'Standard', features: ['Multiple pages', 'Custom UI', 'SEO setup', 'Performance optimization'], order: 1 },
  { name: 'Premium', features: ['Fully custom website', 'Advanced functionality', 'UI/UX design', 'SEO', 'Optimization', 'Priority support'], order: 2 },
];

const PRICING_TIERS = {
  'Sri Lanka': { currency: 'LKR', multiplier: 1 },
  India: { currency: 'INR', multiplier: 2.2 },
  International: { currency: 'USD', multiplier: 6 },
};

// Core site content, seeded unconditionally like SERVICES above (not demo
// data) — these are exactly the entries that used to be hardcoded in
// Footer.jsx's `freeToolsLinks` array, now editable from the admin
// dashboard's Free Tools tab instead.
const FREE_TOOL_LINKS = [
  { label: 'Meta Tag & SEO Generator', href: '/tools', order: 0 },
  { label: 'Color Contrast Checker', href: '/tools', order: 1 },
  { label: '50% Milestone Calculator', href: '/tools', order: 2 },
  { label: 'Aspect Ratio Tool', href: '/tools', order: 3 },
  { label: 'All Free Tools Hub', href: '/tools', order: 4 },
];

const BASE_PRICE = { Basic: 150, Standard: 350, Premium: 700 };

// Sample data so a fresh install has something to look at in the admin
// overview instead of every panel being empty. Off by default — set
// SEED_DEMO_DATA=true to include it. Auth users get a fixed, obviously-fake
// password since this is local/dev seed data, never meant for production.
const DEMO_PASSWORD = 'DemoPass123!';
const DEMO_CUSTOMERS = [
  { name: 'Nadeesha Perera', email: 'demo.nadeesha@example.com', country: 'Sri Lanka' },
  { name: 'Arjun Mehta', email: 'demo.arjun@example.com', country: 'India' },
  { name: 'Sofia Reyes', email: 'demo.sofia@example.com', country: 'International' },
];

const DEMO_INQUIRIES = [
  { name: 'Ruwan Silva', email: 'ruwan@example.com', whatsapp: '+94771234567', country: 'Sri Lanka', service: 'Custom Website Development', budget: 'LKR 100,000–150,000', description: 'Need a booking site for a small guesthouse, 5 rooms.' },
  { name: 'Priya Nair', email: 'priya@example.com', country: 'India', service: 'UI/UX Design', budget: '₹40,000', description: 'Redesigning our SaaS dashboard, current one feels dated.' },
  { name: 'Tom Becker', email: 'tom@example.com', country: 'International', service: 'WordPress Development', budget: '$800', description: 'Migrating a Squarespace site to WordPress with WooCommerce.' },
];

const DEMO_REVIEWS = [
  { rating: 5, comment: "Delivered exactly what we asked for, on time. Communication over WhatsApp made the whole process easy.", approved: true, service: 'Custom Website Development' },
  { rating: 4, comment: 'Solid work on the redesign, a couple of rounds of revisions but ended up in a great place.', approved: false, service: 'UI/UX Design' },
];

const DEMO_PORTFOLIO = [
  {
    title: 'Coastal Villa Booking Site', description: 'A five-room guesthouse booking site with availability calendar and WhatsApp inquiries.',
    service: 'Custom Website Development', country: 'Sri Lanka', published: true,
    techStack: ['Next.js', 'React', 'TypeScript', 'Supabase'],
    features: ['Live availability calendar', 'WhatsApp inquiry button', 'Multi-language content'],
  },
  {
    title: 'SaaS Dashboard Redesign', description: 'Full UI/UX overhaul of an analytics dashboard used by 200+ daily active users.',
    service: 'UI/UX Design', country: 'India', published: true,
    techStack: ['Figma', 'React', 'Tailwind CSS'],
    features: ['New information architecture', 'Dark mode support', 'Accessibility pass to WCAG AA'],
  },
];

// Finds or creates a Supabase Auth user + profile row for a demo customer,
// mirroring the admin-creation block below. Returns the profile (or null
// if Supabase Auth creation failed, e.g. email already taken elsewhere).
const findOrCreateDemoUser = async ({ name, email, country }) => {
  const existing = await User.findByEmail(email);
  if (existing) return existing;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.admin.createUser({
    email, password: DEMO_PASSWORD, email_confirm: true,
  });
  if (error) {
    console.error(`Could not create demo user ${email}: ${error.message}`);
    return null;
  }
  return User.createProfile({
    id: data.user.id, name, email, country, role: 'customer', isActive: true, emailVerified: true,
  });
};

const seedDemoData = async (services, packages) => {
  const customers = [];
  for (const c of DEMO_CUSTOMERS) {
    const user = await findOrCreateDemoUser(c);
    if (user) customers.push(user);
  }
  if (customers.length === 0) {
    console.log('No demo customers available (Supabase Auth calls failed) — skipping projects/reviews.');
    return;
  }

  // Wipe previous demo runs' dependent rows so re-running `npm run seed`
  // doesn't pile up duplicates.
  await pool.query('delete from reviews where user_id = any($1)', [customers.map((c) => c.id)]);
  await pool.query('delete from projects where customer_id = any($1)', [customers.map((c) => c.id)]);
  await pool.query('delete from inquiries where email = any($1)', [DEMO_INQUIRIES.map((i) => i.email)]);
  await pool.query('delete from portfolio_projects where title = any($1)', [DEMO_PORTFOLIO.map((p) => p.title)]);

  const statusCycle = ['Development', 'Review', 'Completed'];
  let projectCount = 0;
  for (const [i, customer] of customers.entries()) {
    const service = services[i % services.length];
    const pkg = packages.find((p) => p.service === service.id) || packages[0];
    const tier = PRICING_TIERS[customer.country] || PRICING_TIERS.International;
    const total = Math.round(BASE_PRICE[PACKAGE_TEMPLATES[0].name] * tier.multiplier * 2);
    await Project.create({
      customer: customer.id,
      service: service.id,
      package: pkg.id,
      country: customer.country,
      currency: tier.currency,
      totalAmount: total,
      advanceAmount: Math.round(total / 2),
      remainingAmount: Math.round(total / 2),
      status: statusCycle[i % statusCycle.length],
      requirements: `Demo project for ${customer.name}.`,
    });
    projectCount += 1;
  }

  for (const inquiry of DEMO_INQUIRIES) {
    await Inquiry.create(inquiry);
  }

  for (const [i, review] of DEMO_REVIEWS.entries()) {
    const customer = customers[i % customers.length];
    const created = await Review.create({
      userId: customer.id, name: customer.name, country: customer.country,
      service: review.service, rating: review.rating, comment: review.comment,
    });
    if (review.approved) await Review.setApproved(created.id, true);
  }

  for (const project of DEMO_PORTFOLIO) {
    await PortfolioProject.create(project);
  }

  console.log(
    `Seeded demo data: ${customers.length} customers, ${projectCount} projects, `
    + `${DEMO_INQUIRIES.length} inquiries, ${DEMO_REVIEWS.length} reviews, ${DEMO_PORTFOLIO.length} portfolio entries.`
  );
};

const run = async () => {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

  // Wipe in FK-safe order: pricing -> packages -> services. free_tool_links
  // has no FK dependents, so it's independent of that ordering.
  await pool.query('delete from country_pricing');
  await pool.query('delete from packages');
  await pool.query('delete from services');
  await pool.query('delete from free_tool_links');

  const services = [];
  for (const svc of SERVICES) {
    services.push(await Service.create(svc));
  }

  const packages = [];
  for (const service of services) {
    for (const tmpl of PACKAGE_TEMPLATES) {
      packages.push(await Package.create({ service: service.id, ...tmpl }));
    }
  }

  let pricingCount = 0;
  for (const [country, { currency, multiplier }] of Object.entries(PRICING_TIERS)) {
    for (const pkg of packages) {
      await CountryPricing.create({
        country,
        currency,
        service: pkg.service,
        package: pkg.id,
        price: Math.round(BASE_PRICE[pkg.name] * multiplier),
        active: true,
      });
      pricingCount += 1;
    }
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const isWeakPassword = (pw) => pw.length < 12 || /^\d+$/.test(pw);
  if (adminEmail && adminPassword && isWeakPassword(adminPassword)) {
    console.error(
      'SEED_ADMIN_PASSWORD is too weak (must be 12+ characters and not digits-only) '
      + '— refusing to create the admin account. Set a stronger password in .env and re-run.'
    );
  } else if (adminEmail && adminPassword) {
    const existingAdmin = await User.findByEmail(adminEmail);
    if (!existingAdmin) {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
      });
      if (error) {
        console.error(`Could not create Supabase Auth user for admin: ${error.message}`);
      } else {
        await User.createProfile({
          id: data.user.id,
          name: 'Admin',
          email: adminEmail,
          role: 'admin',
          isActive: true,
          emailVerified: true,
        });
        console.log(`Admin user created: ${adminEmail}`);
      }
    }
  } else {
    console.log('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env to seed an admin user.');
  }

  const freeTools = [];
  for (const link of FREE_TOOL_LINKS) {
    freeTools.push(await FreeToolLink.create(link));
  }

  console.log(
    `Seeded ${services.length} services, ${packages.length} packages, ${pricingCount} pricing rows, `
    + `${freeTools.length} free tool links.`
  );

  if (process.env.SEED_DEMO_DATA === 'true') {
    await seedDemoData(services, packages);
  } else {
    console.log('Set SEED_DEMO_DATA=true in .env to also seed demo customers, projects, inquiries, reviews, and portfolio entries.');
  }

  await pool.end();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
