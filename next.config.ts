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
};

export default nextConfig;