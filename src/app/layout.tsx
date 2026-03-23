import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import { AuthProvider } from '@/hooks/useAuth'
import AuthModal from '@/components/AuthModal'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })

export const metadata: Metadata = {
  title: 'Jaiye Directory',
  description: 'Nigerian wedding & event vendor directory',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={dmSans.variable} style={{ margin: 0, padding: 0 }}>
        <AuthProvider>
          {children}
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  )
}
