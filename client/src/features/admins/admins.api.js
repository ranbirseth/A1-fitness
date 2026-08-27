import http from "../../api/http";
export const getAdmins = (params) => http.get("/admins", { params });
export const createAdmin = (payload) => http.post("/admins", payload);
export const updateAdmin = (id, payload) => http.patch(`/admins/${id}`, payload);
export const deleteAdmin = (id) => http.delete(`/admins/${id}`);
