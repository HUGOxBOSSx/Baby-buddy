import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@baby-buddy/core', '@baby-buddy/content'],
};

export default nextConfig;
