import { NextResponse } from 'next/server';
import { SMS_CONSENT, normalizePhone, validEmail, validPhone, type LeadPayload } from '@/lib/leads';
import { sendToTelegram, telegramConfigured } from '@/lib/telegram';

// Receives applications and contact messages and posts them to the Telegram group
// (TG_BOT_TOKEN + TG_GROUP_ID). Optionally also set LEAD_WEBHOOK_URL (Zapier, Make, an ATS…)
// to forward each lead as JSON; with neither, leads are only written to the server log.
// Every lead carries its SMS consent record (exact wording, timestamp, page, IP, user agent) —
// keep it: it is your proof of opt-in for A2P 10DLC / TCPA.

const MAX_FIELD = 4000;

export async function POST(req: Request) {
  let body: LeadPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const kind = body?.form;
  if (kind !== 'application' && kind !== 'contact') {
    return NextResponse.json({ ok: false, error: 'Unknown form' }, { status: 400 });
  }
  const fields: Record<string, string> = {};
  for (const [k, v] of Object.entries(body.fields ?? {})) {
    if (typeof v === 'string') fields[k.slice(0, 64)] = v.trim().slice(0, MAX_FIELD);
  }

  const phone = fields.phone ?? '';
  const email = fields.email ?? '';
  const errors: string[] = [];
  if (kind === 'application') {
    for (const f of ['role', 'cdl_a', 'experience', 'home_state', 'first_name']) if (!fields[f]) errors.push(`${f} is required`);
    if (!validPhone(phone)) errors.push('phone is invalid');
  } else {
    if (!fields.name) errors.push('name is required');
    if (!fields.message) errors.push('message is required');
    if (!phone && !email) errors.push('phone or email is required');
    if (phone && !validPhone(phone)) errors.push('phone is invalid');
  }
  if (email && !validEmail(email)) errors.push('email is invalid');
  if (errors.length) return NextResponse.json({ ok: false, errors }, { status: 422 });

  const smsConsent = body.sms_consent === true && !!phone;
  const lead = {
    form: kind,
    received_at: new Date().toISOString(),
    ...fields,
    phone_e164: phone ? `+1${normalizePhone(phone)}` : '',
    consent: {
      // Recorded only when the box was checked. sms_consent=false means: never text this number from any automation.
      sms_consent: smsConsent,
      // the server-side copy of the wording is the source of truth, not what the client sent
      sms_consent_text: smsConsent ? SMS_CONSENT[kind] : '',
      consent_timestamp: smsConsent ? new Date().toISOString() : '', // UTC
      consent_page: smsConsent ? String(body.consent_page ?? '').slice(0, 500) : '',
      ip: smsConsent ? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '' : '',
      user_agent: smsConsent ? req.headers.get('user-agent') ?? '' : '',
      mobile_number: smsConsent ? `+1${normalizePhone(phone)}` : '',
    },
  };

  // Deliver to every configured destination; the lead counts as received if at least one accepts it.
  const hook = process.env.LEAD_WEBHOOK_URL;
  const targets: Promise<unknown>[] = [];
  if (telegramConfigured()) targets.push(sendToTelegram(lead));
  if (hook) {
    targets.push(fetch(hook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) })
      .then((r) => { if (!r.ok) throw new Error(`webhook ${r.status}`); }));
  }
  if (!targets.length) {
    console.info('[lead]', JSON.stringify(lead));
    return NextResponse.json({ ok: true });
  }
  const results = await Promise.allSettled(targets);
  results.forEach((r) => { if (r.status === 'rejected') console.error('[lead] delivery failed', r.reason); });
  if (!results.some((r) => r.status === 'fulfilled')) {
    console.error('[lead] undelivered', JSON.stringify(lead));
    return NextResponse.json({ ok: false, error: 'Could not deliver' }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
