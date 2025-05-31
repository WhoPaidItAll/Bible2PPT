/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Add CORS and other settings if needed
  images: {
    domains: ['localhost'], // Adjust based on needs
  },
};

module.exports = nextConfig;