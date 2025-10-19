/** @type {import('next').NextConfig} */
const nextConfig = {
  // Set the base path for the application
  basePath: '/application/TH_LifeEngine',
  
  // Set the asset prefix to ensure assets are loaded from the correct path
  assetPrefix: '/application/TH_LifeEngine',
  
  // Configure trailing slash behavior
  trailingSlash: false,
  
  // Ensure images work with the base path
  images: {
    unoptimized: true,
  },
  
  // For static export (GitHub Pages, etc.)
  output: 'export',
};

module.exports = nextConfig;