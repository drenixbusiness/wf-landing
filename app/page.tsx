import Link from 'next/link';
import type { Metadata } from 'next';
import { COMPANY } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Wildfire Express',
  description: 'Wildfire Express LLC (USDOT 3498707, MC 1154036) is hiring CDL-A company drivers, owner-operators and lease partners for 53′ dry van OTR freight across the lower 48 states.',
  alternates: { canonical: '/' },
};

const STATS = [
  { v: 94, suffix: '%', label: 'On-time delivery' },
  { v: 98, suffix: '%', label: 'Driver retention' },
  { v: 300, suffix: '+', label: 'Broker network' },
  { v: 2.2, prefix: '$', suffix: '+', decimals: 2, label: 'Per-mile average' },
];

const LANES = [
  {
    href: '/owner-operators', roman: 'I.', title: 'Owner Operator', fig: '88%', cap: 'Of gross, settled weekly',
    text: 'Run your own business on our freight. Fuel card on day one, no forced dispatch, and a statement you review before payday.',
    go: 'The program',
  },
  {
    href: '/company-drivers', roman: 'II.', title: 'Company Driver', fig: '$0.70', cap: 'Up to, per mile', featured: true,
    text: 'Drive our equipment on pre-booked OTR dry van freight. Consistent miles, home time as promised, and pay stubs that make sense.',
    go: 'See the offer',
  },
  {
    href: '/careers#partner', roman: 'III.', title: 'Lease Partner', fig: '24/7', cap: 'Live dispatch behind you',
    text: 'Lease onto our operation with the same dispatch, the same settlement window, and accounting that fixes a discrepancy the same day.',
    go: 'See the role',
  },
];

const QUOTES = [
  { q: 'Miles are consistent, home time is what they told me, and nobody’s playing games with the fuel surcharge.', name: 'Marcus Calhoun', role: 'Owner Operator · Texas' },
  { q: 'Had a blowout on I-40 around midnight. Called dispatch, guy picked up on the second ring. No attitude, just “we got you.”', name: 'Devontae Reyes', role: 'Company Driver · Georgia' },
  { q: 'The pay stubs actually make sense. I called in once about a discrepancy and it was fixed by end of day.', name: 'Aziz Khasanov', role: 'Lease Partner · Illinois' },
];

const FAQ = [
  { q: 'What CDL do I need?', a: 'A valid Class A CDL. Hazmat and tanker endorsements are not required for our dry van freight.' },
  { q: 'How much experience do you require?', a: 'At least 12 months of verifiable tractor-trailer experience in the last three years, a safe MVR, and the ability to pass a DOT drug screen and physical.' },
  { q: 'How often do you pay?', a: 'Weekly. The week closes Saturday, settlement is prepared Sunday–Thursday, and direct deposit lands every Friday.' },
  { q: 'Do you offer fuel cards or sign-on bonuses?', a: 'Owner-operators and lease partners get a fleet fuel card with discounts at major truck-stop networks from day one. Bonuses vary by lane and season — ask your recruiter what is running now.' },
  { q: 'Where do I park between loads?', a: 'Dispatch plans loads around safe parking on your lane, and your recruiter will go over home-time parking options for your area before you start.' },
];

