import { useState } from 'react';
import client from '../api/client';
import PageHeader from '../components/common/PageHeader';
import WhatsAppButton from '../components/common/WhatsAppButton';
import BusinessContactCard from '../components/common/BusinessContactCard';
import BusinessMap from '../components/common/BusinessMap';
import { useCountry } from '../context/CountryContext';
import { validateContact, MAX_LENGTHS } from '../utils/validators';
import { COUNTRIES } from '../utils/countries';
import FieldError, { fieldClass } from '../components/common/FieldError';
import Reveal from '../components/common/Reveal';
import { CheckMarkIcon } from '../components/common/Icon';

const SERVICES = [
  'Custom Website Development',
  'UI/UX Design',
  'WordPress Development',
  'Wix Development',
  'Graphic Design',
];

const initialForm = {
  name: '', email: '', whatsapp: '', country: '', service: SERVICES[0],
  budget: '', description: '', referenceWebsite: '', preferredDeadline: '',
};

export default function Contact() {
  const { country: siteCountry } = useCountry();
  const [form, setForm] = useState(() => ({
    ...initialForm,
    country: siteCountry && siteCountry !== 'International' && COUNTRIES.includes(siteCountry)
      ? siteCountry
      : '',
  }));
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const googleFormUrl = import.meta.env.VITE_GOOGLE_FORM_URL;

  const handleChange = (e) => {
    const next = { ...form, [e.target.name]: e.target.value };
    setForm(next);
    if (touched[e.target.name]) setErrors(validateContact(next));
  };

  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
    setErrors(validateContact(form));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const fieldErrors = validateContact(form);
    setErrors(fieldErrors);
    setTouched({
      name: true, email: true, whatsapp: true, country: true, service: true,
      budget: true, description: true, referenceWebsite: true, preferredDeadline: true,
    });
    if (Object.keys(fieldErrors).length > 0) return;

    setLoading(true);
    try {
      await client.post('/inquiries', form);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
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
    className: `${fieldClass(touched[name] && errors[name])} bg-white/80 dark:bg-white/5 focus:bg-white dark:focus:bg-white/10 text-ink placeholder:text-muted-light rounded-xl`,
    ...props,
  });

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <Reveal className="rounded-3xl glass-card p-10 sm:p-14 shadow-xl border border-signal/20">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 mb-6">
            <CheckMarkIcon className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Inquiry Successfully Received!
          </h1>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted-light">
            Thank you for reaching out. We will review your project brief and follow up via WhatsApp or email with a detailed timeline.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            {googleFormUrl && (
              <a
                href={googleFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-ink/20 px-6 py-3 text-sm font-semibold text-ink hover:bg-black/5 transition-colors"
              >
                Complete Detailed Brief
              </a>
            )}
            <WhatsAppButton service={form.service} country={form.country} className="bg-signal text-white hover:bg-signal-deep shadow-md" />
          </div>
        </Reveal>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-24">
      <PageHeader
        badge="Contact Us"
        title="Let's build your next"
        gradientWord="digital product"
        description="Share details about your requirements, timeline, or preferred technologies. We provide honest estimates within 24 hours."
      />

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        {/* Form Container */}
        <Reveal className="rounded-3xl glass-card p-6 sm:p-10 shadow-lg">
          <h2 className="font-display text-xl font-bold text-ink mb-6">
            Project Inquiry Form
          </h2>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <input placeholder="Full Name *" maxLength={MAX_LENGTHS.name} {...field('name')} />
                {touched.name && <FieldError>{errors.name}</FieldError>}
              </div>
              <div>
                <input type="email" placeholder="Email Address *" maxLength={MAX_LENGTHS.email} {...field('email')} />
                {touched.email && <FieldError>{errors.email}</FieldError>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <input placeholder="WhatsApp Number *" maxLength={MAX_LENGTHS.whatsapp} {...field('whatsapp')} />
                {touched.whatsapp && <FieldError>{errors.whatsapp}</FieldError>}
              </div>
              <div>
                <select
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={Boolean(touched.country && errors.country)}
                  className={`${fieldClass(touched.country && errors.country)} bg-white/80 dark:bg-white/5 text-ink`}
                  style={form.country ? undefined : { color: '#8a8a8a' }}
                >
                  <option value="" disabled hidden>Country *</option>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {touched.country && <FieldError>{errors.country}</FieldError>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <select {...field('service')}>
                  {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {touched.service && <FieldError>{errors.service}</FieldError>}
              </div>
              <div>
                <input
                  name="budget"
                  placeholder="Approximate Budget (optional)"
                  maxLength={MAX_LENGTHS.budget}
                  value={form.budget}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={Boolean(touched.budget && errors.budget)}
                  className={`${fieldClass(touched.budget && errors.budget)} bg-white/80 dark:bg-white/5 text-ink placeholder:text-muted-light`}
                />
                {touched.budget && <FieldError>{errors.budget}</FieldError>}
              </div>
            </div>

            <div>
              <textarea
                placeholder="Project Description — tell us about your goals, features, and target audience (at least 20 characters) *"
                rows={4}
                maxLength={MAX_LENGTHS.description}
                {...field('description')}
              />
              <div className="mt-1 flex items-center justify-between">
                {touched.description ? <FieldError>{errors.description}</FieldError> : <span />}
                <span className="text-[11px] text-muted-light">
                  {form.description.length}/{MAX_LENGTHS.description}
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <input placeholder="Reference Website (optional)" maxLength={MAX_LENGTHS.referenceWebsite} {...field('referenceWebsite')} />
                {touched.referenceWebsite && <FieldError>{errors.referenceWebsite}</FieldError>}
              </div>
              <div>
                <input type="date" title="Preferred Deadline" {...field('preferredDeadline')} />
                {touched.preferredDeadline && <FieldError>{errors.preferredDeadline}</FieldError>}
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-signal py-3.5 text-sm font-semibold text-white shadow-md shadow-signal/20 hover:bg-signal-deep active:scale-95 transition-all disabled:opacity-60"
            >
              {loading ? 'Sending Inquiry…' : 'Submit Project Inquiry'}
            </button>
          </form>
        </Reveal>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          <BusinessContactCard />
          <BusinessMap />
        </div>
      </div>
    </div>
  );
}
