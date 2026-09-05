import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateLogin } from '../utils/validators';
import FieldError from '../components/common/FieldError';

// Dark-themed field styling matching the admin dashboard's ink palette —
// deliberately distinct from the public Login page so it's visually
// obvious this isn't the customer login.
const fieldClass = (hasError) =>
  `w-full rounded-lg border bg-white/5 px-4 py-3 text-white placeholder:text-muted-dark focus:outline-none focus:ring-1 ${
    hasError
      ? 'border-red-400 focus:ring-red-400'
      : 'border-white/15 focus:border-signal focus:ring-signal'
  }`;

export default function AdminLogin() {
  const { login, logout, resendVerification, sessionExpired, clearSessionExpired } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Admin accounts go through the same Supabase confirmation-link
  // verification as customers — this is the same 403 handling as Login.jsx.
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resent, setResent] = useState(false);

  const handleChange = (e) => {
    const next = { ...form, [e.target.name]: e.target.value };
    setForm(next);
    if (touched[e.target.name]) setErrors(validateLogin(next));
  };

  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
    setErrors(validateLogin(form));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNeedsVerification(false);
    setResent(false);

    const fieldErrors = validateLogin(form);
    setErrors(fieldErrors);
    setTouched({ email: true, password: true });
    if (Object.keys(fieldErrors).length > 0) return;

    clearSessionExpired();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role !== 'admin') {
        // Credentials were valid but this isn't an admin account — don't
        // leave them signed in under the admin login flow.
        await logout();
        setError('This login is for admin accounts only.');
        return;
      }
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
      setNeedsVerification(err.response?.status === 403 && err.response?.data?.message?.includes('verify'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendVerification(form.email);
      setResent(true);
    } catch {
      // resend endpoint always answers success — failures here are
      // network/validation only, covered by the generic error text.
    }
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-[#12141C] px-4 text-white">
      <div className="w-full max-w-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-dark">Admin</p>
        <h1 className="mt-2 font-display text-2xl font-semibold">Dashboard login</h1>
        <p className="mt-2 text-sm text-muted-dark">Restricted to admin accounts.</p>

        {sessionExpired && (
          <p className="mt-6 rounded-lg border border-brass/30 bg-brass/10 px-4 py-3 text-sm text-brass">
            Your session expired — please log in again.
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-4">
          <div>
            <input
              type="email"
              name="email"
              placeholder="Admin email"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(touched.email && errors.email)}
              className={fieldClass(touched.email && errors.email)}
            />
            {touched.email && <FieldError>{errors.email}</FieldError>}
          </div>
          <div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(touched.password && errors.password)}
              className={fieldClass(touched.password && errors.password)}
            />
            {touched.password && <FieldError>{errors.password}</FieldError>}
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {needsVerification && (
            resent
              ? <p className="text-sm text-muted-dark">Verification email sent — check your inbox.</p>
              : <button type="button" onClick={handleResend} className="text-sm font-medium text-white underline">
                  Resend verification email
                </button>
          )}
          <button
            disabled={loading}
            className="w-full rounded-lg bg-signal py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-sm text-muted-dark">
          Not an admin? <Link to="/login" className="font-medium text-white">Customer log in</Link>
        </p>
      </div>
    </section>
  );
}
