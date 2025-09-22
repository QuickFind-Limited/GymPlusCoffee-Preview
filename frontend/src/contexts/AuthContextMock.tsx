import React, { createContext, useContext, ReactNode } from 'react';

interface AuthContextType {
  user: any;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  signUp: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Mock user object
  const mockUser = {
    id: 'mock-user-id',
    email: 'demo@gympluscoffee.com',
    user_metadata: {
      full_name: 'Demo User',
    },
  };

  const value = {
    user: mockUser,
    loading: false,
    signIn: async () => {
      console.log('Mock sign in');
    },
    signOut: async () => {
      console.log('Mock sign out');
    },
    signUp: async () => {
      console.log('Mock sign up');
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};