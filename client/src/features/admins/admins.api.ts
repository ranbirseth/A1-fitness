import http from "../../api/http";

export const getAdmins = (params?: Record<string, unknown>) => http.get("/admins", { params });
export const createAdmin = (payload: Record<string, unknown>) => http.post("/admins", payload);
export const updateAdmin = (id: string, payload: Record<string, unknown>) => http.patch(`/admins/${id}`, payload);
export const deleteAdmin = (id: string) => http.delete(`/admins/${id}`);
