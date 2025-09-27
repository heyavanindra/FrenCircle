"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

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
  isInitialized: boolean;
}

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Storage keys
const USER_STORAGE_KEY = 'frencircle_user';

// Default user state
const defaultUser: User | null = null;

// Helper functions for localStorage operations
const userStorage = {
  save: (user: User | null) => {
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({
          ...user,
          expiry: user.expiry?.toISOString() // Convert Date to string for storage
        }));
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
  },
  
  load: (): User | null => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(USER_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Convert expiry back to Date object
          if (parsed.expiry) {
            parsed.expiry = new Date(parsed.expiry);
          }
          return parsed;
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
    return null;
  },
  
  clear: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }
};

// UserProvider component
interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(defaultUser);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize user context on mount - restore from localStorage
  useEffect(() => {
    const initializeUser = async () => {
      const storedUser = userStorage.load();
      const storedToken = localStorage.getItem('userToken');
      
      if (storedUser && storedToken) {
        // Check if stored user session is still valid
        if (storedUser.expiry && new Date() > storedUser.expiry) {
          // Session expired, clear all storage
          userStorage.clear();
          localStorage.removeItem('userToken');
          setUser(null);
        } else {
          // Valid session, restore user
          setUser(storedUser);
        }
      } else if (storedUser && !storedToken) {
        // User data exists but no token - invalid state, clear user data
        userStorage.clear();
        setUser(null);
      } else if (!storedUser && storedToken) {
        // Token exists but no user data - invalid state, clear token
        localStorage.removeItem('userToken');
        setUser(null);
      }
      
      setIsInitialized(true);
    };

    initializeUser();
  }, []);

  // Custom setUser that also persists to localStorage
  const setUserWithPersistence = useCallback((newUser: User | null) => {
    setUser(newUser);
    userStorage.save(newUser);
  }, []);

  // Update user with partial data
  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(currentUser => {
      if (!currentUser) return null;
      const updatedUser = { ...currentUser, ...updates };
      userStorage.save(updatedUser); // Persist the update
      return updatedUser;
    });
  }, []);

  // Logout function
  const logout = useCallback(() => {
    setUser(null);
    // Clear all stored data
    userStorage.clear();
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
    setUser: setUserWithPersistence,
    updateUser,
    logout,
    isAuthenticated,
    isTokenExpired,
    isInitialized,
  };

  // Show loading state while initializing to prevent content flash
  if (!isInitialized) {
    return (
      <UserContext.Provider value={contextValue}>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </UserContext.Provider>
    );
  }

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

  // Return only the first name for UI sections that require it
  getFirstName: (user: User | null): string => {
    if (!user) return 'Guest';
    if (user.firstName && user.firstName.trim().length > 0) return user.firstName;
    // Fallback to username or full name initial
    if (user.username) return user.username;
    return userHelpers.getFullName(user).split(' ')[0] || 'Guest';
  },

  getLastName: (user: User | null): string => {
    if (!user) return '';
    return user.lastName || '';
  },

  // Safe avatar URL accessor with fallback
  getAvatarUrl: (user: User | null): string => {
    if (!user) return '/placeholder-avatar.jpg';
    return user.avatarUrl || '/placeholder-avatar.jpg';
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
  },

  // Check if both user and token are present
  hasValidAuthState: (): boolean => {
    if (typeof window === 'undefined') return false;
    const storedUser = userStorage.load();
    const storedToken = localStorage.getItem('userToken');
    return !!(storedUser && storedToken && userHelpers.isSessionValid(storedUser));
  }
};