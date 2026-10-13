// Shared between the forms (client) and /api/lead (server).

export const SMS_CONSENT = {
  application:
    'Yes, I agree to receive recurring automated text messages from Wildfire Express LLC at the mobile number provided about my driver application, interview scheduling, onboarding and job-related updates. Agreeing is required to apply online; it is not a condition of employment — you can also apply by phone at +1 (513) 206-5093. Message frequency varies. Message & data rates may apply. Reply HELP for help or STOP to opt out at any time. See our Privacy Policy and SMS Terms.',
  contact:
    'Yes, I agree to receive text messages from Wildfire Express LLC at the phone number provided in reply to this inquiry, including recruiting and customer-care follow-ups. Consent is not a condition of any purchase or employment. Message frequency varies. Message & data rates may apply. Reply HELP for help or STOP to opt out. See our Privacy Policy and SMS Terms.',
} as const;

export type LeadKind = keyof typeof SMS_CONSENT;

export interface LeadPayload {
  form: LeadKind;
  fields: Record<string, string>;
  sms_consent: boolean;
  consent_page: string;
}

export const digits = (v: string) => v.replace(/\D/g, '');

export function normalizePhone(v: string) {
  let d = digits(v);
  if (d.length === 11 && d[0] === '1') d = d.slice(1);
  return d;
}

export const validPhone = (v: string) => /^[2-9]\d{9}$/.test(normalizePhone(v));
export const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

export function formatPhone(v: string) {
  const d = normalizePhone(v).slice(0, 10);
  if (d.length > 6) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length > 3) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return d;
}

export async function sendLead(payload: LeadPayload) {
  const res = await fetch('/api/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
