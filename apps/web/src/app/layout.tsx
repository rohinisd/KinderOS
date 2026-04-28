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
  title: 'VidhyaPrabandha',
  description:
    'Multi-tenant SaaS platform for School schools in India. Manage students, fees, attendance, and more.',
  keywords: ['School', 'school management', 'India', 'SaaS'],
  manifest: '/manifest.webmanifest',
  applicationName: 'VidhyaPrabandha',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'VidhyaPrabandha',
  },
  icons: {
    icon: '/icons/icon-512.png?v=3',
    apple: '/apple-icon.svg?v=3',
    shortcut: '/icons/favicon-64.png?v=3',
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
