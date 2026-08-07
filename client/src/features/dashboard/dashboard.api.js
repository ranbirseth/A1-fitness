import http from "../../api/http";
export const getDashboardStats = () => http.get("/dashboard/stats");
