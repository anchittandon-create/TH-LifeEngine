/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optimize build performance
  experimental: {
    // Reduce bundle size
    optimizePackageImports: ['@google/generative-ai'],
  },
  // Increase build timeout
  staticPageGenerationTimeout: 1000,
  // Optimize images for responsive design
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
    unoptimized: false, // Enable optimization for better performance
  },
  // Reduce output for faster builds
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  // Compress responses
  compress: true,
  // Enable SWC minification for faster builds
  swcMinify: true,
  // Optimize for production
  poweredByHeader: false,
  // Auto-scaling headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ],
      },
    ];
  },
};

export default nextConfig;
