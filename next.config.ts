import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  assetPrefix: './',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  // Ensure public assets are properly handled
  trailingSlash: true,
  // Make sure static files are copied
  distDir: 'out',
};

export default nextConfig;