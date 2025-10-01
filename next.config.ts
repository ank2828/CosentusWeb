import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cosentus.com',
      },
      {
        protocol: 'https',
        hostname: 'prod.spline.design',
      },
      {
        protocol: 'https',
        hostname: 'my.spline.design',
      },
    ],
  },
  // Optimize for Vercel deployment
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;