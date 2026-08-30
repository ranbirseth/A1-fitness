import http from "../../api/http";

export const getWorkoutTemplates = (branchCode?: string) =>
  http.get(
    branchCode && branchCode !== "ALL"
      ? `/workouts/templates?branchCode=${encodeURIComponent(branchCode)}`
      : "/workouts/templates"
  );
export const createWorkoutTemplate = (data: any) => http.post("/workouts/templates", data);
export const updateWorkoutTemplate = (id: string, data: any) => http.patch(`/workouts/templates/${id}`, data);
export const deleteWorkoutPlan = (id: string) => http.delete(`/workouts/${id}`);
export const applyWorkoutTemplateToBranch = (templateId: string, branchCode: string) =>
  http.post(`/workouts/templates/${templateId}/branches`, { branchCode });
export const removeWorkoutTemplateFromBranch = (templateId: string, branchCode: string) =>
  http.delete(`/workouts/templates/${templateId}/branches`, { data: { branchCode } });
export const getWorkoutTemplateBranches = (templateId: string) =>
  http.get(`/workouts/templates/${templateId}/branches`);
export const assignWorkoutToMember = (data: { memberId: string; templateId?: string; customPlan?: any; branchCode?: string }) =>
  http.post("/workouts/assign", data);
export const getMyWorkout = () => http.get("/workouts/my-workout");