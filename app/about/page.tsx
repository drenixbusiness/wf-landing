import type { Metadata } from 'next';
import type React from 'react';

export const metadata: Metadata = {
  title: "About Wildfire Express — OTR Dry Van Carrier, USDOT 3498707",
  description: "Wildfire Express LLC is a small, driver-first 53′ dry van carrier (USDOT 3498707, MC 1154036) running OTR freight across the lower 48 states.",
  alternates: { canonical: '/about' },
};

export default function Page() {
  return (
    <>
    
        <section className="scene page-hero" data-shot="map" aria-labelledby="about-title">
          <div className="container">
            <div className="panel reveal">
              <p className="kicker">About Wildfire Express</p>
              <h1 id="about-title" className="h1">A small carrier that runs <em>hot</em> and <em>honest.</em></h1>
              <p className="lede">One authority, one dispatch board, one promise: freight that moves on time and drivers who get paid what they were told.</p>
              <div className="authority"><span>USDOT 3498707</span><span>MC 1154036</span><span>53′ dry van</span><span>Lower 48</span></div>
            </div>
          </div>
        </section>
    
        <section className="scene" data-shot="mapLow" aria-labelledby="story-title">
          <div className="container">
            <div className="panel panel--wide panel--strong reveal">
              <p className="kicker">Our story</p>
              <h2 id="story-title" className="h3">Built from the <em>driver's seat.</em></h2>
              <div className="story mt-m">
                <p>Wildfire Express started the way most good carriers do — with people who had spent years behind the wheel and were tired of hearing "the check is in the mail." We built the company we wanted to drive for: a dry van operation where the settlement sheet is readable, the dispatcher picks up the phone, and a load offer comes with the real numbers attached.</p>
                <p>Today we run 53′ dry van freight from coast to coast for a network of more than three hundred brokers and direct shippers. Consumer goods, packaged food, paper, retail replenishment and building products — freight that keeps the shelves full and the miles steady.</p>
                <p>We stay deliberately small. Every driver has a direct line to dispatch, safety and payroll, and our leadership still answers the phone. Growth is welcome, but never at the price of the people already on the road with us.</p>
                <p>Whether you bring your own truck, take one of ours or lease toward ownership, you join the same board, the same standards and the same promise: run hot, stay honest, get home.</p>
              </div>
            </div>
          </div>
        </section>
    
        <section className="scene" data-shot="top" aria-labelledby="principles-title">
          <div className="container">
            <h2 id="principles-title" className="principles-title reveal">Three things we <em>don’t bend on.</em></h2>
            <div className="principles">
              <div className="principle reveal">
                <span className="principle-n" aria-hidden="true">01</span>
                <h3>Pay you can read</h3>
                <p>Weekly settlements, Saturday to Saturday, with a detailed statement you confirm before money moves. Direct deposit every Friday. No held-back weeks, no surprise reserves.</p>
              </div>
              <div className="principle reveal">
                <span className="principle-n" aria-hidden="true">02</span>
                <h3>Dispatch that picks up</h3>
                <p>Live dispatch around the clock. When something breaks on the road, a person answers and gets help rolling, whether it’s noon or midnight.</p>
              </div>
              <div className="principle reveal">
                <span className="principle-n" aria-hidden="true">03</span>
                <h3>Freight that’s booked</h3>
                <p>Pre-booked loads across a network of more than 300 brokers. No forced dispatch and no-touch freight, so your miles are spent driving.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="compliance-band" aria-label="Compliance">
          <div className="container">
            <div className="compliance-cells">
              <div><b>Regulatory</b><span>FMCSA compliant</span></div>
              <div><b>Coverage</b><span>A-rated insurance</span></div>
              <div><b>Equipment</b><span>Trailer interchange</span></div>
              <div><b>Tracking</b><span>ELD on every unit</span></div>
            </div>
          </div>
        </section>
    </>
  );
}
