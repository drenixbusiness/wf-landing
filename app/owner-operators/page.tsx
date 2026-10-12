import Link from 'next/link';
import type { Metadata } from 'next';
import { COMPANY } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Owner-Operators — Keep 88% of Gross | Wildfire Express',
  description: 'Lease on with Wildfire Express: keep 88% of gross, settled every week, fuel card on day one, no forced dispatch and trailer interchange on 53′ dry van OTR freight.',
  alternates: { canonical: '/owner-operators' },
};

const WEEK = [
  { n: 'Sat', t: 'Week closes', d: 'Your settlement week runs Saturday to Saturday. At close you receive a detailed statement of every load, fuel purchase and deduction.' },
  { n: 'Sun–Thu', t: 'Review window', d: 'Confirm the statement or flag a line. Accounting corrects discrepancies before payout, usually the same day you call.' },
  { n: 'Fri', t: 'Direct deposit', d: 'Payment lands in your account the following Friday. No held-back weeks and no surprise reserves.' },
];

const PERKS = [
  { t: '88% of gross', d: 'The percentage is the percentage. No fuel surcharge games.' },
  { t: 'Fuel card, day one', d: 'Fleet discount averaging 30–50¢ per gallon from your first load.' },
  { t: 'No forced dispatch', d: 'You decide which loads you run. Freight is pre-booked and no-touch.' },
  { t: 'Trailer interchange', d: 'Pull our 53′ dry vans without owning a trailer.' },
  { t: 'Secure parking', d: 'Central U.S. yard plus a partner network for out-of-region drivers, at no extra fee.' },
  { t: 'Seasonal bonuses', d: 'Sign-on, referral and clean-inspection bonuses. Ask recruiting for the current offer.' },
];

export default function Page() {
  return (
    <>
      <section className="scene page-hero" data-shot="hero" aria-labelledby="oo-title">
        <div className="container container--wide">
          <div className="hero-copy reveal">
            <p className="kicker kicker--line">Owner-operator program</p>
            <h1 id="oo-title" className="h1">Keep 88%. <em>Keep the keys.</em></h1>
            <p className="lede">Your truck, our freight and our dispatch. You keep 88% of gross, settled every week, with no forced dispatch.</p>
            <div className="btn-row">
              <Link className="btn" href="/apply?role=owner">Apply as owner-operator <span className="arr" aria-hidden="true">→</span></Link>
              <a className="btn btn--ghost" href={`tel:${COMPANY.tel}`}>Call recruiting</a>
            </div>
          </div>
        </div>
      </section>

      <section className="scene backdrop" data-shot="top" aria-labelledby="week-title">
        <div className="container">
          <div className="split-head reveal">
            <h2 id="week-title" className="display-2">How a week <em>settles.</em></h2>
            <p className="justify">The review window is the whole point. You see every line before money moves, and accounting fixes anything that looks off before Friday.</p>
          </div>
          <div className="week reveal">
            {WEEK.map((w) => (
              <div key={w.t}>
                <span className="week-n" aria-hidden="true">{w.n}</span>
                <h3>{w.t}</h3>
                <p>{w.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="scene" data-shot="side2Close" aria-labelledby="perks-title">
        <div className="container">
          <h2 id="perks-title" className="principles-title reveal">What comes <em>with the load.</em></h2>
          <div className="perk-grid" data-stagger="">
            {PERKS.map((p, i) => (
              <div className="perk reveal" key={p.t}>
                <span className="perk-i">{String(i + 1).padStart(2, '0')}</span>
                <h3>{p.t}</h3>
                <p>{p.d}</p>
              </div>
            ))}
          </div>
          <div className="req-bar reveal">
            <p>Requirements: <em>Class A CDL</em> and <em>2 years recent OTR</em> in a sleeper.</p>
            <Link className="btn" href="/apply?role=owner">Start application <span className="arr" aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>
    </>
  );
}
