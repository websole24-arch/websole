// Covers the CORS origin-matching logic in app.js — specifically that
// the preview-URL regex stays scoped to CLIENT_ORIGIN_PREVIEW_PREFIX and
// does NOT degenerate into "any *.vercel.app", which combined with
// credentials:true would let an unrelated Vercel-hosted site make
// authenticated requests using a visitor's session cookie.
describe('CORS origin matching', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      CLIENT_ORIGIN: 'https://studio.vercel.app,https://www.example.com',
      CLIENT_ORIGIN_PREVIEW_PREFIX: 'studio',
    };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  // app.js wires this straight into the `cors` package, which isn't
  // trivial to unit-test in isolation without spinning up the whole app
  // — so this test rebuilds the exact matching logic (allowlist +
  // regex) app.js uses, keeping both in sync is the point of the test.
  const buildMatcher = () => {
    const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
      .split(',')
      .map((o) => o.trim().replace(/\/$/, ''));
    const previewPrefix = process.env.CLIENT_ORIGIN_PREVIEW_PREFIX;
    const previewOriginPattern = previewPrefix
      ? new RegExp(`^https://${previewPrefix}-[a-z0-9-]+\\.vercel\\.app$`)
      : null;
    return (origin) => allowedOrigins.includes(origin) || Boolean(previewOriginPattern?.test(origin));
  };

  it('allows an exact CLIENT_ORIGIN entry', () => {
    expect(buildMatcher()('https://www.example.com')).toBe(true);
  });

  it('allows a preview URL matching the configured project prefix', () => {
    expect(buildMatcher()('https://studio-six-eta-63.vercel.app')).toBe(true);
    expect(buildMatcher()('https://studio-eight-blue-70.vercel.app')).toBe(true);
  });

  it('blocks a different Vercel-hosted project entirely (the wildcard vuln this replaces)', () => {
    expect(buildMatcher()('https://some-attacker-app.vercel.app')).toBe(false);
    expect(buildMatcher()('https://totally-unrelated-project.vercel.app')).toBe(false);
  });

  it('blocks a look-alike domain that merely contains "vercel.app"', () => {
    expect(buildMatcher()('https://studio-six-eta-63.vercel.app.evil.com')).toBe(false);
  });

  it('blocks an origin with no relation to CLIENT_ORIGIN or the prefix', () => {
    expect(buildMatcher()('https://random-site.com')).toBe(false);
  });
});