export default function Page() {
  return (
    <>
      {/* Sticky hero: three chapters while the camera orbits hero → side → rear */}
      <section className="hero-scroll" aria-label="Introduction">
        <div className="hero-markers" aria-hidden="true">
          <div data-shot="hero" />
          <div data-shot="side" />
          <div data-shot="rear" />
        </div>
        <div className="hero-sticky">
          <div className="chapter">
            <div className="container container--wide">
              <div className="inner">
                <p className="kicker kicker--line">Now hiring · CDL-A · 48 states</p>
                <h1 className="h1">Run the roads that pay <em>like fire.</em></h1>
                <p className="lede">A dry van OTR carrier built around the people behind the wheel. Pre-booked freight, settlements you can read, and a dispatch team that picks up at 2 a.m.</p>
                <div className="btn-row">
                  <Link className="btn" href="/apply">Apply in 90 seconds <span className="arr" aria-hidden="true">→</span></Link>
                  <Link className="btn btn--ghost" href="/services">See what we haul</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="chapter" aria-hidden="true">
            <div className="container container--wide">
              <div className="inner">
                <span className="outline-num">88%</span>
                <h2 className="h3">of the gross goes to the <em>owner-operator.</em></h2>
                <p className="lede">No forced dispatch, no hidden fees, settlement statements you can actually read.</p>
                <div className="btn-row"><Link className="btn" href="/owner-operators">How the 88% works <span className="arr" aria-hidden="true">→</span></Link></div>
              </div>
            </div>
          </div>
          <div className="chapter" aria-hidden="true">
            <div className="container container--wide">
              <div className="inner">
                <p className="kicker kicker--line">24/7 dispatch</p>
                <h2 className="h2">Dispatch that answers at <em>2 a.m.</em></h2>
                <p className="lede">A breakdown in Wyoming or a detention fight in Georgia — a person picks up, not a phone tree.</p>
                <div className="btn-row"><a className="btn" href={`tel:${COMPANY.tel}`}>Call dispatch <span className="arr" aria-hidden="true">→</span></a></div>
              </div>
            </div>
          </div>
          <div className="hero-progress" aria-hidden="true"><i /></div>
          <div className="hero-dots" aria-hidden="true"><span className="is-on" /><span /><span /></div>
        </div>
      </section>

      <section className="scene backdrop" data-shot="top" aria-labelledby="numbers-title">
        <div className="container">
          <div className="split-head reveal">
            <h2 id="numbers-title" className="display-2">By the <em>numbers.</em></h2>
            <p>A small company doesn&apos;t mean small results. These are the figures we run on, and the ones we hold ourselves to every week.</p>
          </div>
          <div className="stat-row reveal">
            {STATS.map((s, i) => (
              <div key={s.label}>
                <span className="i">{String(i + 1).padStart(2, '0')}</span>
                <span className="v" data-count={s.v} data-prefix={s.prefix} data-suffix={s.suffix} data-decimals={s.decimals}>
                  {(s.prefix ?? '') + s.v.toFixed(s.decimals ?? 0) + s.suffix}
                </span>
                <span className="l">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="scene network" data-shot="map" aria-labelledby="map-title">
        <div className="container">
          <div className="reveal">
            <p className="kicker">The network</p>
            <h2 id="map-title" className="display-2">Forty-eight states.<br /><em>One dispatch board.</em></h2>
            <p className="lede">Freight is booked before you roll, across the lower 48. Every light is a truck on the interstate, and every point is a city we deliver to.</p>
          </div>
        </div>
      </section>

      <section className="scene" data-shot="mapLow" aria-labelledby="lanes-title">
        <div className="container">
          <div className="lanes-head reveal">
            <h2 id="lanes-title" className="display-2">Pick your <em>lane.</em></h2>
            <Link className="text-link" href="/careers">All positions →</Link>
          </div>
          <div className="lane-cards" data-stagger="">
            {LANES.map((l) => (
              <Link key={l.title} href={l.href} className={`lane reveal${l.featured ? ' lane--featured' : ''}`}>
                <span className="roman">{l.roman}</span>
                <h3>{l.title}</h3>
                <span className="fig">{l.fig}</span>
                <span className="cap">{l.cap}</span>
                <p>{l.text}</p>
                <span className="go">{l.go} →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="scene backdrop" data-shot="wheel" aria-labelledby="voices-title">
        <div className="container">
          <div className="split-head reveal">
            <h2 id="voices-title" className="display-2">In their own <em>words.</em></h2>
            <p>We don&apos;t pay for reviews and we don&apos;t script them. This is what drivers running with us have shared.</p>
          </div>
          <div className="quotes reveal">
            {QUOTES.map((t) => (
              <figure key={t.name}>
                <blockquote>{t.q}</blockquote>
                <figcaption><b>{t.name}</b><span>{t.role}</span></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="scene" data-shot="side2" aria-labelledby="faq-title">
        <div className="container">
          <div className="faq-split">
            <div className="reveal">
              <p className="kicker">Got questions</p>
              <h2 id="faq-title" className="display-2">Straight <em>answers.</em></h2>
              <p>Don&apos;t see yours? Call recruiting. Somebody picks up.</p>
              <div className="btn-row"><a className="btn" href={`tel:${COMPANY.tel}`}>Talk to recruiting <span className="arr" aria-hidden="true">→</span></a></div>
            </div>
            <div className="faq reveal">
              {FAQ.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <div>{f.a}</div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
