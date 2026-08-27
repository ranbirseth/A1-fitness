import http from "../../api/http";
export const getPlans = (params) => http.get("/plans", { params });
export const createPlan = (payload) => http.post("/plans", payload);
export const deletePlan = (id) => http.delete(`/plans/${id}`);
export const updatePlan = (id, payload) => http.patch(`/plans/${id}`, payload);
export const applyPlanToBranch = (planId, branchCode) => http.post(`/plans/${planId}/branches`, { branchCode });
export const removePlanFromBranch = (planId, branchCode) => http.delete(`/plans/${planId}/branches`, { data: { branchCode } });
export const getPlanBranches = (planId) => http.get(`/plans/${planId}/branches`);
