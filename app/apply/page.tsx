import type { Metadata } from 'next';
import ApplyForm from '@/components/ApplyForm';

export const metadata: Metadata = {
  title: 'Apply in 90 Seconds — CDL-A Driver Application | Wildfire Express',
  description: 'Apply to drive with Wildfire Express LLC in 90 seconds: choose your lane, share your experience and an HR specialist calls you back within 15 minutes during business hours.',
  alternates: { canonical: '/apply' },
};

export default function Page() {
  return (
    <section className="apply-split" data-shot="applyHero" aria-labelledby="apply-title">
      <div className="apply-intro">
        <p className="kicker">Driver application</p>
        <h1 id="apply-title">Ninety seconds <em>to the road.</em></h1>
        <p>An HR specialist calls you back within 15 minutes during business hours.</p>
      </div>
      <div className="apply-panel">
        <ApplyForm />
      </div>
    </section>
  );
}
