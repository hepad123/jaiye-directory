import { SignUp } from '@clerk/clerk-react'

export default function SignUpPage() {
  return (
    <main style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '80vh', background: 'var(--bg)',
      fontFamily: 'var(--font-jost, sans-serif)',
    }}>
      <SignUp routing="hash" />
    </main>
  )
}
