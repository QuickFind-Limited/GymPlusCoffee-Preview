import React, { createContext, useContext, ReactNode } from 'react';

type UserType = 'buyer';

interface UserContextType {
  userType: UserType;
  user: any;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const mockUser = {
    id: 'mock-user-id',
    email: 'demo@gympluscoffee.com',
    user_metadata: {
      full_name: 'Demo User',
    },
  };

  return (
    <UserContext.Provider value={{ userType: 'buyer', user: mockUser, loading: false }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};