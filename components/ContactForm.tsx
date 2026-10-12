'use client';

import { useEffect, useRef, useState } from 'react';
import { COMPANY } from '@/lib/site';
import { formatPhone, sendLead, validPhone } from '@/lib/leads';

const TOPICS = [
  { value: 'recruiting', label: 'Recruiting' },
  { value: 'owner-operator', label: 'Owner-operator' },
  { value: 'accounting', label: 'Accounting' },
  { value: 'brokers', label: 'Brokers' },
];

type Field = 'name' | 'phone' | 'message' | 'submit';

export default function ContactForm() {
  const [v, setV] = useState({ topic: 'recruiting', name: '', phone: '', message: '' });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (done) doneRef.current?.focus(); }, [done]);

  const set = (k: keyof typeof v) => (val: string) => {
    setV((s) => ({ ...s, [k]: val }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e: Partial<Record<Field, string>> = {};
    if (v.name.trim().length < 2) e.name = 'Enter your name.';
    if (!validPhone(v.phone)) e.phone = 'Enter a 10-digit US phone number.';
    if (v.message.trim().length < 5) e.message = 'Write a short message.';
    setErrors(e);
    if (Object.keys(e).length) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setSending(true);
    try {
      await sendLead({
        form: 'contact',
        fields: { topic: v.topic, name: v.name.trim(), phone: v.phone, message: v.message.trim() },
        sms_consent: false,
        consent_page: location.href,
      });
      setDone(true);
    } catch {
      setErrors({ submit: `Message failed to send. Please call ${COMPANY.phone}.` });
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div ref={doneRef} className="success" tabIndex={-1}>
        <h3 className="h3">Thanks — <em>we&apos;ve got it.</em></h3>
        <p className="lede mt-s">The right department will reply within one business day. Need us sooner? Call {COMPANY.phone}, any hour.</p>
      </div>
    );
  }

  const err = (k: Field) => errors[k] ? <p className="err" role="alert">{errors[k]}</p> : null;

  return (
    <form ref={formRef} className="form form-plain" noValidate onSubmit={onSubmit}>
      <fieldset>
        <legend className="sr-only">Topic</legend>
        <div className="topic-tabs">
          {TOPICS.map((t) => (
            <label className="topic-tab" key={t.value}>
              <input type="radio" name="topic" value={t.value} checked={v.topic === t.value} onChange={() => set('topic')(t.value)} />
              <span>{t.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="two">
        <div className="field">
          <label htmlFor="c-name">Name</label>
          <input id="c-name" className="input" type="text" placeholder="John Smith" autoComplete="name" value={v.name} aria-invalid={!!errors.name} onChange={(e) => set('name')(e.target.value)} />
          {err('name')}
        </div>
        <div className="field">
          <label htmlFor="c-phone">Phone</label>
          <input id="c-phone" className="input" type="tel" placeholder="(555) 123-4567" inputMode="tel" autoComplete="tel-national" value={v.phone} aria-invalid={!!errors.phone} onChange={(e) => set('phone')(formatPhone(e.target.value))} />
          {err('phone')}
        </div>
      </div>
      <div className="field">
        <label htmlFor="c-msg">Message</label>
        <textarea id="c-msg" className="input" rows={5} placeholder="Tell us what you need — pay, equipment, a settlement or a load." value={v.message} aria-invalid={!!errors.message} onChange={(e) => set('message')(e.target.value)} />
        {err('message')}
      </div>
      {err('submit')}
      <div className="form-actions">
        <button className="btn" type="submit" disabled={sending}>
          {sending ? 'Sending…' : <>Send message <span className="arr" aria-hidden="true">→</span></>}
        </button>
      </div>
    </form>
  );
}
