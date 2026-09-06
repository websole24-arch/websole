import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { validateLogin, MAX_LENGTHS } from '../utils/validators';
import FieldError, { fieldClass } from '../components/common/FieldError';
import Reveal from '../components/common/Reveal';
import { CloseIcon, MailIcon } from '../components/common/Icon';

export default function Login() {
  const { login, sendMagicLink, resendVerification } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('password'); // 'password' | 'magic-link'
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resent, setResent] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [pendingProject, setPendingProject] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('pending_project_selection');
      if (stored) setPendingProject(JSON.parse(stored));
    } catch {}
  }, []);

  const handleRemovePendingProject = () => {
    localStorage.removeItem('pending_project_selection');
    setPendingProject(null);
  };

  const handleChange = (e) => {
    const next = { ...form, [e.target.name]: e.target.value };
    setForm(next);
    if (touched[e.target.name] && mode === 'password') setErrors(validateLogin(next));
  };

  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
    if (mode === 'password') setErrors(validateLogin(form));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNeedsVerification(false);
    setResent(false);
    setMagicLinkSent(false);

    if (mode === 'magic-link') {
      if (!form.email || !form.email.includes('@')) {
        setError('Please enter a valid email address.');
        return;
      }
      setLoading(true);
      try {
        await sendMagicLink(form.email);
        setMagicLinkSent(true);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not send login confirmation link.');
      } finally {
        setLoading(false);
      }
      return;
    }

    const fieldErrors = validateLogin(form);
    setErrors(fieldErrors);
    setTouched({ email: true, password: true });
    if (Object.keys(fieldErrors).length > 0) return;

    setLoading(true);
    try {
      const user = await login(form.email, form.password);

      // If there was a pending project selection, create it now!
      if (pendingProject && user.role !== 'admin') {
        try {
          const { data } = await client.post('/projects', {
            service: pendingProject.serviceId,
            package: pendingProject.packageId,
            country: pendingProject.country,
          });
          localStorage.removeItem('pending_project_selection');
          navigate(`/dashboard?newProjectId=${data.project.id}`);
          return;
        } catch (projErr) {
          console.error('Could not auto-create pending project:', projErr);
        }
      }

      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
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
    } catch {}
  };

  return (
    <div className="relative mx-auto max-w-md px-4 py-20 sm:py-28">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-signal/15 blur-3xl rounded-full pointer-events-none" />

      <Reveal className="relative z-10 rounded-3xl glass-card p-8 sm:p-10 shadow-2xl border border-white/80 dark:border-white/10">
        {/* Brand header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#12141C] to-slate-800 text-white shadow-sm">
              <span className="font-display font-bold text-base text-white">S</span>
            </div>
            <span className="font-display text-2xl font-bold tracking-tight text-ink">
              Studio<span className="text-signal">.</span>
            </span>
          </Link>

          <h1 className="mt-6 font-display text-2xl font-bold text-ink">
            Welcome back
          </h1>
          <p className="mt-1.5 text-xs text-muted-light">
            Sign in to access your client dashboard & project milestones
          </p>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="mt-6 grid grid-cols-2 rounded-2xl bg-ink/5 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setMode('password'); setError(''); setMagicLinkSent(false); }}
            className={`rounded-xl py-2 transition-all duration-200 ${
              mode === 'password'
                ? 'bg-white dark:bg-slate-800 text-ink shadow-xs'
                : 'text-muted-light hover:text-ink'
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => { setMode('magic-link'); setError(''); }}
            className={`rounded-xl py-2 transition-all duration-200 ${
              mode === 'magic-link'
                ? 'bg-white dark:bg-slate-800 text-ink shadow-xs'
                : 'text-muted-light hover:text-ink'
            }`}
          >
            Email Login Link
          </button>
        </div>

        {/* Selected Package Badge */}
        {pendingProject && (
          <div className="mt-6 rounded-2xl bg-signal-soft border border-signal/30 p-3.5 text-xs text-[#12141C]/90">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono font-bold uppercase text-signal">Pending Project</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono font-bold text-[#12141C]">
                  {pendingProject.currency} {Number(pendingProject.price).toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={handleRemovePendingProject}
                  aria-label="Remove pending project"
                  className="text-signal/70 hover:text-signal transition-colors leading-none"
                >
                  <CloseIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <p className="mt-1 font-semibold text-xs text-[#12141C]">
              {pendingProject.serviceName} ({pendingProject.packageName})
            </p>
            <p className="text-[11px] text-[#5B5F63] mt-0.5">
              Signing in will automatically save this project and show your 50% advance payment details on WhatsApp.
            </p>
          </div>
        )}

        {magicLinkSent ? (
          <div className="mt-6 text-center space-y-4 animate-fade-in">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <MailIcon className="h-5 w-5" />
            </div>
            <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200 p-4 text-xs text-emerald-900 leading-relaxed">
              <p className="font-semibold text-emerald-950">Login confirmation link sent!</p>
              <p className="mt-1">
                We emailed a sign-in link to <span className="font-mono font-medium">{form.email}</span>. Click the link in the email to immediately log in.
              </p>
            </div>
            <p className="text-[11px] text-muted-light">
              Didn't receive the email? Check your spam folder or try again below.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setMagicLinkSent(false)}
                className="text-xs font-semibold text-signal hover:underline"
              >
                Resend or use password
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-mono uppercase tracking-wider text-ink/70 mb-1.5">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                name="email"
                placeholder="name@company.com"
                maxLength={MAX_LENGTHS.email}
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={Boolean(touched.email && errors.email)}
                className={`${fieldClass(touched.email && errors.email)} bg-white/80 dark:bg-white/5 text-ink placeholder:text-muted-light rounded-xl`}
              />
              {touched.email && mode === 'password' && <FieldError>{errors.email}</FieldError>}
            </div>

            {mode === 'password' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="login-password" className="block text-xs font-mono uppercase tracking-wider text-ink/70">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-signal hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="login-password"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  maxLength={MAX_LENGTHS.password}
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={Boolean(touched.password && errors.password)}
                  className={`${fieldClass(touched.password && errors.password)} bg-white/80 dark:bg-white/5 text-ink placeholder:text-muted-light rounded-xl`}
                />
                {touched.password && <FieldError>{errors.password}</FieldError>}
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                {error}
              </div>
            )}

            {needsVerification && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
                {resent ? (
                  <p>Verification link resent! Please check your inbox.</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="font-medium underline hover:text-ink"
                  >
                    Resend verification email
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-signal py-3.5 text-sm font-semibold text-white shadow-md shadow-signal/20 hover:bg-signal-deep active:scale-95 transition-all disabled:opacity-60"
            >
              {loading
                ? (mode === 'magic-link' ? 'Sending login link…' : 'Signing in…')
                : mode === 'magic-link'
                  ? 'Send Login Confirmation Link'
                  : pendingProject
                    ? 'Sign In & Save Project'
                    : 'Sign in to Dashboard'}
            </button>
          </form>
        )}

        <div className="mt-8 border-t border-ink/10 pt-6 text-center text-xs text-muted-light">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-signal hover:underline">
            Register now
          </Link>
        </div>
      </Reveal>
    </div>
  );
}

