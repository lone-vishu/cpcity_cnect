import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../domain/types';
import { userService, authService } from '../services';
import { Permission, hasPermission as checkPermission } from './permissions';

interface LoginResult {
  user?: User;
  roleMismatch?: Role;
  error?: string;
}

interface AuthContextType {
  currentUser: User | null;
  user: User | null;
  currentRole: Role | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<User>;
  loginWithCredentials: (
    email: string,
    password?: string,
    targetRole?: Role
  ) => Promise<LoginResult>;
  loginAs: (role: Role) => Promise<User>;
  switchRole: (role: Role) => Promise<User>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  refreshUser: () => Promise<void>;
  setCurrentUserDirectly: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_EMAILS: Record<Role, string> = {
  trainee: 'trainee.demo@capacityconnect.demo',
  trainer: 'trainer.demo@capacityconnect.demo',
  admin: 'admin.demo@capacityconnect.demo',
};

const USER_SESSION_KEY = 'capacity_connect_session_uid';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadInitialSession = async () => {
    try {
      const storedUid = localStorage.getItem(USER_SESSION_KEY);
      if (storedUid) {
        const user = await userService.getUserById(storedUid);
        if (user) {
          setCurrentUser(user);
          return;
        }
      }
      // Normal visitors start unauthenticated
      setCurrentUser(null);
    } catch (e) {
      console.error('Failed to load auth session', e);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialSession();
  }, []);

  const loginWithCredentials = async (
    email: string,
    password?: string,
    targetRole?: Role
  ): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      const user = await authService.verifyCredentials(email, password || '');
      if (!user) {
        const exists = await authService.emailExists(email);
        if (!exists) {
          return { error: 'No account found with this email address.' };
        }
        return { error: 'Invalid password. Demo accounts accept any password, but registered accounts require the correct password.' };
      }

      if (targetRole && user.role !== targetRole) {
        return {
          user,
          roleMismatch: user.role,
          error: `This account is registered as a ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}.`,
        };
      }

      setCurrentUser(user);
      localStorage.setItem(USER_SESSION_KEY, user.id);
      return { user };
    } catch (e: any) {
      return { error: e.message || 'Authentication failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password?: string): Promise<User> => {
    const res = await loginWithCredentials(email, password);
    if (res.user) {
      return res.user;
    }
    throw new Error(res.error || 'Authentication failed');
  };

  const loginAs = async (role: Role): Promise<User> => {
    const email = DEMO_EMAILS[role];
    const user = await userService.getUserByEmail(email);
    if (!user) {
      throw new Error(`Demo account for ${role} not found.`);
    }
    setCurrentUser(user);
    localStorage.setItem(USER_SESSION_KEY, user.id);
    return user;
  };

  const switchRole = async (role: Role): Promise<User> => {
    return loginAs(role);
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(USER_SESSION_KEY);
  };

  const setCurrentUserDirectly = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem(USER_SESSION_KEY, user.id);
    } else {
      localStorage.removeItem(USER_SESSION_KEY);
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    return checkPermission(currentUser?.role, permission);
  };

  const refreshUser = async () => {
    if (currentUser?.id) {
      const fresh = await userService.getUserById(currentUser.id);
      if (fresh) {
        setCurrentUser(fresh);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        user: currentUser,
        currentRole: currentUser?.role || null,
        role: currentUser?.role || null,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        loginWithCredentials,
        loginAs,
        switchRole,
        logout,
        hasPermission,
        refreshUser,
        setCurrentUserDirectly,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

