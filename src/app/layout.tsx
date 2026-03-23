import type { Metadata } from 'next'
import { Playfair_Display, Jost } from 'next/font/google'
import { AuthProvider } from '@/hooks/useAuth'
import AuthModal from '@/components/AuthModal'

const playfair = Playfair_Display({
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
      <body
        className={`${playfair.variable} ${jost.variable}`}
        style={{ margin: 0, padding: 0, fontFamily: 'var(--font-jost, sans-serif)' }}
      >
        <AuthProvider>
          {children}
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  )
}
