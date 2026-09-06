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

// Character caps. Mirror the server's express-validator `isLength` rules
// (server/src/validators/authValidators.js, inquiryValidators.js) so a
// field never lets the user type more than the API will accept. Used both
// as the `maxLength` attribute on inputs and for the belt-and-suspenders
// check below (covers paste/autofill edge cases the attribute might miss).
export const MAX_LENGTHS = {
  name: 100,
  email: 254,
  password: 72, // Supabase Auth (GoTrue) truncates/rejects beyond this
  phone: 20,
  companyName: 100,
  whatsapp: 30,
  country: 100,
  budget: 100,
  description: 5000,
  referenceWebsite: 500,
};

export const isValidEmail = (value) => EMAIL_RE.test(String(value).trim());
export const isValidPhone = (value) => PHONE_RE.test(String(value).trim());

const tooLong = (value, field) => String(value ?? '').length > MAX_LENGTHS[field];

export function validateLogin(form) {
  const errors = {};
  if (!form.email?.trim()) errors.email = 'Email is required';
  else if (!isValidEmail(form.email)) errors.email = 'Enter a valid email address';
  else if (tooLong(form.email, 'email')) errors.email = `Email must be ${MAX_LENGTHS.email} characters or fewer`;

  if (!form.password) errors.password = 'Password is required';
  else if (tooLong(form.password, 'password')) errors.password = `Password must be ${MAX_LENGTHS.password} characters or fewer`;

  return errors;
}

export function validateRegister(form) {
  const errors = {};

  if (!form.name?.trim()) errors.name = 'Full name is required';
  else if (form.name.trim().length < 2) errors.name = 'Name looks too short';
  else if (tooLong(form.name, 'name')) errors.name = `Name must be ${MAX_LENGTHS.name} characters or fewer`;

  if (!form.email?.trim()) errors.email = 'Email is required';
  else if (!isValidEmail(form.email)) errors.email = 'Enter a valid email address';
  else if (tooLong(form.email, 'email')) errors.email = `Email must be ${MAX_LENGTHS.email} characters or fewer`;

  if (!form.password) errors.password = 'Password is required';
  else if (form.password.length < 8) errors.password = 'Password must be at least 8 characters';
  else if (!/\d/.test(form.password)) errors.password = 'Password must contain a number';
  else if (tooLong(form.password, 'password')) errors.password = `Password must be ${MAX_LENGTHS.password} characters or fewer`;

  if (!form.phone?.trim()) errors.phone = 'Phone / WhatsApp number is required';
  else if (!isValidPhone(form.phone)) errors.phone = 'Enter a valid phone number';

  if (!form.country?.trim()) errors.country = 'Please select a country';

  if (form.companyName && tooLong(form.companyName, 'companyName')) {
    errors.companyName = `Company name must be ${MAX_LENGTHS.companyName} characters or fewer`;
  }

  return errors;
}

export function validateContact(form) {
  const errors = {};

  if (!form.name?.trim()) errors.name = 'Full name is required';
  else if (tooLong(form.name, 'name')) errors.name = `Name must be ${MAX_LENGTHS.name} characters or fewer`;

  if (!form.email?.trim()) errors.email = 'Email is required';
  else if (!isValidEmail(form.email)) errors.email = 'Enter a valid email address';
  else if (tooLong(form.email, 'email')) errors.email = `Email must be ${MAX_LENGTHS.email} characters or fewer`;

  if (!form.whatsapp?.trim()) errors.whatsapp = 'WhatsApp number is required';
  else if (!isValidPhone(form.whatsapp)) errors.whatsapp = 'Enter a valid phone number';

  if (!form.country?.trim()) errors.country = 'Please select a country';

  if (!form.service?.trim()) errors.service = 'Please select a service';

  if (form.budget && tooLong(form.budget, 'budget')) {
    errors.budget = `Budget must be ${MAX_LENGTHS.budget} characters or fewer`;
  }

  if (!form.description?.trim()) errors.description = 'Please describe your project';
  else if (form.description.trim().length < 20) {
    errors.description = 'A few more details would help (at least 20 characters)';
  } else if (tooLong(form.description, 'description')) {
    errors.description = `Description must be ${MAX_LENGTHS.description} characters or fewer`;
  }

  if (form.referenceWebsite) {
    if (tooLong(form.referenceWebsite, 'referenceWebsite')) {
      errors.referenceWebsite = `URL must be ${MAX_LENGTHS.referenceWebsite} characters or fewer`;
    } else {
      try {
        // eslint-disable-next-line no-new
        new URL(form.referenceWebsite);
      } catch {
        errors.referenceWebsite = 'Enter a full URL, e.g. https://example.com';
      }
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
