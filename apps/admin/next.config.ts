import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  distDir: 'dist',
  output: 'standalone',
  transpilePackages: ['@repo/ui'],
  reactStrictMode: true,
};

export default nextConfig;
