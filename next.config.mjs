/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['groq-sdk'],
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;