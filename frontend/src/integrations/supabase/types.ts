export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Auth types
export interface SignInData {
  email: string
  password: string
}

export interface SignUpData {
  email: string
  password: string
  confirmPassword?: string
}

export interface ResetPasswordData {
  email: string
}

export interface UpdatePasswordData {
  password: string
}

export interface UserProfile {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface AuthError {
  message: string
  status?: number
  code?: string
}

export interface AuthResponse<T = any> {
  data?: T
  error?: AuthError
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}