'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { COMPANY } from '@/lib/site';
import Select from '@/components/Select';
import { formatPhone, sendLead, validEmail, validPhone } from '@/lib/leads';

const ROLES = [
  { value: 'owner', title: 'Owner Operator', note: 'Your tractor · 88% of gross' },
  { value: 'company', title: 'Company Driver', note: 'Our equipment · up to $0.70 per mile' },
  { value: 'partner', title: 'Lease Partner', note: 'Lease onto our operation' },
];
const CDL = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'Not yet' },
];
const EXPERIENCE = [
  { value: '<2', label: 'Under 2 yrs' },
  { value: '2-5', label: '2–5 yrs' },
  { value: '5-10', label: '5–10 yrs' },
  { value: '10+', label: '10+ yrs' },
];
const STATES = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];
const STEPS = ['Lane', 'Experience', 'Contact'];

type Key = 'role' | 'cdl' | 'experience' | 'state' | 'name' | 'phone' | 'email' | 'submit';

export default function ApplyForm() {
  const [step, setStep] = useState(0);
  const [v, setV] = useState({ role: '', cdl: '', experience: '', state: '', name: '', phone: '', email: '' });
  const [sms, setSms] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  // ?role=owner|company|partner preselects the lane
  useEffect(() => {
    const role = new URLSearchParams(location.search).get('role');
    if (role && ROLES.some((r) => r.value === role)) setV((s) => ({ ...s, role }));
  }, []);

  useEffect(() => {
    if (!moved.current) { moved.current = true; return; }
    heading.current?.focus({ preventScroll: true });
    const top = (panel.current?.getBoundingClientRect().top ?? 0) + scrollY - 80;
    if (scrollY > top) scrollTo({ top, behavior: 'smooth' });
  }, [step, done]);

  const set = (k: keyof typeof v) => (val: string) => {
    setV((s) => ({ ...s, [k]: val }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  function validate(i: number) {
    const e: Partial<Record<Key, string>> = {};
    if (i === 0 && !v.role) e.role = 'Choose the lane you are applying for.';
    if (i === 1) {
      if (!v.cdl) e.cdl = 'Let us know about your CDL.';
      if (!v.experience) e.experience = 'Pick your recent OTR experience.';
      if (!v.state) e.state = 'Select your home state.';
    }
    if (i === 2) {
      if (v.name.trim().length < 2) e.name = 'Enter your full name.';
      if (!validPhone(v.phone)) e.phone = 'Enter a 10-digit US phone number.';
      if (v.email && !validEmail(v.email.trim())) e.email = 'Check the email address.';
    }
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>(`[data-field="${first}"] input, [data-field="${first}"] button`)?.focus());
    return !first;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate(step)) return;
    if (step < 2) { setStep(step + 1); return; }
    const [first, ...rest] = v.name.trim().split(/\s+/);
    setSending(true);
    try {
      await sendLead({
        form: 'application',
        fields: {
          role: v.role, cdl_a: v.cdl, experience: v.experience, home_state: v.state,
          first_name: first, last_name: rest.join(' '), phone: v.phone, email: v.email.trim(),
        },
        sms_consent: sms,
        consent_page: location.href,
      });
      setDone(true);
    } catch {
      setErrors({ submit: `Something went wrong sending your application. Please call us at ${COMPANY.phone}.` });
    } finally {
      setSending(false);
    }
  }

  const err = (k: Key) => errors[k] ? <p className="err" role="alert">{errors[k]}</p> : null;

  if (done) {
    return (
      <div ref={panel} className="apply-done">
        <p className="kicker">Application received</p>
        <h2 ref={heading} tabIndex={-1} className="apply-q">You&apos;re in line, <em>{v.name.trim().split(/\s+/)[0]}</em>.</h2>
        <span className="apply-clock" aria-hidden="true">15:00</span>
        <p className="apply-note">An HR specialist will call within 15 minutes during business hours, or first thing the next business morning. The call comes from {COMPANY.phone}.</p>
        <div className="apply-nav">
          <Link className="apply-back" href="/">← Home</Link>
          <a className="btn" href={`tel:${COMPANY.tel}`}>Call us now <span className="arr" aria-hidden="true">→</span></a>
        </div>
      </div>
    );
  }

  return (
    <div ref={panel}>
      <ol className="apply-steps" aria-label="Application progress">
        {STEPS.map((s, i) => (
          <li key={s} className={i <= step ? 'is-on' : undefined} aria-current={i === step ? 'step' : undefined}>
            {String(i + 1).padStart(2, '0')} {s}
          </li>
        ))}
      </ol>

      <form className="apply-form" noValidate onSubmit={onSubmit}>
        {step === 0 && (
          <fieldset data-field="role">
            <legend><h2 ref={heading} tabIndex={-1} className="apply-q">Which lane are you applying for?</h2></legend>
            <div className="lane-options">
              {ROLES.map((r) => (
                <label className="lane-option" key={r.value}>
                  <input type="radio" name="role" value={r.value} checked={v.role === r.value} onChange={() => set('role')(r.value)} />
                  <span className="lo-dot" aria-hidden="true" />
                  <span className="lo-text"><b>{r.title}</b><small>{r.note}</small></span>
                </label>
              ))}
            </div>
            {err('role')}
          </fieldset>
        )}

        {step === 1 && (
          <div>
            <h2 ref={heading} tabIndex={-1} className="apply-q">Your experience</h2>
            <fieldset data-field="cdl">
              <legend className="apply-label">Do you hold a Class A CDL?</legend>
              <div className="toggle-row toggle-row--2">
                {CDL.map((c) => (
                  <label className="toggle" key={c.value}>
                    <input type="radio" name="cdl" value={c.value} checked={v.cdl === c.value} onChange={() => set('cdl')(c.value)} />
                    <span>{c.label}</span>
                  </label>
                ))}
              </div>
              {err('cdl')}
              {v.cdl === 'no' && <p className="apply-hint">All driving positions require a Class A CDL. Apply anyway — we&apos;ll keep your details on file.</p>}
            </fieldset>
            <fieldset data-field="experience">
              <legend className="apply-label">Recent OTR experience</legend>
              <div className="toggle-row toggle-row--4">
                {EXPERIENCE.map((x) => (
                  <label className="toggle" key={x.value}>
                    <input type="radio" name="experience" value={x.value} checked={v.experience === x.value} onChange={() => set('experience')(x.value)} />
                    <span>{x.label}</span>
                  </label>
                ))}
              </div>
              {err('experience')}
            </fieldset>
            <div className="apply-field" data-field="state">
              <label className="apply-label" htmlFor="state">Home state</label>
              <Select id="state" value={v.state} options={STATES} placeholder="Select your state" invalid={!!errors.state} onChange={set('state')} />
              {err('state')}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 ref={heading} tabIndex={-1} className="apply-q">Where do we call you?</h2>
            <div className="apply-field" data-field="name">
              <label className="apply-label" htmlFor="name">Full name</label>
              <input id="name" className="apply-input" type="text" placeholder="John Smith" autoComplete="name" value={v.name} aria-invalid={!!errors.name} onChange={(e) => set('name')(e.target.value)} />
              {err('name')}
            </div>
            <div className="apply-field" data-field="phone">
              <label className="apply-label" htmlFor="phone">Phone</label>
              <input id="phone" className="apply-input" type="tel" placeholder="(555) 123-4567" inputMode="tel" autoComplete="tel-national" value={v.phone} aria-invalid={!!errors.phone} onChange={(e) => set('phone')(formatPhone(e.target.value))} />
              {err('phone')}
            </div>
            <div className="apply-field" data-field="email">
              <label className="apply-label" htmlFor="email">Email (optional)</label>
              <input id="email" className="apply-input" type="email" placeholder="you@example.com" inputMode="email" autoComplete="email" value={v.email} aria-invalid={!!errors.email} onChange={(e) => set('email')(e.target.value)} />
              {err('email')}
            </div>
            {/* optional, unchecked SMS opt-in (A2P 10DLC) — wording must match SMS_CONSENT.application */}
            <label className="apply-consent" data-sms-consent="">
              <input type="checkbox" name="sms_consent" checked={sms} onChange={(e) => setSms(e.target.checked)} />
              <span>
                Yes, I agree to receive recurring automated text messages from Wildfire Express LLC at the mobile number provided about my
                driver application, interview scheduling, onboarding and job-related updates. Consent is not a condition of employment or of
                submitting this application. Message frequency varies. Message &amp; data rates may apply. Reply HELP for help or STOP to opt
                out at any time. See our <Link href="/privacy" target="_blank">Privacy Policy</Link> and{' '}
                <Link href="/terms#sms" target="_blank">SMS Terms</Link>.
              </span>
            </label>
            <p className="apply-fine">By submitting you agree to our <Link href="/terms">Terms</Link> and acknowledge our <Link href="/privacy">Privacy Policy</Link>. A recruiter may call you about your application.</p>
            {err('submit')}
          </div>
        )}

        <div className="apply-nav">
          {step === 0
            ? <Link className="apply-back" href="/careers">← Back</Link>
            : <button className="apply-back" type="button" onClick={() => setStep(step - 1)}>← Back</button>}
          <button className="btn" type="submit" disabled={sending}>
            {step < 2 ? <>Continue <span className="arr" aria-hidden="true">→</span></> : sending ? 'Sending…' : <>Submit application <span className="arr" aria-hidden="true">→</span></>}
          </button>
        </div>
      </form>
    </div>
  );
}
