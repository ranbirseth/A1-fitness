import http from "../../api/http";
export const getBranches = (params) => http.get("/branches", { params });
export const createBranch = (payload) => http.post("/branches", payload);
export const updateBranch = (id, payload) => http.patch(`/branches/${id}`, payload);
export const deleteBranch = (id) => http.delete(`/branches/${id}`);
export const getBranchOverview = (id) => http.get(`/branches/${id}/overview`);
