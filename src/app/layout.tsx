import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Jaiye Directory — Nigerian Wedding Vendors',
  description: 'Your guide to the best Nigerian wedding and event vendors',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className={`${dmSans.variable}`} style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  )
}
