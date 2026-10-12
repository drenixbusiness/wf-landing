// Server-only: posts each lead to the Telegram group (TG_BOT_TOKEN, TG_GROUP_ID in .env).
import 'server-only';

const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const ROLE: Record<string, string> = { owner: 'Owner Operator', company: 'Company Driver', partner: 'Lease Partner' };
const EXPERIENCE: Record<string, string> = { '<2': 'Under 2 yrs', '2-5': '2–5 yrs', '5-10': '5–10 yrs', '10+': '10+ yrs' };
const TOPIC: Record<string, string> = { recruiting: 'Recruiting', 'owner-operator': 'Owner-operator', accounting: 'Accounting', brokers: 'Brokers' };

export interface TgLead {
  form: 'application' | 'contact';
  received_at: string;
  phone_e164: string;
  consent: { sms_consent: boolean; consent_page: string; ip: string };
  [k: string]: unknown;
}

function format(l: TgLead) {
  const row = (label: string, value: unknown) => (value ? `<b>${label}:</b> ${esc(value)}` : '');
  const phone = l.phone_e164 ? `<b>Phone:</b> <a href="tel:${esc(l.phone_e164)}">${esc(l.phone)}</a>` : '';
  const time = new Date(l.received_at).toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' });
  const lines = l.form === 'application'
    ? [
        '🚛 <b>New driver application</b>',
        '',
        row('Name', [l.first_name, l.last_name].filter(Boolean).join(' ')),
        phone,
        row('Email', l.email),
        row('Lane', ROLE[String(l.role)] ?? l.role),
        row('CDL-A', l.cdl_a === 'yes' ? 'Yes' : 'Not yet'),
        row('OTR experience', EXPERIENCE[String(l.experience)] ?? l.experience),
        row('Home state', l.home_state),
      ]
    : [
        '✉️ <b>New contact message</b>',
        '',
        row('Topic', TOPIC[String(l.topic)] ?? l.topic),
        row('Name', l.name),
        phone,
        row('Email', l.email),
        '',
        `<b>Message:</b>\n${esc(l.message)}`,
      ];
  lines.push(
    '',
    row('SMS consent', l.consent.sms_consent ? 'Yes (opted in)' : 'No'),
    `<i>${esc(time)} ET · ${esc(l.consent.consent_page)}</i>`,
  );
  return lines.filter((x, i, a) => x !== '' || (a[i - 1] !== '' && i > 0)).join('\n').slice(0, 4000);
}

export const telegramConfigured = () => !!(process.env.TG_BOT_TOKEN && process.env.TG_GROUP_ID);

export async function sendToTelegram(lead: TgLead) {
  const res = await fetch(`https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: process.env.TG_GROUP_ID, text: format(lead), parse_mode: 'HTML', link_preview_options: { is_disabled: true } }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`telegram ${res.status}: ${(await res.text()).slice(0, 200)}`);
}
