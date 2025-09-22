import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { Logger } from '@/services/Logger'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check active session on mount and subscribe to changes
  useEffect(() => {
    // Get current session
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      Logger.debug('Auth state changed', { event: _event })
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Sign in function
  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    // user state will update automatically via onAuthStateChange listener
  }

  // Sign up function
  async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      }
    })
    
    Logger.debug('SignUp response', { hasUser: !!data?.user, hasError: !!error })
    
    // Check for various ways Supabase indicates existing user
    if (error) {
      throw error
    }
    
    // Check if this is actually a duplicate user (Supabase sometimes returns success for existing users)
    if (data?.user) {
      // If user exists but has no identities and is not confirmed, it's likely a duplicate
      if (data.user.identities?.length === 0) {
        throw new Error('User already registered')
      }
      
      // If the user already has a confirmed_at timestamp from a previous signup
      if (data.user.created_at && data.user.email_confirmed_at && 
          new Date(data.user.created_at).getTime() < Date.now() - 60000) {
        throw new Error('User already registered')
      }
    }
  }

  // Sign out function
  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}