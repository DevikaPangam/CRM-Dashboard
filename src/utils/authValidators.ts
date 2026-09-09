/**
 * Corporate Email & Domain Validation Utilities for Rajmudra Group
 */

export const CORPORATE_DOMAINS = ['rajmudragroup.com', 'corpbd.com'];
export const CORPORATE_DOMAIN = 'rajmudragroup.com';

export const BLOCKED_PUBLIC_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'ymail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'aol.com',
  'zoho.com',
  'proton.me',
  'protonmail.com',
  'mail.com',
  'gmx.com'
]);

/**
 * Validates whether an email belongs to an official corporate domain.
 */
export const isValidRajmudraEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  const cleanEmail = email.trim().toLowerCase();
  
  return CORPORATE_DOMAINS.some((domain) => cleanEmail.endsWith(`@${domain}`));
};

/**
 * Detailed validation check that returns a human-readable error message if invalid.
 */
export const validateCorporateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email || !email.trim()) {
    return { isValid: false, error: 'Corporate email is required.' };
  }

  const cleanEmail = email.trim().toLowerCase();
  const parts = cleanEmail.split('@');

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  const domain = parts[1];

  if (BLOCKED_PUBLIC_DOMAINS.has(domain)) {
    return {
      isValid: false,
      error: `Personal email domain (@${domain}) is prohibited. Please use your official corporate @${CORPORATE_DOMAIN} email.`
    };
  }

  if (!CORPORATE_DOMAINS.includes(domain)) {
    return {
      isValid: false,
      error: `Only corporate (@${CORPORATE_DOMAINS.join(', @')}) accounts are authorized for CRM access.`
    };
  }

  return { isValid: true };
};
