import http from "../../api/http";
export const getPlans = () => http.get("/plans");
export const createPlan = (payload) => http.post("/plans", payload);
export const deletePlan = (id) => http.delete(`/plans/${id}`);
export const updatePlan = (id, payload) => http.patch(`/plans/${id}`, payload);
