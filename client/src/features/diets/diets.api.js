import http from "../../api/http";
export const getDietTemplates = () => http.get("/diets/templates");
export const createDietTemplate = (data) => http.post("/diets/templates", data);
export const deleteDietPlan = (id) => http.delete(`/diets/${id}`);
export const assignDietToMember = (data) => http.post("/diets/assign", data);
export const getMyDiet = () => http.get("/diets/my-diet");
