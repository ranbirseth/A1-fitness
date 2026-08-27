import http from "../../api/http";

export type BranchPayload = { name: string; branchCode: string; address?: string; phone?: string; email?: string; manager?: string; status?: string; description?: string };
export const getBranches = (params?: Record<string, unknown>) => http.get("/branches", { params });
export const createBranch = (payload: BranchPayload) => http.post("/branches", payload);
export const updateBranch = (id: string, payload: Partial<BranchPayload>) => http.patch(`/branches/${id}`, payload);
export const deleteBranch = (id: string) => http.delete(`/branches/${id}`);
export const getBranchOverview = (id: string) => http.get(`/branches/${id}/overview`);