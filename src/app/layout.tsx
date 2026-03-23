import type { Metadata, Viewport } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Jaiye Directory – Nigerian Wedding & Event Vendors',
  description: 'Your guide to the best Nigerian wedding and event vendors. 200+ vendors including makeup artists, photographers, event planners, fashion designers and more.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body style={{ margin: 0, padding: 0, fontFamily: 'var(--font-dm-sans, sans-serif)' }}>
        {children}
      </body>
    </html>
  )
}
