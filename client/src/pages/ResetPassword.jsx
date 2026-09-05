import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Reveal from '../components/common/Reveal';
import { WarningIcon, CheckMarkIcon } from '../components/common/Icon';

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [tokens, setTokens] = useState({ access_token: '', refresh_token: '' });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [invalidLink, setInvalidLink] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const errorDesc = params.get('error_description');

    if (errorDesc || !accessToken) {
      setInvalidLink(true);
    } else {
      setTokens({ access_token: accessToken, refresh_token: refreshToken || '' });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!/\d/.test(password)) {
      setError('Password must contain at least one number.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        password,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset password. The link may have expired.');
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
              <span className="font-display font-bold text-base text-white">S</span>
            </div>
            <span className="font-display text-2xl font-bold tracking-tight text-ink">
              Studio<span className="text-signal">.</span>
            </span>
          </Link>

          <h1 className="mt-6 font-display text-2xl font-bold text-ink">
            Set New Password
          </h1>
          <p className="mt-1.5 text-xs text-muted-light">
            Choose a secure new password for your account.
          </p>
        </div>

        {invalidLink ? (
          <div className="mt-8 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
              <WarningIcon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-sm text-ink">Reset link expired or invalid</h3>
            <p className="text-xs text-muted-light leading-relaxed">
              This password reset link is invalid or has already been used. Please request a new link.
            </p>
            <div className="pt-2">
              <Link 
                to="/forgot-password"
                className="inline-block rounded-xl bg-signal px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-signal-deep transition-all"
              >
                Request New Link
              </Link>
            </div>
          </div>
        ) : success ? (
          <div className="mt-8 text-center space-y-4 animate-fade-in">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckMarkIcon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-sm text-emerald-950">Password updated!</h3>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Your password has been changed successfully. Redirecting you to your dashboard…
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-ink/70 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                placeholder="At least 8 characters with a number"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-ink/15 bg-white/80 dark:bg-white/5 text-ink placeholder:text-muted-light focus:outline-none focus:ring-2 focus:ring-signal/30 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-ink/70 mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? 'Updating password…' : 'Save New Password'}
            </button>
          </form>
        )}

        <div className="mt-8 border-t border-ink/10 pt-6 text-center text-xs text-muted-light">
          <Link to="/login" className="font-semibold text-signal hover:underline">
            Back to login
          </Link>
        </div>
      </Reveal>
    </div>
  );
}