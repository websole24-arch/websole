import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Reveal from '../components/common/Reveal';
import { MailIcon } from '../components/common/Icon';

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative mx-auto max-w-md px-4 py-20 sm:py-28">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-signal/15 blur-3xl rounded-full pointer-events-none" />

      <Reveal className="relative z-10 rounded-3xl glass-card p-8 sm:p-10 shadow-2xl border border-white/80 dark:border-white/10">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#12141C] to-slate-800 text-white shadow-sm">
              <span className="font-display font-bold text-base text-white">W</span>
            </div>
            <span className="font-display text-2xl font-bold tracking-tight text-ink">
              Web_Sole<span className="text-signal">.</span>
            </span>
          </Link>

          <h1 className="mt-6 font-display text-2xl font-bold text-ink">
            Reset Password
          </h1>
          <p className="mt-1.5 text-xs text-muted-light">
            Enter your email and we'll send you a secure link to reset your password.
          </p>
        </div>

        {sent ? (
          <div className="mt-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <MailIcon className="h-5 w-5" />
            </div>
            <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200 p-4 text-xs text-emerald-900 leading-relaxed">
              <p className="font-semibold text-emerald-950">Password reset link sent!</p>
              <p className="mt-1">
                Check your inbox at <span className="font-mono font-medium">{email}</span> for instructions to reset your password.
              </p>
            </div>
            <p className="text-[11px] text-muted-light">
              Didn't receive the email? Check your spam folder or request a new one below.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSent(false)}
                className="text-xs font-semibold text-signal hover:underline"
              >
                Try another email
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-ink/70 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-ink/15 bg-white/80 dark:bg-white/5 text-ink placeholder:text-muted-light focus:outline-none focus:ring-2 focus:ring-signal/30 text-sm"
              />
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
              {loading ? 'Sending link…' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="mt-8 border-t border-ink/10 pt-6 text-center text-xs text-muted-light">
          Remember your password?{' '}
          <Link to="/login" className="font-semibold text-signal hover:underline">
            Back to login
          </Link>
        </div>
      </Reveal>
    </div>
  );
}