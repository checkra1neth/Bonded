import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Base Dating - Find Your Crypto Soulmate',
  description: 'The first dating app that matches you based on your crypto portfolio and DeFi interests',
  keywords: ['crypto', 'dating', 'DeFi', 'Base', 'blockchain', 'Web3'],
  authors: [{ name: 'Base Dating Team' }],
  openGraph: {
    title: 'Base Dating - Find Your Crypto Soulmate',
    description: 'Match with people who share your crypto interests and DeFi strategies',
    url: 'https://basedating.app',
    siteName: 'Base Dating',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Base Dating - Crypto Dating App',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Base Dating - Find Your Crypto Soulmate',
    description: 'Match with people who share your crypto interests and DeFi strategies',
    images: ['/og-image.png'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {children}
          </main>
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}