import { supabase } from './client'
import type { 
  AuthError, 
  AuthResponse, 
  SignUpData, 
  SignInData, 
  ResetPasswordData,
  UpdatePasswordData,
  UserProfile 
} from './types'
import { Session, User } from '@supabase/supabase-js'

// Auth helper functions with comprehensive error handling

export async function signUp({ email, password }: SignUpData): Promise<AuthResponse<{ user: User | null; session: Session | null }>> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    })

    if (error) {
      return {
        data: null,
        error: {
          message: getAuthErrorMessage(error),
          status: error.status,
          code: error.code,
        },
      }
    }

    // Note: We're not creating a profile here since the profiles table might not exist
    // This can be handled later when setting up the database schema

    return { data, error: null }
  } catch (error) {
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred during sign up',
        code: 'UNKNOWN_ERROR',
      },
    }
  }
}

export async function signIn({ email, password }: SignInData): Promise<AuthResponse<{ user: User | null; session: Session | null }>> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return {
        data: null,
        error: {
          message: getAuthErrorMessage(error),
          status: error.status,
          code: error.code,
        },
      }
    }

    return { data, error: null }
  } catch (error) {
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred during sign in',
        code: 'UNKNOWN_ERROR',
      },
    }
  }
}

export async function signOut(): Promise<AuthResponse<null>> {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        data: null,
        error: {
          message: getAuthErrorMessage(error),
          status: error.status,
          code: error.code,
        },
      }
    }

    return { data: null, error: null }
  } catch (error) {
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred during sign out',
        code: 'UNKNOWN_ERROR',
      },
    }
  }
}

export async function resetPassword({ email }: ResetPasswordData): Promise<AuthResponse<null>> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      return {
        data: null,
        error: {
          message: getAuthErrorMessage(error),
          status: error.status,
          code: error.code,
        },
      }
    }

    return { data: null, error: null }
  } catch (error) {
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred during password reset',
        code: 'UNKNOWN_ERROR',
      },
    }
  }
}

export async function updatePassword({ password }: UpdatePasswordData): Promise<AuthResponse<User>> {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      return {
        data: null,
        error: {
          message: getAuthErrorMessage(error),
          status: error.status,
          code: error.code,
        },
      }
    }

    return { data: data.user, error: null }
  } catch (error) {
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred during password update',
        code: 'UNKNOWN_ERROR',
      },
    }
  }
}

export async function getSession(): Promise<AuthResponse<Session | null>> {
  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      return {
        data: null,
        error: {
          message: getAuthErrorMessage(error),
          status: error.status,
          code: error.code,
        },
      }
    }

    return { data: data.session, error: null }
  } catch (error) {
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred while fetching session',
        code: 'UNKNOWN_ERROR',
      },
    }
  }
}

export async function getUser(): Promise<AuthResponse<User | null>> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      return {
        data: null,
        error: {
          message: getAuthErrorMessage(error),
          status: error.status,
          code: error.code,
        },
      }
    }

    return { data: user, error: null }
  } catch (error) {
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred while fetching user',
        code: 'UNKNOWN_ERROR',
      },
    }
  }
}

export async function getUserProfile(userId: string): Promise<AuthResponse<UserProfile | null>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          status: error.code === 'PGRST116' ? 404 : undefined,
          code: error.code,
        },
      }
    }

    return { data, error: null }
  } catch (error) {
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred while fetching user profile',
        code: 'UNKNOWN_ERROR',
      },
    }
  }
}

// Error message helper for better UX
function getAuthErrorMessage(error: any): string {
  // Map error codes to user-friendly messages
  const errorCodeMessages: Record<string, string> = {
    'invalid_credentials': 'Invalid email or password. Please try again.',
    'email_not_confirmed': 'Please check your email and confirm your account before signing in.',
    'user_already_exists': 'An account with this email already exists.',
    'weak_password': 'Password must be at least 6 characters long.',
    'invalid_email': 'Please enter a valid email address.',
    'over_email_send_rate_limit': 'Too many attempts. Please try again later.',
    'over_request_rate_limit': 'Too many requests. Please try again later.',
    'unexpected_failure': 'An unexpected error occurred. Please try again.',
  }

  // First check if we have a specific error code
  if (error.code && errorCodeMessages[error.code]) {
    return errorCodeMessages[error.code]
  }

  // Fallback to checking error messages for backwards compatibility
  const errorMessages: Record<string, string> = {
    'Invalid login credentials': 'Invalid email or password. Please try again.',
    'Email not confirmed': 'Please check your email and confirm your account before signing in.',
    'User already registered': 'An account with this email already exists.',
    'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
    'Invalid email': 'Please enter a valid email address.',
    'Email rate limit exceeded': 'Too many attempts. Please try again later.',
    'Network request failed': 'Network error. Please check your connection and try again.',
  }

  // Check if error message matches any of our custom messages
  for (const [key, value] of Object.entries(errorMessages)) {
    if (error.message?.includes(key)) {
      return value
    }
  }

  // Return the original message if no match
  return error.message || 'An unexpected error occurred'
}