import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

const ROUTES = ['', '/about', '/services', '/company-drivers', '/owner-operators', '/careers', '/apply', '/contact', '/privacy', '/terms'];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((r) => ({ url: `${SITE_URL}${r}`, changeFrequency: 'monthly', priority: r === '' ? 1 : r === '/apply' ? 0.9 : 0.6 }));
}
