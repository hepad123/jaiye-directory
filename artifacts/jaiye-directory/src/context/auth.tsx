import { createContext, useContext } from 'react'

// Simple flag: true when <ClerkProvider> is present in the tree.
// Allows components to conditionally call Clerk hooks.
export const ClerkAvailableContext = createContext(false)
export const useClerkAvailable = () => useContext(ClerkAvailableContext)
