import http from "../../api/http";

export type AnalyticsFilters = {
  range?: string;
  dateFrom?: string;
  dateTo?: string;
  planId?: string;
  trainerId?: string;
  branchCode?: string;
  memberStatus?: string;
  paymentStatus?: string;
  paymentMethod?: string;
};

export const getAnalyticsOverview = (params: AnalyticsFilters) => http.get("/analytics/overview", { params });
export const getAnalyticsFilters = () => http.get("/analytics/filters");
export const getRevenueReport = (params: AnalyticsFilters) => http.get("/analytics/revenue", { params });
export const getMembershipReport = (params: AnalyticsFilters) => http.get("/analytics/memberships", { params });
export const exportAnalytics = (params: AnalyticsFilters & { report: string; format: string }) =>
  http.get("/analytics/export", { params, responseType: "blob" });