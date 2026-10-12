import Link from 'next/link';
import FooterCta from '@/components/FooterCta';
import { COMPANY } from '@/lib/site';

export default function Footer() {
  return (
    <footer className="site-footer">
      <FooterCta>
      <section className="footer-cta" data-shot="road" aria-labelledby="footer-cta-title">
        <div className="container container--wide">
          <div className="cta-center reveal">
            <p className="kicker">Ready when you are</p>
            <h2 id="footer-cta-title">Apply once. <em>Run for years.</em></h2>
            <p className="lede">The application takes 90 seconds. An HR specialist calls you back within 15 minutes during business hours.</p>
            <div className="btn-row">
              <Link className="btn btn--solid" href="/apply">Start my application <span className="arr" aria-hidden="true">→</span></Link>
              <a className="btn btn--ghost" href={`tel:${COMPANY.tel}`}>{COMPANY.phone}</a>
            </div>
          </div>
        </div>
      </section>
      </FooterCta>
      <FooterCta>
      <div className="footer-main">
        <div className="container footer-inner">
          <div className="footer-grid">
            <div className="about">
              <Link className="footer-brand" href="/" aria-label="Wildfire Express home">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/mark.png" alt="" width={46} height={26} />
                <b>Wildfire Express</b>
              </Link>
              <p>{COMPANY.legalName}, a dry van OTR carrier built around the people who drive. USDOT {COMPANY.usdot} · MC {COMPANY.mc}.</p>
            </div>
            <div>
              <h3>Company</h3>
              <ul>
                <li><Link href="/about">About</Link></li>
                <li><Link href="/services">Services</Link></li>
                <li><Link href="/company-drivers">Company Drivers</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3>Drivers</h3>
              <ul>
                <li><Link href="/apply">Apply now</Link></li>
                <li><Link href="/owner-operators">Owner operator</Link></li>
                <li><Link href="/company-drivers">Company driver</Link></li>
                <li><Link href="/careers#partner">Lease partner</Link></li>
              </ul>
            </div>
            <div>
              <h3>Reach us</h3>
              <ul>
                <li><a href={`tel:${COMPANY.tel}`}>{COMPANY.phone}</a></li>
                <li><a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></li>
                <li className="muted-li">{COMPANY.street}, {COMPANY.city}</li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} {COMPANY.legalName} · All rights reserved.</span>
            <nav aria-label="Legal">
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms &amp; Conditions</Link>
            </nav>
          </div>
        </div>
      </div>
      </FooterCta>
    </footer>
  );
}
