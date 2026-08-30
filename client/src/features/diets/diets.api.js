import http from "../../api/http";
export const getDietTemplates = (branchCode) => http.get(branchCode && branchCode !== "ALL"
    ? `/diets/templates?branchCode=${encodeURIComponent(branchCode)}`
    : "/diets/templates");
export const createDietTemplate = (data) => http.post("/diets/templates", data);
export const updateDietTemplate = (id, data) => http.patch(`/diets/templates/${id}`, data);
export const deleteDietPlan = (id) => http.delete(`/diets/${id}`);
export const applyDietTemplateToBranch = (templateId, branchCode) => http.post(`/diets/templates/${templateId}/branches`, { branchCode });
export const removeDietTemplateFromBranch = (templateId, branchCode) => http.delete(`/diets/templates/${templateId}/branches`, { data: { branchCode } });
export const getDietTemplateBranches = (templateId) => http.get(`/diets/templates/${templateId}/branches`);
export const assignDietToMember = (data) => http.post("/diets/assign", data);
export const getMyDiet = () => http.get("/diets/my-diet");
