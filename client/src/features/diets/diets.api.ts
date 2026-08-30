import http from "../../api/http";

export const getDietTemplates = (branchCode?: string) =>
  http.get(
    branchCode && branchCode !== "ALL"
      ? `/diets/templates?branchCode=${encodeURIComponent(branchCode)}`
      : "/diets/templates"
  );
export const createDietTemplate = (data: any) => http.post("/diets/templates", data);
export const updateDietTemplate = (id: string, data: any) => http.patch(`/diets/templates/${id}`, data);
export const deleteDietPlan = (id: string) => http.delete(`/diets/${id}`);
export const applyDietTemplateToBranch = (templateId: string, branchCode: string) =>
  http.post(`/diets/templates/${templateId}/branches`, { branchCode });
export const removeDietTemplateFromBranch = (templateId: string, branchCode: string) =>
  http.delete(`/diets/templates/${templateId}/branches`, { data: { branchCode } });
export const getDietTemplateBranches = (templateId: string) =>
  http.get(`/diets/templates/${templateId}/branches`);
export const assignDietToMember = (data: { memberId: string; templateId?: string; customPlan?: any; branchCode?: string }) =>
  http.post("/diets/assign", data);
export const getMyDiet = () => http.get("/diets/my-diet");