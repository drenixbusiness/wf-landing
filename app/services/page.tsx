import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Services — 53′ Dry Van OTR Freight | Wildfire Express',
  description: 'What Wildfire Express hauls: 53′ dry van OTR freight across the lower 48 — pre-booked loads, no-touch freight, weekly settlements, a fuel program and 24/7 live dispatch.',
  alternates: { canonical: '/services' },
};

const SERVICES = [
  { t: '53′ dry van OTR', d: 'Full truckload dry van freight over the road across the lower 48. Long-haul lanes planned for consistent miles and predictable home time.' },
  { t: 'Pre-booked freight', d: 'Loads are booked before you roll through a network of more than 300 brokers, so you aren’t sitting at a truck stop waiting for the next one.' },
  { t: 'No-touch freight', d: 'You drive; you don’t unload. Freight is no-touch, and there is no forced dispatch. You have a say in the loads you take.' },
  { t: 'Weekly settlements', d: 'Saturday-to-Saturday settlement weeks, a detailed statement to review, and direct deposit every Friday. Discrepancies are fixed before payout.' },
  { t: 'Fuel program', d: 'A fuel card on day one with a fleet discount averaging 30–50¢ per gallon. No personal cash at the pump.' },
  { t: '24/7 live dispatch', d: 'A dispatcher answers around the clock, with roadside help coordinated fast when a tire blows or a load changes.' },
];

const FLOW = [
  { k: 'Before you roll', t: 'Booked', d: 'Dispatch books the load and sends pickup, delivery and rate details.' },
  { k: 'Pickup', t: 'Dispatched', d: 'You confirm, roll to the shipper and hook a sealed, no-touch load.' },
  { k: 'In transit', t: 'On the road', d: 'ELD-tracked miles with a live dispatcher a call away, day or night.' },
  { k: 'Friday', t: 'Settled', d: 'Review your Saturday statement; direct deposit lands the next Friday.' },
];

export default function Page() {
  return (
    <>
      <section className="scene svc-hero" data-shot="road" aria-labelledby="services-title">
        <div className="container container--wide">
          <div className="cta-center reveal">
            <p className="kicker">Services</p>
            <h1 id="services-title">What we <em>haul.</em></h1>
            <p className="lede">53′ dry van, over the road, across the lower 48. Here is everything that comes with a load.</p>
          </div>
        </div>
      </section>

      <section className="scene svc-list-section" data-shot="sideClose" aria-label="Services">
        <div className="container">
          <div className="svc-list" data-stagger="">
            {SERVICES.map((s, i) => (
              <div className="svc-row reveal" key={s.t}>
                <span className="svc-i">{String(i + 1).padStart(2, '0')}</span>
                <h2>{s.t}</h2>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="scene backdrop" data-shot="map" aria-labelledby="flow-title">
        <div className="container">
          <h2 id="flow-title" className="display-2 reveal">How a load <em>moves.</em></h2>
          <ol className="timeline reveal">
            {FLOW.map((f) => (
              <li key={f.t}>
                <span className="tl-dot" aria-hidden="true" />
                <span className="tl-k">{f.k}</span>
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
