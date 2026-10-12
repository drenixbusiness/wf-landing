'use client';

import { usePathname } from 'next/navigation';

// The application page is a self-contained screen: no closing CTA and no footer (as in the design).
export default function FooterCta({ children }: { children: React.ReactNode }) {
  return usePathname() === '/apply' ? null : <>{children}</>;
}
