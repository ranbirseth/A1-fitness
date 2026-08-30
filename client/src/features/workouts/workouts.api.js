import http from "../../api/http";
export const getWorkoutTemplates = (branchCode) => http.get(branchCode && branchCode !== "ALL"
    ? `/workouts/templates?branchCode=${encodeURIComponent(branchCode)}`
    : "/workouts/templates");
export const createWorkoutTemplate = (data) => http.post("/workouts/templates", data);
export const updateWorkoutTemplate = (id, data) => http.patch(`/workouts/templates/${id}`, data);
export const deleteWorkoutPlan = (id) => http.delete(`/workouts/${id}`);
export const applyWorkoutTemplateToBranch = (templateId, branchCode) => http.post(`/workouts/templates/${templateId}/branches`, { branchCode });
export const removeWorkoutTemplateFromBranch = (templateId, branchCode) => http.delete(`/workouts/templates/${templateId}/branches`, { data: { branchCode } });
export const getWorkoutTemplateBranches = (templateId) => http.get(`/workouts/templates/${templateId}/branches`);
export const assignWorkoutToMember = (data) => http.post("/workouts/assign", data);
export const getMyWorkout = () => http.get("/workouts/my-workout");
