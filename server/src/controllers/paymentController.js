const { getStripe } = require('../lib/stripe');
const Payment = require('../models/Payment');
const Project = require('../models/Project');
const ActivityLog = require('../models/ActivityLog');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const isOwner = require('../utils/isProjectOwner');

const CLIENT_ORIGIN = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',')[0];

// Statuses an 'advance' payment may legitimately land the project in
// before it's Paid — the webhook only advances the project out of one of
// these, so a late/duplicate event can't clobber a project an admin has
// already moved further along by hand.
const PRE_ADVANCE_STATUSES = ['Inquiry', 'Awaiting Payment'];

const amountForType = (project, type) =>
  type === 'advance' ? Number(project.advanceAmount) : Number(project.remainingAmount);

// Stripe wants the smallest currency unit. This assumes 2-decimal
// currencies (USD, EUR, LKR, INR, etc. — everything this app's seed data
// and country_pricing rows use). Zero-decimal currencies (JPY, KRW, ...)
// aren't handled — add a lookup table here if one of those is ever added
// to country_pricing.
const toMinorUnits = (amount) => Math.round(Number(amount) * 100);

// Shared by the webhook and the /verify fallback so both apply the exact
// same "mark paid, advance the project, log it" logic exactly once.
const applyPaidPayment = async (payment) => {
  if (payment.status === 'Paid') return payment; // already applied — idempotent

  const updated = await Payment.updateStatus(payment.id, { status: 'Paid', paidAt: new Date() });

  const project = await Project.findById(payment.project);
  if (project && payment.type === 'advance' && PRE_ADVANCE_STATUSES.includes(project.status)) {
    await Project.updateStatus(project.id, 'Payment Confirmed');
    await ActivityLog.create({
      project: project.id,
      actor: null,
      action: 'Status changed',
      meta: { from: project.status, to: 'Payment Confirmed', reason: 'Advance payment received' },
    });
  }

  await ActivityLog.create({
    project: payment.project,
    actor: null,
    action: 'Payment received',
    meta: { type: payment.type, amount: payment.amount, currency: payment.currency },
  });

  return updated;
};

const createCheckoutSession = asyncHandler(async (req, res) => {
  const { projectId, type } = req.body;
  if (!['advance', 'final'].includes(type)) {
    throw new ApiError(400, "type must be 'advance' or 'final'");
  }

  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, 'Project not found');
  if (!isOwner(project, req.user)) throw new ApiError(403, 'Not authorized for this project');

  if (type === 'final' && project.status === 'Awaiting Payment') {
    throw new ApiError(400, 'Advance payment must be settled before the final payment');
  }

  const existing = await Payment.findByProjectAndType(project.id, type);
  if (existing?.status === 'Paid') {
    throw new ApiError(400, `The ${type} payment for this project has already been paid`);
  }

  const amount = amountForType(project, type);
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: req.user.email,
    line_items: [
      {
        price_data: {
          currency: project.currency.toLowerCase(),
          unit_amount: toMinorUnits(amount),
          product_data: {
            name: `${project.service?.name || 'Project'} — ${type === 'advance' ? '50% advance' : 'Final payment'}`,
            description: `Project ${project.id}`,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${CLIENT_ORIGIN}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${CLIENT_ORIGIN}/dashboard?payment=cancelled`,
    metadata: { projectId: project.id, type },
  });

  const payment = existing
    ? await Payment.repointToSession(existing.id, session.id)
    : await Payment.create({
        project: project.id,
        type,
        amount,
        currency: project.currency,
        provider: 'stripe',
        providerPaymentId: session.id,
        status: 'Pending',
      });

  res.json({ success: true, url: session.url, paymentId: payment.id });
});

// Public — Stripe calls this directly, no session cookie. Signature
// verification (not auth middleware) is what makes this trustworthy.
// Mounted in app.js with express.raw() BEFORE the global express.json(),
// since Stripe's signature check needs the exact raw request body.
const handleWebhook = asyncHandler(async (req, res) => {
  const stripe = getStripe();
  const signature = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    // Not configured yet — fail loudly in logs rather than silently
    // accepting unverified events.
    console.error('STRIPE_WEBHOOK_SECRET is not set; rejecting webhook');
    return res.status(500).send('Webhook not configured');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, secret);
  } catch (err) {
    console.warn(`Stripe webhook signature verification failed: ${err.message}`);
    return res.status(400).send('Webhook signature verification failed');
  }

  const session = event.data.object;

  if (event.type === 'checkout.session.completed') {
    if (session.payment_status === 'paid') {
      const payment = await Payment.findByProviderPaymentId(session.id);
      if (payment) await applyPaidPayment(payment);
    }
  } else if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
    const payment = await Payment.findByProviderPaymentId(session.id);
    if (payment && payment.status === 'Pending') {
      await Payment.updateStatus(payment.id, { status: 'Failed' });
    }
  }

  // Always 200 on anything we didn't error out on above — Stripe retries
  // on non-2xx, and retrying an event type we deliberately ignore would
  // just be noise.
  res.json({ received: true });
});

// Fallback for the client's return from Stripe Checkout. In local dev
// (no `stripe listen` webhook forwarding running) the webhook above never
// fires, so the dashboard would show a stale "Awaiting Payment" status
// forever despite the payment having actually succeeded. The client calls
// this once on redirect-back with the session_id Stripe appended to
// success_url; it double-checks the session with Stripe directly and
// applies the same idempotent "mark paid" logic the webhook uses, so
// calling this after the webhook already ran is a safe no-op.
const verifySession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const payment = await Payment.findByProviderPaymentId(sessionId);
  if (!payment) throw new ApiError(404, 'No payment found for that session');

  const project = await Project.findById(payment.project);
  if (!project || !isOwner(project, req.user)) throw new ApiError(403, 'Not authorized');

  if (session.payment_status === 'paid') {
    await applyPaidPayment(payment);
  }

  const freshProject = await Project.findById(payment.project);
  res.json({ success: true, paid: session.payment_status === 'paid', project: freshProject });
});

const listForProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId);
  if (!project) throw new ApiError(404, 'Project not found');
  if (!isOwner(project, req.user)) throw new ApiError(403, 'Not authorized for this project');

  const payments = await Payment.findAllForProject(project.id);
  res.json({ success: true, payments });
});

module.exports = { createCheckoutSession, handleWebhook, verifySession, listForProject };
