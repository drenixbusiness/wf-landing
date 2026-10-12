import Link from 'next/link';
import type { Metadata } from 'next';
import { COMPANY } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Company Driver Offer — CDL-A OTR Dry Van | Wildfire Express',
  description: 'CDL-A company driver jobs at Wildfire Express: late-model Volvo VNL, up to $0.70 per mile, weekly pay, paid detention and layover, home time you plan, 24/7 dispatch.',
  alternates: { canonical: '/company-drivers' },
};

const PAY = [
  { v: '$0.70', l: 'Up to, per mile' },
  { v: '2,500+', l: 'Weekly miles, average' },
  { v: '$20', l: 'Detention per hour, after 2 hrs' },
  { v: 'Fri', l: 'Direct deposit, every week' },
];

const EXTRAS = [
  { t: 'Layover pay', d: '$100 for every day you are held over between loads. It shows up as its own line on your settlement.' },
  { t: 'Breakdown pay', d: '$100 per day while the truck is down, plus a hotel when the repair runs overnight.' },
  { t: 'Extra stops', d: '$25 for every stop after the first, paid on the same week the load delivers.' },
  { t: 'Paid orientation', d: 'Orientation is paid, with travel and lodging covered to get you there and into your truck.' },
  { t: 'Health & time off', d: 'Medical, dental and vision plan options after your eligibility period, and paid time off that grows with tenure.' },
  { t: 'Referral bonus', d: '$1,000 for every driver you refer who is hired and completes ninety days with us.' },
];

const HOME = [
  { n: '3/4', t: 'Classic OTR', d: 'Three weeks out, four days home. The most miles and the steadiest weekly settlement.' },
  { n: '2/3', t: 'Shorter runs', d: 'Two weeks out, three days home, with loads planned back toward your home state.' },
  { n: '∞', t: 'Your call', d: 'Tell us the dates that matter — a birthday, a game, a weekend — and dispatch routes you home for them.' },
];

const RIG = [
  ['Tractor', 'Volvo VNL, 2023 – 2025'],
  ['Transmission', 'Automated I-Shift'],
  ['Sleeper', 'Full sleeper, fridge, inverter, APU'],
  ['Trailer', '53′ dry van, air-ride'],
  ['Logging', 'FMCSA-registered ELD'],
  ['Maintenance', 'Scheduled PM, 24/7 roadside'],
];

export default function Page() {
  return (
    <>
      <section className="scene page-hero" data-shot="hero" data-drag="" aria-labelledby="offer-title">
        <div className="container container--wide">
          <div className="hero-copy reveal">
            <p className="kicker kicker--line">Company driver · CDL-A · OTR</p>
            <h1 id="offer-title" className="h1">Our truck. <em>Your miles.</em></h1>
            <p className="lede">A late-model Volvo, pre-booked dry van freight, pay every Friday and a dispatcher who plans around your home time. You drive — we handle the rest.</p>
            <div className="btn-row">
              <Link className="btn" href="/apply?role=company">Claim this offer <span className="arr" aria-hidden="true">→</span></Link>
              <a className="btn btn--ghost" href={`tel:${COMPANY.tel}`}>Talk to a recruiter</a>
            </div>
            <p className="drag-hint">Drag to walk around the rig</p>
          </div>
        </div>
      </section>

      <section className="scene backdrop" data-shot="wheel" aria-labelledby="pay-title">
        <div className="container">
          <div className="split-head reveal">
            <h2 id="pay-title" className="display-2">Every dollar, <em>on paper first.</em></h2>
            <p>Mileage, detention and accessorials are written into your offer letter before you roll — and itemized on every weekly settlement after.</p>
          </div>
          <div className="stat-row reveal">
            {PAY.map((p, i) => (
              <div key={p.l}>
                <span className="i">{String(i + 1).padStart(2, '0')}</span>
                <span className="v">{p.v}</span>
                <span className="l">{p.l}</span>
              </div>
            ))}
          </div>
          <p className="fine mt-m">Mileage pay ranges from $0.60 to $0.70 per mile based on verifiable experience. Your written offer letter states your exact rate and controls.</p>
        </div>
      </section>

      <section className="scene svc-list-section" data-shot="sideClose" aria-label="What else is paid">
        <div className="container">
          <div className="svc-list" data-stagger="">
            {EXTRAS.map((s, i) => (
              <div className="svc-row reveal" key={s.t}>
                <span className="svc-i">{String(i + 1).padStart(2, '0')}</span>
                <h2>{s.t}</h2>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="scene" data-shot="top" aria-labelledby="home-title">
        <div className="container">
          <h2 id="home-title" className="principles-title reveal">Home time, <em>your rhythm.</em></h2>
          <div className="principles">
            {HOME.map((h) => (
              <div className="principle reveal" key={h.t}>
                <span className="principle-n" aria-hidden="true">{h.n}</span>
                <h3>{h.t}</h3>
                <p>{h.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="scene" data-shot="side2" aria-labelledby="rig-title">
        <div className="container">
          <div className="faq-split">
            <div className="reveal">
              <p className="kicker">The rig</p>
              <h2 id="rig-title" className="display-2">What you&apos;ll <em>drive.</em></h2>
              <p>Assigned equipment, kept on a preventive-maintenance schedule — not a slip-seat fleet.</p>
              <div className="btn-row"><Link className="btn" href="/apply?role=company">Claim this offer <span className="arr" aria-hidden="true">→</span></Link></div>
            </div>
            <dl className="spec-rows reveal">
              {RIG.map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="compliance-band" aria-label="Requirements">
        <div className="container">
          <div className="compliance-cells">
            <div><b>License</b><span>Class A CDL</span></div>
            <div><b>Experience</b><span>12+ months verifiable</span></div>
            <div><b>Record</b><span>Clean MVR, 3 years</span></div>
            <div><b>Medical</b><span>DOT card &amp; drug screen</span></div>
          </div>
        </div>
      </section>
    </>
  );
}
