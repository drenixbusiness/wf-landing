import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Careers — CDL-A Driver Jobs | Wildfire Express',
  description: 'Pick your lane at Wildfire Express: owner-operator, company driver or lease partner. One 90-second application for CDL-A OTR dry van jobs across the lower 48.',
  alternates: { canonical: '/careers' },
};

const ROLES = [
  {
    id: 'owner', roman: 'I.', title: 'Owner Operator', fig: '88%', cap: 'Of gross, settled weekly',
    text: 'Run your own tractor on our pre-booked dry van freight. You keep 88% of gross, review every statement before payday, and decide which loads you take.',
    items: ['Class A CDL, any state · 2 years recent OTR', 'Fuel card day one, 30–50¢/gal average discount', 'Trailer interchange available', 'No forced dispatch, no-touch freight'],
    cta: { href: '/owner-operators', label: 'The full program' },
  },
  {
    id: 'company', roman: 'II.', title: 'Company Driver', fig: '$0.70', cap: 'Up to, per mile',
    text: 'Drive our equipment over the road across the lower 48. Consistent miles, home time as promised, and pay stubs you can actually read.',
    items: ['Class A CDL, any state · 2 years recent OTR', 'Weekly pay, direct deposit every Friday', 'Live dispatch 24/7', 'Secure parking at our central yard'],
    cta: { href: '/apply?role=company', label: 'Apply as company driver' },
  },
  {
    id: 'partner', roman: 'III.', title: 'Lease Partner', fig: '24/7', cap: 'Live dispatch behind you',
    text: 'Lease onto our operation and run with the same dispatch, the same Saturday review window and accounting that fixes a discrepancy the same day.',
    items: ['Class A CDL, any state · 2 years recent OTR', 'Weekly settlements, Saturday to Saturday', 'Seasonal sign-on and referral bonuses', 'Partner parking network, no extra fee'],
    cta: { href: '/apply?role=partner', label: 'Apply as lease partner' },
  },
];

const STEPS = [
  { t: 'Apply', d: 'Ninety seconds online: your lane, your experience, your number.' },
  { t: 'Call back', d: 'An HR specialist calls within 15 minutes during business hours.' },
  { t: 'Onboard', d: 'Documents, fuel card and dispatch introductions. No runaround.' },
  { t: 'Roll', d: 'Your first pre-booked load, with dispatch on the line 24/7.' },
];

function Role({ r }: { r: (typeof ROLES)[number] }) {
  return (
    <article id={r.id} className="role-row reveal">
      <div>
        <span className="rr-roman">{r.roman}</span>
        <h2 className="rr-title">{r.title}</h2>
        <span className="rr-fig">{r.fig}</span>
        <span className="rr-cap">{r.cap}</span>
      </div>
      <div>
        <p className="rr-text">{r.text}</p>
        <ul className="rr-list">
          {r.items.map((i) => <li key={i}>{i}</li>)}
        </ul>
        <Link className="btn" href={r.cta.href}>{r.cta.label} <span className="arr" aria-hidden="true">→</span></Link>
      </div>
    </article>
  );
}

export default function Page() {
  return (
    <>
      <section className="scene careers-hero" data-shot="road" aria-labelledby="careers-title">
        <div className="container">
          <div className="ch-grid reveal">
            <div>
              <p className="kicker kicker--line">Careers · Now hiring CDL-A</p>
              <h1 id="careers-title">Pick your <em>lane.</em></h1>
            </div>
            <div>
              <p className="lede">Three ways to run with Wildfire Express. One 90-second application, and HR calls you back within 15 minutes during business hours.</p>
              <div className="btn-row"><Link className="btn" href="/apply">Apply in 90 seconds <span className="arr" aria-hidden="true">→</span></Link></div>
            </div>
          </div>
        </div>
      </section>

      <section className="scene roles-section" data-shot="sideClose" aria-label="Owner operator and company driver">
        <div className="container">
          <Role r={ROLES[0]} />
          <Role r={ROLES[1]} />
        </div>
      </section>

      <section className="scene roles-section" data-shot="mapLow" aria-label="Lease partner">
        <div className="container">
          <Role r={ROLES[2]} />
        </div>
      </section>

      <section className="scene backdrop" data-shot="top" aria-labelledby="process-title">
        <div className="container">
          <h2 id="process-title" className="principles-title reveal">From application <em>to first load.</em></h2>
          <div className="week week--4 reveal">
            {STEPS.map((s, i) => (
              <div key={s.t}>
                <span className="week-n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
