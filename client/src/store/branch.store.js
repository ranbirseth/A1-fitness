import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getBranches } from "../features/branches/branches.api";
export const useBranchStore = create()(persist((set, get) => ({
    branches: [],
    selectedBranch: "ALL",
    loading: false,
    setSelectedBranch: (branchCode) => set({ selectedBranch: branchCode }),
    fetchBranches: async () => {
        set({ loading: true });
        try {
            const res = await getBranches({ limit: 100 });
            const items = res.data?.data?.items || [];
            set({ branches: items, loading: false });
            return items;
        }
        catch (error) {
            console.error("Failed to fetch branches in store", error);
            set({ loading: false });
            return [];
        }
    },
}), {
    name: "branch-storage",
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({ selectedBranch: state.selectedBranch }),
}));
