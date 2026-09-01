import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
export const REMEMBER_KEY = "a1f_remember";
const STORAGE_NAME = "auth-storage";
export const setRemember = (remember) => {
    try {
        localStorage.setItem(REMEMBER_KEY, String(remember));
    }
    catch { }
};
const targetStorage = () => {
    try {
        return localStorage.getItem(REMEMBER_KEY) === "true" ? localStorage : sessionStorage;
    }
    catch {
        return sessionStorage;
    }
};
const clearAuthStorage = () => {
    try {
        localStorage.removeItem(STORAGE_NAME);
        sessionStorage.removeItem(STORAGE_NAME);
    }
    catch { }
};
const authStorage = () => targetStorage();
export const useAuthStore = create()(persist((set) => ({
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
        }
        catch { }
        set({ user: null, accessToken: null });
    },
}), {
    name: STORAGE_NAME,
    storage: createJSONStorage(authStorage),
}));
