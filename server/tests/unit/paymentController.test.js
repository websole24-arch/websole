// Tests the *controller logic* around Stripe (ownership checks, amount
// selection, session/webhook handling, idempotent "mark paid") — not
// Stripe itself. There's no network access to api.stripe.com in this
// environment, so the SDK is mocked, same approach as
// authController.test.js takes for the Supabase SDK.
jest.mock('../../src/lib/stripe');
jest.mock('../../src/models/Payment');
jest.mock('../../src/models/Project');
jest.mock('../../src/models/ActivityLog');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { getStripe } = require('../../src/lib/stripe');
const Payment = require('../../src/models/Payment');
const Project = require('../../src/models/Project');
const ActivityLog = require('../../src/models/ActivityLog');
const app = require('../../src/app');

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

const cookieFor = (userId) => {
  const token = jwt.sign({ sub: userId, role: 'authenticated' }, SUPABASE_JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h',
  });
  return `sb_access_token=${token}`;
};

// protect middleware loads the profile via User.findById — mock that too
// so these requests authenticate as a real customer/admin.
jest.mock('../../src/models/User');
const User = require('../../src/models/User');

const customer = { id: 'cust-1', role: 'customer', email: 'cust@example.com', isActive: true };
const otherCustomer = { id: 'cust-2', role: 'customer', email: 'other@example.com', isActive: true };
const admin = { id: 'admin-1', role: 'admin', email: 'admin@example.com', isActive: true };

const project = {
  id: 'proj-1',
  currency: 'USD',
  totalAmount: 200,
  advanceAmount: 100,
  remainingAmount: 100,
  status: 'Awaiting Payment',
  customer: { id: 'cust-1' },
  service: { name: 'Custom Web' },
};

const mockStripeClient = () => ({
  checkout: {
    sessions: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
});

describe('paymentController (mocked Stripe)', () => {
  let stripe;

  beforeEach(() => {
    jest.clearAllMocks();
    stripe = mockStripeClient();
    getStripe.mockReturnValue(stripe);
    User.findById.mockImplementation(async (id) => [customer, otherCustomer, admin].find((u) => u.id === id) || null);
  });

  describe('POST /api/payments/checkout', () => {
    it('creates a Checkout Session for the project owner and stores a Pending payment row', async () => {
      Project.findById.mockResolvedValue(project);
      Payment.findByProjectAndType.mockResolvedValue(null);
      Payment.create.mockResolvedValue({ id: 'pay-1' });
      stripe.checkout.sessions.create.mockResolvedValue({ id: 'cs_test_123', url: 'https://checkout.stripe.com/cs_test_123' });

      const res = await request(app)
        .post('/api/payments/checkout')
        .set('Cookie', cookieFor(customer.id))
        .send({ projectId: 'proj-1', type: 'advance' });

      expect(res.status).toBe(200);
      expect(res.body.url).toBe('https://checkout.stripe.com/cs_test_123');
      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'payment',
          success_url: expect.stringContaining('/dashboard?payment=success'),
        })
      );
      // 100 USD advance -> 10000 minor units
      expect(stripe.checkout.sessions.create.mock.calls[0][0].line_items[0].price_data.unit_amount).toBe(10000);
      expect(Payment.create).toHaveBeenCalledWith(
        expect.objectContaining({ project: 'proj-1', type: 'advance', amount: 100, providerPaymentId: 'cs_test_123' })
      );
    });

    it('blocks a customer who does not own the project (IDOR)', async () => {
      Project.findById.mockResolvedValue(project);

      const res = await request(app)
        .post('/api/payments/checkout')
        .set('Cookie', cookieFor(otherCustomer.id))
        .send({ projectId: 'proj-1', type: 'advance' });

      expect(res.status).toBe(403);
      expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
    });

    it('rejects an invalid type before touching Stripe or the DB', async () => {
      const res = await request(app)
        .post('/api/payments/checkout')
        .set('Cookie', cookieFor(customer.id))
        .send({ projectId: 'proj-1', type: 'deposit' });

      expect(res.status).toBe(400);
      expect(Project.findById).not.toHaveBeenCalled();
    });

    it('refuses to re-charge an already-paid type', async () => {
      Project.findById.mockResolvedValue(project);
      Payment.findByProjectAndType.mockResolvedValue({ id: 'pay-1', status: 'Paid' });

      const res = await request(app)
        .post('/api/payments/checkout')
        .set('Cookie', cookieFor(customer.id))
        .send({ projectId: 'proj-1', type: 'advance' });

      expect(res.status).toBe(400);
      expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
    });

    it('blocks a final-payment attempt before the advance is even settled', async () => {
      Project.findById.mockResolvedValue({ ...project, status: 'Awaiting Payment' });

      const res = await request(app)
        .post('/api/payments/checkout')
        .set('Cookie', cookieFor(customer.id))
        .send({ projectId: 'proj-1', type: 'final' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/payments/webhook', () => {
    it('marks the payment Paid and advances the project on checkout.session.completed', async () => {
      stripe.webhooks.constructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_test_123', payment_status: 'paid' } },
      });
      const paymentRow = { id: 'pay-1', project: 'proj-1', type: 'advance', status: 'Pending', amount: 100, currency: 'USD' };
      Payment.findByProviderPaymentId.mockResolvedValue(paymentRow);
      Payment.updateStatus.mockResolvedValue({ ...paymentRow, status: 'Paid' });
      Project.findById.mockResolvedValue({ ...project, status: 'Awaiting Payment' });

      const res = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'test-sig')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ id: 'evt_1' }));

      expect(res.status).toBe(200);
      expect(Payment.updateStatus).toHaveBeenCalledWith('pay-1', expect.objectContaining({ status: 'Paid' }));
      expect(Project.updateStatus).toHaveBeenCalledWith('proj-1', 'Payment Confirmed');
      expect(ActivityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'Payment received' })
      );
    });

    it('does not re-apply or re-log an already-Paid payment (idempotent on webhook retry)', async () => {
      stripe.webhooks.constructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_test_123', payment_status: 'paid' } },
      });
      Payment.findByProviderPaymentId.mockResolvedValue({
        id: 'pay-1', project: 'proj-1', type: 'advance', status: 'Paid', amount: 100, currency: 'USD',
      });

      const res = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'test-sig')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ id: 'evt_1' }));

      expect(res.status).toBe(200);
      expect(Payment.updateStatus).not.toHaveBeenCalled();
      expect(Project.updateStatus).not.toHaveBeenCalled();
    });

    it('rejects a bad signature with 400, not 500', async () => {
      stripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('signature mismatch');
      });

      const res = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'bad-sig')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ id: 'evt_1' }));

      expect(res.status).toBe(400);
      expect(Payment.findByProviderPaymentId).not.toHaveBeenCalled();
    });
  });
});
