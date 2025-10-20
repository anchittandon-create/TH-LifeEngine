/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
  output: 'export',
};

module.exports = nextConfig;
