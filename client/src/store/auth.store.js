import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
export const useAuthStore = create()(persist((set) => ({
    user: null,
    accessToken: null,
    gymId: "MAIN",
    setAuth: (user, accessToken) => set({ user, accessToken }),
    setUser: (user) => set({ user }),
    setTokens: (accessToken) => set({ accessToken }),
    setGymId: (gymId) => set({ gymId }),
    logout: () => set({ user: null, accessToken: null }),
}), {
    name: "auth-storage", // name of the item in the storage (must be unique)
    storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
}));
