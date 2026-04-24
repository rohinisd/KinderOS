import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'
import { PWARegister } from '@/components/pwa/pwa-register'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'VidyaPrabandha — School Management Platform',
  description:
    'Multi-tenant SaaS platform for kindergarten schools in India. Manage students, fees, attendance, and more.',
  keywords: ['kindergarten', 'school management', 'India', 'SaaS'],
  manifest: '/manifest.webmanifest',
  applicationName: 'VidyaPrabandha',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'VidyaPrabandha',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.svg',
    shortcut: '/favicon.svg',
  },
}

export const viewport: Viewport = {
  themeColor: '#3C3489',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} font-sans antialiased`}>
          <PWARegister />
          {children}
          <Toaster position="top-right" richColors closeButton />
        </body>
      </html>
    </ClerkProvider>
  )
}
