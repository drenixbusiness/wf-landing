// Company facts used across the site — edit here, not in the pages.
export const COMPANY = {
  legalName: 'Wildfire Express LLC',
  name: 'Wildfire Express',
  usdot: '3498707',
  mc: '1154036',
  phone: '+1 (513) 206-5093',
  tel: '+15132065093',
  email: 'hr@wildfireexpress.com',
  // principal place of business, as filed with FMCSA (MCS-150)
  address: '8113 W Mill St, Cleves, OH 45002',
  street: '8113 W Mill St',
  city: 'Cleves, OH 45002',
  geo: { lat: 39.212808, lng: -84.707354 },
} as const;

export const NAV = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/company-drivers', label: 'Company Drivers' },
  { href: '/owner-operators', label: 'Owner-Operators' },
  { href: '/careers', label: 'Careers' },
  { href: '/contact', label: 'Contact' },
] as const;

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://wildfire-express.com';
