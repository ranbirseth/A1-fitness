import http from "../../api/http";

export const getPlans = () => http.get("/plans");
export const createPlan = (payload: Record<string, unknown>) => http.post("/plans", payload);
export const deletePlan = (id: string) => http.delete(`/plans/${id}`);
export const updatePlan = (id: string, payload: Record<string, unknown>) => http.patch(`/plans/${id}`, payload);
