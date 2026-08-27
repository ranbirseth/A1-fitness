import http from "../../api/http";

export const getDashboardStats = (params?: Record<string, any>) => http.get("/dashboard/stats", { params });
