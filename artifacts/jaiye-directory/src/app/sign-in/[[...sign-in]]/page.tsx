import { SignIn } from '@clerk/clerk-react'

export default function SignInPage() {
  return (
    <main style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '80vh', background: 'var(--bg)',
      fontFamily: 'var(--font-jost, sans-serif)',
    }}>
      <SignIn routing="hash" />
    </main>
  )
}
