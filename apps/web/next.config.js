const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // Monorepo: tell standalone output to trace from the workspace root
  outputFileTracingRoot: path.join(__dirname, '../../'),

  transpilePackages: ['@kinderos/ui', '@kinderos/utils'],

  // Keep Prisma client external so the engine binary is found at runtime
  serverExternalPackages: ['@prisma/client', 'prisma'],

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.clerk.com' },
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: 'files.kinderos.in' },
    ],
  },

  experimental: {
    nodeMiddleware: true,
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
}

module.exports = nextConfig
