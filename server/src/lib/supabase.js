const { createClient } = require('@supabase/supabase-js');

let _supabaseAdmin = null;

// Server-side only. Uses the service_role key — bypasses RLS, so this
// module must never be imported by anything reachable from the client.
// Lazily constructed so requiring this file doesn't throw in tests that
// never actually call Supabase (env vars may be unset there).
const getSupabaseAdmin = () => {
  if (_supabaseAdmin) return _supabaseAdmin;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }

  _supabaseAdmin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _supabaseAdmin;
};

module.exports = { getSupabaseAdmin };
