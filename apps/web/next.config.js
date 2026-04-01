/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  transpilePackages: ['@kinderos/ui', '@kinderos/utils'],

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.clerk.com' },
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: 'files.kinderos.in' },
    ],
  },

  serverActions: {
    bodySizeLimit: '4mb',
  },
}

module.exports = nextConfig
