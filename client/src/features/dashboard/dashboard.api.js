import http from "../../api/http";
export const getDashboardStats = (params) => http.get("/dashboard/stats", { params });
