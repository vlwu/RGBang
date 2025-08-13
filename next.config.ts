import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  // assetPrefix: './', // REMOVED: This will be handled by the build script.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  // trailingSlash: true, // REMOVED: Use default Next.js pathing for simplicity.
  distDir: 'out',
  generateBuildId: () => 'build',
  reactStrictMode: false, // ADDED: Helps prevent hydration errors in the extension environment.
  experimental: {},
};

export default nextConfig;