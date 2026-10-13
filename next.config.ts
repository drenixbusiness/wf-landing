import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // one canonical domain: the hyphen-less variant permanently redirects to wildfire-express.com
  async redirects() {
    return ['wildfireexpress.com', 'www.wildfireexpress.com'].map((host) => ({
      source: '/:path*',
      has: [{ type: 'host' as const, value: host }],
      destination: 'https://wildfire-express.com/:path*',
      permanent: true,
    }));
  },
  async headers() {
    return [
      {
        // 3D model, map data and posters never change between deploys without a rename
        source: '/assets/:file*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }],
      },
    ];
  },
};

export default nextConfig;
