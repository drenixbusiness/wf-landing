'use client';

import { usePathname } from 'next/navigation';

// The application page is a self-contained screen: no closing CTA and no footer (as in the design).
// The legal pages keep the footer but drop the closing "Apply once" CTA.
const HIDE = {
  cta: ['/apply', '/privacy', '/terms'],
  footer: ['/apply'],
};

export default function FooterCta({ part = 'footer', children }: { part?: keyof typeof HIDE; children: React.ReactNode }) {
  return HIDE[part].includes(usePathname()) ? null : <>{children}</>;
}
