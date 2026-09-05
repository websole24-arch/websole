import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

// Supabase redirects here after someone clicks the confirmation link,
// appending the session as a URL fragment: #access_token=...&refresh_token=...
// (never a query string — fragments aren't sent to the server, so this
// has to run client-side). This page's only job is to hand those tokens
// to POST /auth/verify, which checks them against Supabase, marks the
// profile verified, and sets the real session cookies.
export default function VerifyCallback() {
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'error'
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // StrictMode double-invoke would burn the tokens twice
    ran.current = true;

    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const authError = params.get('error_description');

    if (authError || !accessToken || !refreshToken) {
      setStatus('error');
      return;
    }

    verifyEmail(accessToken, refreshToken)
      .then(async (user) => {
        // Mirrors Login.jsx's "there was a pending project selection,
        // create it now" step. This is the *first* point a brand-new
        // registrant actually has a session — register() deliberately
        // doesn't issue one (email confirmation is required first), so
        // this was the missing half of the flow: Pricing.jsx saves the
        // selection and Register.jsx's copy promises "this will register
        // the project", but nothing ever POSTed it for a new user before
        // this fix. See Pricing.jsx's startProject for why this lives in
        // localStorage rather than sessionStorage.
        if (user.role !== 'admin') {
          const stored = localStorage.getItem('pending_project_selection');
          if (stored) {
            try {
              const pendingProject = JSON.parse(stored);
              const { data } = await client.post('/projects', {
                service: pendingProject.serviceId,
                package: pendingProject.packageId,
                country: pendingProject.country,
              });
              localStorage.removeItem('pending_project_selection');
              navigate(`/dashboard?newProjectId=${data.project.id}`, { replace: true });
              return;
            } catch (projErr) {
              console.error('Could not auto-create pending project:', projErr);
              localStorage.removeItem('pending_project_selection');
            }
          }
        }

        navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
      })
      .catch(() => setStatus('error'));
  }, [verifyEmail, navigate]);

  return (
    <section className="mx-auto max-w-sm px-4 py-20 text-center">
      {status === 'verifying' ? (
        <p className="text-sm text-muted-light">Verifying your email…</p>
      ) : (
        <>
          <h1 className="font-display text-2xl">Verification link invalid</h1>
          <p className="mt-4 text-sm text-muted-light">
            This link is invalid or has expired. Try logging in to resend a new one.
          </p>
          <Link to="/login" className="mt-6 inline-block font-medium text-ink underline">
            Go to log in
          </Link>
        </>
      )}
    </section>
  );
}
