process.env.NODE_ENV = 'test';
process.env.SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'test-secret-key-for-jest';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key';
process.env.DATABASE_URL = process.env.DATABASE_URL
  || 'postgresql://test:test@localhost:5432/test';
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_fake';
process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_fake';
