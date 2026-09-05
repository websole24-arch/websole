// Small dependency-free validation helpers shared by Login, Register, and
// Contact. Each `validateX` function takes a form-state object and returns
// an errors object keyed by field name (empty object = valid). Rules here
// intentionally mirror the server-side express-validator rules
// (server/src/validators/authValidators.js, inquiryValidators.js) so a
// user rarely reaches a request that the API will reject anyway — the
// server still re-checks everything, this is purely a UX layer.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Loose international phone check: digits, spaces, +, -, () — not a strict
// E.164 validator, just enough to catch obviously-wrong input.
const PHONE_RE = /^[0-9+\-()\s]{7,20}$/;

export const isValidEmail = (value) => EMAIL_RE.test(String(value).trim());
export const isValidPhone = (value) => PHONE_RE.test(String(value).trim());

export function validateLogin(form) {
  const errors = {};
  if (!form.email?.trim()) errors.email = 'Email is required';
  else if (!isValidEmail(form.email)) errors.email = 'Enter a valid email address';

  if (!form.password) errors.password = 'Password is required';

  return errors;
}

export function validateRegister(form) {
  const errors = {};

  if (!form.name?.trim()) errors.name = 'Full name is required';
  else if (form.name.trim().length < 2) errors.name = 'Name looks too short';

  if (!form.email?.trim()) errors.email = 'Email is required';
  else if (!isValidEmail(form.email)) errors.email = 'Enter a valid email address';

  if (!form.password) errors.password = 'Password is required';
  else if (form.password.length < 8) errors.password = 'Password must be at least 8 characters';
  else if (!/\d/.test(form.password)) errors.password = 'Password must contain a number';

  if (form.phone && !isValidPhone(form.phone)) errors.phone = 'Enter a valid phone number';

  return errors;
}

export function validateContact(form) {
  const errors = {};

  if (!form.name?.trim()) errors.name = 'Full name is required';

  if (!form.email?.trim()) errors.email = 'Email is required';
  else if (!isValidEmail(form.email)) errors.email = 'Enter a valid email address';

  if (form.whatsapp && !isValidPhone(form.whatsapp)) errors.whatsapp = 'Enter a valid phone number';

  if (!form.service?.trim()) errors.service = 'Please select a service';

  if (!form.description?.trim()) errors.description = 'Please describe your project';
  else if (form.description.trim().length < 20) {
    errors.description = 'A few more details would help (at least 20 characters)';
  }

  if (form.referenceWebsite) {
    try {
      // eslint-disable-next-line no-new
      new URL(form.referenceWebsite);
    } catch {
      errors.referenceWebsite = 'Enter a full URL, e.g. https://example.com';
    }
  }

  if (form.preferredDeadline) {
    const chosen = new Date(form.preferredDeadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(chosen.getTime()) || chosen < today) {
      errors.preferredDeadline = 'Pick today or a future date';
    }
  }

  return errors;
}
