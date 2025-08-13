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
  // Disable problematic Next.js features for Chrome extensions
  generateBuildId: () => 'build',
  // Disable service worker and other problematic features
  experimental: {
    // Disable features that might generate problematic files
  },
};

export default nextConfig;