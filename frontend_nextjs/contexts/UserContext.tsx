"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

// User interface definition
export interface User {
  id?: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  avatarUrl?: string;
  login: boolean;
  expiry?: Date;
  // Additional optional fields for future use
  role?: string;
  preferences?: Record<string, any>;
}

// Context value interface
interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isTokenExpired: () => boolean;
}

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Default user state
const defaultUser: User | null = null;

// UserProvider component
interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(defaultUser);

  // Update user with partial data
  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(currentUser => {
      if (!currentUser) return null;
      return { ...currentUser, ...updates };
    });
  }, []);

  // Logout function
  const logout = useCallback(() => {
    setUser(null);
    // Optional: Clear any stored tokens or session data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userToken');
      sessionStorage.removeItem('userSession');
    }
  }, []);

  // Check if user is authenticated
  const isAuthenticated = user?.login === true;

  // Check if token is expired
  const isTokenExpired = useCallback(() => {
    if (!user?.expiry) return false;
    return new Date() > user.expiry;
  }, [user?.expiry]);

  const contextValue: UserContextType = {
    user,
    setUser,
    updateUser,
    logout,
    isAuthenticated,
    isTokenExpired,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook to use the UserContext
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// Helper functions for working with user data
export const userHelpers = {
  getFullName: (user: User | null): string => {
    if (!user) return 'Guest';
    return `${user.firstName} ${user.lastName}`.trim();
  },
  
  getDisplayName: (user: User | null): string => {
    if (!user) return 'Guest';
    return user.username || userHelpers.getFullName(user);
  },
  
  getInitials: (user: User | null): string => {
    if (!user) return 'G';
    const firstName = user.firstName?.charAt(0)?.toUpperCase() || '';
    const lastName = user.lastName?.charAt(0)?.toUpperCase() || '';
    return firstName + lastName || user.username?.charAt(0)?.toUpperCase() || 'U';
  },
  
  isSessionValid: (user: User | null): boolean => {
    if (!user?.login) return false;
    if (!user.expiry) return true; // No expiry means valid
    return new Date() < user.expiry;
  }
};