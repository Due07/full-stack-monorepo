import { create } from 'zustand';
import type { AuthUser } from '@/types/api';
import { clearAuthStorage, getAccessToken, getRefreshToken, getStoredUser, setAuthStorage } from '@/utils/auth-storage';

type AuthState = {
  hydrated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  currentUser: AuthUser | null;
  hydrate: () => void;
  setSession: (payload: { accessToken: string; refreshToken: string; user: AuthUser }) => void;
  setCurrentUser: (user: AuthUser | null) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  hydrated: false,
  accessToken: null,
  refreshToken: null,
  currentUser: null,
  hydrate: () => {
    set({
      hydrated: true,
      accessToken: getAccessToken(),
      refreshToken: getRefreshToken(),
      currentUser: getStoredUser(),
    });
  },
  setSession: ({ accessToken, refreshToken, user }) => {
    setAuthStorage({ accessToken, refreshToken, user });
    set({ accessToken, refreshToken, currentUser: user });
  },
  setCurrentUser: (user) => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    if (accessToken && refreshToken && user) {
      setAuthStorage({ accessToken, refreshToken, user });
    }

    set({ currentUser: user });
  },
  clearSession: () => {
    clearAuthStorage();
    set({ accessToken: null, refreshToken: null, currentUser: null });
  },
}));
