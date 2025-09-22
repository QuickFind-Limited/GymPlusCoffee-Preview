// Main exports
export { supabase } from './client'
export * from './auth'
export * from './types'

// Re-export commonly used Supabase types
export type { 
  Session, 
  User, 
  AuthChangeEvent,
  AuthError as SupabaseAuthError 
} from '@supabase/supabase-js'