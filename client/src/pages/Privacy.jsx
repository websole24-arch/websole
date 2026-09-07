import PageHeader from '../components/common/PageHeader';
import Reveal from '../components/common/Reveal';

export default function Privacy() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 pb-24">
      <PageHeader
        badge="Privacy"
        title="Privacy"
        gradientWord="Policy"
        description="How Web_Sole collects, uses, and safeguards client information and project data."
      />

      <Reveal className="mt-8 rounded-3xl glass-card p-8 sm:p-12 space-y-8 text-sm leading-relaxed text-ink/90">
        <section>
          <h2 className="font-display text-lg font-bold text-ink">1. Information We Collect</h2>
          <p className="mt-2 text-muted-light">
            We collect personal information necessary to deliver our services, including your name, business email, WhatsApp contact number, country of operation, and project specifications submitted through our inquiry or registration forms.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">2. How We Use Your Information</h2>
          <p className="mt-2 text-muted-light">
            Your information is used strictly to calculate country-specific rates, manage project milestones, communicate progress, invoice for services, and provide customer support. We never sell, rent, or trade client information to third parties.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">3. Data Security & Storage</h2>
          <p className="mt-2 text-muted-light">
            All user credentials, session cookies, and database records are encrypted and protected using industry-standard protocols including HTTPS/TLS encryption and secure PostgreSQL / Supabase infrastructure.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">4. Third-Party Integrations</h2>
          <p className="mt-2 text-muted-light">
            Payment transactions are processed securely via external certified providers (such as Stripe or PayPal). We do not store full credit card numbers on our servers.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">5. Your Data Rights</h2>
          <p className="mt-2 text-muted-light">
            You may request an export of your account data or request permanent deletion of your profile and submitted inquiries at any time by contacting our support team.
          </p>
        </section>
      </Reveal>
    </div>
  );
}
