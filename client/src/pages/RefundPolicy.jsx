import PageHeader from '../components/common/PageHeader';
import Reveal from '../components/common/Reveal';

export default function RefundPolicy() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 pb-24">
      <PageHeader
        badge="Policy"
        title="Refund & Cancellation"
        gradientWord="Policy"
        description="Understanding our 50% milestone payment structure and cancellation terms."
      />

      <Reveal className="mt-8 rounded-3xl glass-card p-8 sm:p-12 space-y-8 text-sm leading-relaxed text-ink/90">
        <section>
          <h2 className="font-display text-lg font-bold text-ink">1. Advance Deposit (50%)</h2>
          <p className="mt-2 text-muted-light">
            The initial 50% advance covers sprint booking, discovery research, wireframing, and initial development. If a project is cancelled prior to any design mockups or code being produced, a full refund of the deposit is granted minus standard payment processing fees. Once work has begun, the advance deposit is non-refundable.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">2. Milestone Review & Approval</h2>
          <p className="mt-2 text-muted-light">
            Before issuing the final 50% balance invoice, clients review functional staging previews of all deliverables. You have the opportunity to request revisions per your package terms to ensure the result matches the agreed brief.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">3. Final Delivery & Post-Settlement</h2>
          <p className="mt-2 text-muted-light">
            Once the final payment is settled and repositories/domains are transferred to the client, work is deemed accepted. We provide 30 days of complimentary bug-fixing and warranty support following deployment.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">4. How to Request a Cancellation</h2>
          <p className="mt-2 text-muted-light">
            To request a project cancellation or review, please contact your project lead directly on WhatsApp or submit a written notice via our contact form.
          </p>
        </section>
      </Reveal>
    </div>
  );
}
