import http from "../../api/http";

export const getPlans = (params?: Record<string, unknown>) => http.get("/plans", { params });
export const createPlan = (payload: Record<string, unknown>) => http.post("/plans", payload);
export const deletePlan = (id: string) => http.delete(`/plans/${id}`);
export const updatePlan = (id: string, payload: Record<string, unknown>) => http.patch(`/plans/${id}`, payload);

export const applyPlanToBranch = (planId: string, branchCode: string) =>
  http.post(`/plans/${planId}/branches`, { branchCode });
export const removePlanFromBranch = (planId: string, branchCode: string) =>
  http.delete(`/plans/${planId}/branches`, { data: { branchCode } });
export const getPlanBranches = (planId: string) =>
  http.get(`/plans/${planId}/branches`);
