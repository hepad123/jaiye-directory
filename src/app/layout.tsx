import type { Metadata } from 'next'
import { Fraunces, Jost } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import Navbar from '@/components/Navbar'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '600', '700'],
})
const jost = Jost({
  subsets: ['latin'],
  variable: '--font-jost',
  weight: ['300', '400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'Jaiye Directory',
  description: 'Nigerian wedding & event vendor directory',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${fraunces.variable} ${jost.variable}`}
        style={{ margin: 0, padding: 0, fontFamily: 'var(--font-jost, sans-serif)' }}
      >
        <ClerkProvider signUpForceRedirectUrl="/onboarding">
          <Navbar />
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
