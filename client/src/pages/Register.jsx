import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCountry } from '../context/CountryContext';
import { validateRegister, MAX_LENGTHS } from '../utils/validators';
import { COUNTRIES } from '../utils/countries';
import FieldError, { fieldClass } from '../components/common/FieldError';
import Reveal from '../components/common/Reveal';
import { CloseIcon, MailIcon } from '../components/common/Icon';

const initialForm = { name: '', email: '', password: '', phone: '', country: '', companyName: '' };

export default function Register() {
  const { register } = useAuth();
  const { country: siteCountry } = useCountry();
  const [pendingProject, setPendingProject] = useState(null);

  // Only shown as a badge here — this account has no session yet (email
  // verification is required first), so the project itself can't be
  // created until VerifyCallback.jsx runs. See localStorage (not
  // sessionStorage) note in Pricing.jsx's startProject.
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

  const [form, setForm] = useState(() => ({
    ...initialForm,
    country: siteCountry && siteCountry !== 'International' && COUNTRIES.includes(siteCountry)
      ? siteCountry
      : '',
  }));
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);

  const handleChange = (e) => {
    const next = { ...form, [e.target.name]: e.target.value };
    setForm(next);
    if (touched[e.target.name]) setErrors(validateRegister(next));
  };

  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
    setErrors(validateRegister(form));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const fieldErrors = validateRegister(form);
    setErrors(fieldErrors);
    setTouched({ name: true, email: true, password: true, phone: true, country: true, companyName: true });
    if (Object.keys(fieldErrors).length > 0) return;

    setLoading(true);
    try {
      await register(form);
      setAwaitingVerification(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const field = (name, props = {}) => ({
    name,
    value: form[name],
    onChange: handleChange,
    onBlur: handleBlur,
    'aria-invalid': Boolean(touched[name] && errors[name]),
    className: `${fieldClass(touched[name] && errors[name])} bg-white/80 dark:bg-white/5 text-ink placeholder:text-muted-light rounded-xl`,
    ...props,
  });

  if (awaitingVerification) {
    return (
      <div className="relative mx-auto max-w-md px-4 py-24 text-center">
        <Reveal className="rounded-3xl glass-card p-10 sm:p-12 shadow-2xl border border-signal/20">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-signal-soft text-signal mb-6">
            <MailIcon className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink">
            Check your email inbox
          </h1>
          <p className="mt-3 text-sm text-muted-light leading-relaxed">
            We sent an activation link to <span className="font-semibold text-ink">{form.email}</span>.
            Please click the link to verify your email, then log in to view payment details & WhatsApp contact.
          </p>
          <Link
            to="/login"
            className="mt-8 inline-block rounded-xl bg-signal px-8 py-3 text-sm font-semibold text-white shadow-md hover:bg-signal-deep transition-all"
          >
            Proceed to Log In
          </Link>
        </Reveal>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-lg px-4 py-16 sm:py-24">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-signal/15 blur-3xl rounded-full pointer-events-none" />

      <Reveal className="relative z-10 rounded-3xl glass-card p-8 sm:p-10 shadow-2xl border border-white/80">
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
            Create your account
          </h1>
          <p className="mt-1.5 text-xs text-muted-light">
            Set up your client profile to start and track your project milestones
          </p>
        </div>

        {/* Selected Package Badge if coming from Pricing */}
        {pendingProject && (
          <div className="mt-6 rounded-2xl bg-signal-soft border border-signal/30 p-4 text-xs text-[#12141C]/90">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono font-bold uppercase text-signal">Selected Project</span>
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
            <p className="mt-1 font-semibold text-sm text-[#12141C]">
              {pendingProject.serviceName} <span className="font-normal text-[#5B5F63]">({pendingProject.packageName})</span>
            </p>
            <p className="mt-1 text-[11px] text-[#5B5F63]">
              Creating your account will register this project and open your 50% advance payment details on WhatsApp.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-ink/70 mb-1.5">
              Full Name *
            </label>
            <input placeholder="Alex Mercer" maxLength={MAX_LENGTHS.name} {...field('name')} />
            {touched.name && <FieldError>{errors.name}</FieldError>}
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-ink/70 mb-1.5">
              Email Address *
            </label>
            <input type="email" placeholder="alex@company.com" maxLength={MAX_LENGTHS.email} {...field('email')} />
            {touched.email && <FieldError>{errors.email}</FieldError>}
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-ink/70 mb-1.5">
              Password (min 8 chars, with a number) *
            </label>
            <input type="password" placeholder="••••••••" maxLength={MAX_LENGTHS.password} {...field('password')} />
            {touched.password && <FieldError>{errors.password}</FieldError>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-ink/70 mb-1.5">
                Phone / WhatsApp *
              </label>
              <input placeholder="+1 (555) 000-0000" maxLength={MAX_LENGTHS.phone} {...field('phone')} />
              {touched.phone && <FieldError>{errors.phone}</FieldError>}
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-ink/70 mb-1.5">
                Country *
              </label>
              <select
                name="country"
                value={form.country}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={Boolean(touched.country && errors.country)}
                className={`${fieldClass(touched.country && errors.country)} bg-white/80 dark:bg-white/5 text-ink`}
                style={form.country ? undefined : { color: '#8a8a8a' }}
              >
                <option value="" disabled hidden>Select Country</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {touched.country && <FieldError>{errors.country}</FieldError>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-ink/70 mb-1.5">
              Company Name (Optional)
            </label>
            <input
              name="companyName"
              placeholder="Acme Corp"
              maxLength={MAX_LENGTHS.companyName}
              value={form.companyName}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(touched.companyName && errors.companyName)}
              className={`${fieldClass(touched.companyName && errors.companyName)} bg-white/80 dark:bg-white/5 text-ink placeholder:text-muted-light`}
            />
            {touched.companyName && <FieldError>{errors.companyName}</FieldError>}
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-signal py-3.5 text-sm font-semibold text-white shadow-md shadow-signal/20 hover:bg-signal-deep active:scale-95 transition-all disabled:opacity-60"
          >
            {loading ? 'Creating Account…' : pendingProject ? 'Create Account & Continue to Project' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 border-t border-ink/10 pt-6 text-center text-xs text-muted-light">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-signal hover:underline">
            Sign in
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
