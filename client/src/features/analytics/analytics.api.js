import http from "../../api/http";
export const getAnalyticsOverview = (params) => http.get("/analytics/overview", { params });
export const getAnalyticsFilters = () => http.get("/analytics/filters");
export const getRevenueReport = (params) => http.get("/analytics/revenue", { params });
export const getMembershipReport = (params) => http.get("/analytics/memberships", { params });
export const exportAnalytics = (params) => http.get("/analytics/export", { params, responseType: "blob" });
