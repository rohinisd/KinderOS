const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  outputFileTracingRoot: path.join(__dirname, '../../'),

  transpilePackages: ['@kinderos/ui', '@kinderos/utils', '@kinderos/db'],

  serverExternalPackages: ['@prisma/client', 'prisma'],

  outputFileTracingIncludes: {
    '/*': ['../../packages/db/generated/**/*'],
  },

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
