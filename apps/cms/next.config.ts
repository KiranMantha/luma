import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  distDir: 'dist',
  output: 'standalone',
  transpilePackages: ['@repo/ui'],
  reactStrictMode: true,
  // adjust this so it points to your repository root (where your workspace package.json is)
  outputFileTracingRoot: path.join(__dirname, '../../'), // <-- example for apps/web -> repoRoot
};

export default nextConfig;
