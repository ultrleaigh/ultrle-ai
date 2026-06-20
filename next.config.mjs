/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['groq-sdk'],
  turbopack: {
    resolveAlias: {
      canvas: './empty-module.js',
    },
  },
};

export default nextConfig;