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
  // Optimize images
  images: {
    unoptimized: true, // Disable image optimization for faster builds
  },
  // Reduce output for faster builds
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;
