import { createClient } from '@supabase/supabase-js'

// Env vars are baked in at Vite build time. Fall back to the real public
// values so deployments (Vercel, etc.) work even without VITE_ vars set.
const url =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  'https://rchuhowqhfgsxagtxlba.supabase.co'

const key =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjaHVob3dxaGZnc3hhZ3R4bGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NjUzMzcsImV4cCI6MjA4OTE0MTMzN30.HwRE7yrmQc-Qs6zg_rTeWBXI6uTqR_lFFr7jg0rVpkk'

export const supabase = createClient(url, key)
