import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow external images from DEV.to and other platforms
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'dev-to-uploads.s3.amazonaws.com' },
      { protocol: 'https', hostname: 'media2.dev.to' },
    ],
  },
  // Needed for server-side modules (jsdom, cheerio)
  serverExternalPackages: ['jsdom'],
};

export default nextConfig;
