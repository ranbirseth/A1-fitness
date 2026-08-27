import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getBranches } from "../features/branches/branches.api";

export interface BranchItem {
  _id: string;
  name: string;
  branchCode: string;
  address?: string;
  phone?: string;
  email?: string;
  status: string;
}

interface BranchState {
  branches: BranchItem[];
  selectedBranch: string; // "ALL" or specific branchCode
  loading: boolean;
  setSelectedBranch: (branchCode: string) => void;
  fetchBranches: () => Promise<BranchItem[]>;
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set, get) => ({
      branches: [],
      selectedBranch: "ALL",
      loading: false,
      setSelectedBranch: (branchCode: string) => set({ selectedBranch: branchCode }),
      fetchBranches: async () => {
        set({ loading: true });
        try {
          const res = await getBranches({ limit: 100 });
          const items: BranchItem[] = res.data?.data?.items || [];
          set({ branches: items, loading: false });
          return items;
        } catch (error) {
          console.error("Failed to fetch branches in store", error);
          set({ loading: false });
          return [];
        }
      },
    }),
    {
      name: "branch-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ selectedBranch: state.selectedBranch }),
    }
  )
);
