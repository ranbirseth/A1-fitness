import http from "../../api/http";

export const getDietTemplates = () => http.get("/diets/templates");
export const createDietTemplate = (data: any) => http.post("/diets/templates", data);
export const deleteDietPlan = (id: string) => http.delete(`/diets/${id}`);
export const assignDietToMember = (data: { memberId: string; templateId?: string; customPlan?: any }) => 
  http.post("/diets/assign", data);
export const getMyDiet = () => http.get("/diets/my-diet");
