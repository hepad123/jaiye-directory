import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { ClerkAvailableContext } from './context/auth'
import App from './App'
import './index.css'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined
const root = createRoot(document.getElementById('root')!)

if (publishableKey) {
  // Full auth — ClerkProvider wraps the app
  root.render(
    <ClerkAvailableContext.Provider value={true}>
      <ClerkProvider publishableKey={publishableKey}>
        <App />
      </ClerkProvider>
    </ClerkAvailableContext.Provider>
  )
} else {
  // No key yet — render WITHOUT ClerkProvider.
  // Safe because:
  //  • NavbarAuth (uses useUser/useClerk) only mounts when ClerkAvailableContext = true
  //  • useSupabase no longer calls useSession()
  //  • The homepage and category browsing work fully with the anon Supabase client
  console.warn('[Jaiyé] VITE_CLERK_PUBLISHABLE_KEY not set — sign-in and auth features disabled.')
  root.render(
    <ClerkAvailableContext.Provider value={false}>
      <App />
    </ClerkAvailableContext.Provider>
  )
}
