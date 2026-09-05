// Auto-detects the visitor's country from their IP, client-side, so the
// site can default to the right pricing without asking permission (no
// browser geolocation prompt — this is coarse, IP-based location, not
// precise device location).
//
// Provider: ipapi.co — free tier, HTTPS, no API key required for basic
// lookups (rate-limited; fine for this use case). Response shape assumed:
// `{ country_name: "Sri Lanka", country_code: "LK", ... }`, or
// `{ error: true, reason: "..." }` on failure.
//
// NOTE: this call could not be exercised against the live API from the
// sandbox this was built in (no network egress to ipapi.co there) — it's
// implemented defensively (timeout + try/catch, always resolves rather
// than rejects) so a slow/blocked/changed API can never break the page,
// but it hasn't been manually verified end-to-end. Test it for real
// before relying on it. If ipapi.co ever needs replacing, this is the
// only file that should need to change.
export async function detectCountryName({ timeoutMs = 4000 } = {}) {
  // Cache per tab (sessionStorage, not localStorage — a stale detection
  // surviving days/weeks across visits is a worse trade than one extra
  // lookup next session). Cuts repeat calls to ipapi.co's free tier,
  // which rate-limits (429) surprisingly fast under normal dev/QA
  // reloading, let alone real traffic.
  const CACHE_KEY = 'detectedCountryName';
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached !== null) return cached === '' ? null : cached;
  } catch {
    // sessionStorage unavailable (private browsing, etc.) — fall through
    // and just always fetch instead of caching.
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let result = null;
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    if (res.ok) {
      const data = await res.json();
      if (!data.error && data.country_name) result = data.country_name;
    }
  } catch {
    result = null;
  } finally {
    clearTimeout(timer);
  }

  try {
    sessionStorage.setItem(CACHE_KEY, result || '');
  } catch {
    // ignore — caching is an optimization, not a requirement
  }

  return result;
}
