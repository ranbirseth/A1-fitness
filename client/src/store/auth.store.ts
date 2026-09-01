import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type User = { 
  _id: string; 
  name: string; 
  email: string; 
  phone?: string;
  photo?: string;
  address?: string;
  emergencyContact?: string;
  role: "superadmin" | "admin" | "trainer" | "member";
  branchCode?: string;
  status?: "active" | "pending" | "inactive" | "expired" | "cancelled" | "frozen";
  paymentStatus?: "paid" | "pending";
} | null;

type AuthState = {
  user: User;
  accessToken: string | null;
  gymId: string;
  setAuth: (user: User, accessToken: string) => void;
  setUser: (user: User) => void;
  setTokens: (accessToken: string) => void;
  setGymId: (gymId: string) => void;
  logout: () => void;
};

export const REMEMBER_KEY = "a1f_remember";
const STORAGE_NAME = "auth-storage";

export const setRemember = (remember: boolean) => {
  try {
    localStorage.setItem(REMEMBER_KEY, String(remember));
  } catch {}
};

const targetStorage = (): Storage => {
  try {
    return localStorage.getItem(REMEMBER_KEY) === "true" ? localStorage : sessionStorage;
  } catch {
    return sessionStorage;
  }
};

const clearAuthStorage = () => {
  try {
    localStorage.removeItem(STORAGE_NAME);
    sessionStorage.removeItem(STORAGE_NAME);
  } catch {}
};

const authStorage = () => targetStorage();

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      gymId: "MAIN",
      setAuth: (user, accessToken) => set({ user, accessToken }),
      setUser: (user) => set({ user }),
      setTokens: (accessToken) => set({ accessToken }),
      setGymId: (gymId) => set({ gymId }),
      logout: () => {
        clearAuthStorage();
        try {
          localStorage.removeItem(REMEMBER_KEY);
        } catch {}
        set({ user: null, accessToken: null });
      },
    }),
    {
      name: STORAGE_NAME,
      storage: createJSONStorage(authStorage),
    }
  )
);
