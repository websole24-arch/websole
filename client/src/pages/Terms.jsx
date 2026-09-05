import PageHeader from '../components/common/PageHeader';
import Reveal from '../components/common/Reveal';

export default function Terms() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 pb-24">
      <PageHeader
        badge="Legal"
        title="Terms of"
        gradientWord="Service"
        description="Standard contractual guidelines governing our design, development, and milestone delivery services."
      />

      <Reveal className="mt-8 rounded-3xl glass-card p-8 sm:p-12 space-y-8 text-sm leading-relaxed text-ink/90">
        <section>
          <h2 className="font-display text-lg font-bold text-ink">1. Services & Engagement</h2>
          <p className="mt-2 text-muted-light">
            Studio provides custom web development, UI/UX design, WordPress/Wix site creation, and brand design services. Specific deliverables, timeframes, and milestone schedules are outlined in the project quotation agreed upon prior to commencement.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">2. Milestone Payments & 50% Advance</h2>
          <p className="mt-2 text-muted-light">
            All custom projects require a 50% non-refundable advance deposit to secure sprint allocation and begin initial design & development. The remaining 50% balance is payable upon demonstration and approval of the final deliverables on our staging environment before production deployment.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">3. Intellectual Property & Ownership</h2>
          <p className="mt-2 text-muted-light">
            Upon receipt of full and final payment, 100% of all intellectual property, source code repositories, design assets, and domain configurations created specifically for your project are transferred to the client.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">4. Revisions & Scope Adjustments</h2>
          <p className="mt-2 text-muted-light">
            Standard packages include designated revision rounds during the prototyping and staging phases. Substantial changes requested outside the agreed project brief will be quoted separately as scope expansions.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">5. Governing Law & Dispute Resolution</h2>
          <p className="mt-2 text-muted-light">
            Both parties agree to make good-faith efforts to resolve any disputes amicably through direct communication before pursuing formal legal avenues.
          </p>
        </section>
      </Reveal>
    </div>
  );
}
