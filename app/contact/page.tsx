import Link from 'next/link';
import type { Metadata } from 'next';
import ContactForm from '@/components/ContactForm';
import OfficeMap from '@/components/OfficeMap';
import { COMPANY } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contact Wildfire Express — 24/7 Dispatch & Recruiting',
  description: 'Call Wildfire Express 24/7 at +1 (513) 206-5093, email hr@wildfireexpress.com or send a message to recruiting, owner-operator support, accounting or brokers.',
  alternates: { canonical: '/contact' },
};

export default function Page() {
  return (
    <>
      <section className="scene contact-hero" data-shot="mapClose" aria-labelledby="contact-title">
        <div className="container">
          <div className="reveal">
            <p className="kicker">Contact</p>
            <h1 id="contact-title">Somebody <em>picks up.</em></h1>
          </div>
        </div>
        <div className="reach-strip">
          <div className="container">
            <div className="reach-cells">
              <div><b>Recruiting &amp; dispatch · 24/7</b><a href={`tel:${COMPANY.tel}`}>{COMPANY.phone}</a></div>
              <div><b>Email HR</b><a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></div>
              <div><b>Yard &amp; HQ</b><span>Cleves, Ohio</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="scene msg-section" data-shot="sideContact" aria-labelledby="msg-title">
        <div className="container">
          <div className="msg-split">
            <div className="reveal">
              <h2 id="msg-title" className="msg-title">Send a <em>message.</em></h2>
              <p>Questions about pay, equipment or a settlement? Write to us and the right department will answer. For a job, the application is faster.</p>
              <Link className="text-link" href="/apply">Go to the 90-second application →</Link>
            </div>
            <div className="reveal">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      <section className="office-section" aria-labelledby="office-title">
        <div className="container">
          <div className="office-head reveal">
            <h2 id="office-title">Find the <em>yard.</em></h2>
            <p>Our office and home terminal sit just west of Cincinnati, minutes from I-275 and I-74 — an easy stop between the Midwest and the East Coast lanes.</p>
          </div>
          <div className="reveal">
            <OfficeMap />
          </div>
        </div>
      </section>
    </>
  );
}
