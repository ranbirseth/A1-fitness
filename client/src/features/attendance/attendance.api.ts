import http from "../../api/http";

export const memberCheckIn = (data: {
  location?: { latitude: number; longitude: number; accuracy: number };
  timezone?: string;
}) => http.post("/attendance/check-in", data);

export const memberCheckOut = (data: {
  location?: { latitude: number; longitude: number; accuracy: number };
}) => http.post("/attendance/check-out", data);

export const getMyAttendance = (params: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
} = {}) => {
  const { page = 1, limit = 10, startDate, endDate, status } = params;
  let url = `/attendance/me?page=${page}&limit=${limit}`;
  if (startDate) url += `&startDate=${startDate}`;
  if (endDate) url += `&endDate=${endDate}`;
  if (status) url += `&status=${status}`;
  return http.get(url);
};

export const getTodayAttendanceStatus = () => http.get("/attendance/me/today");

export const getMyAttendanceStats = (params?: { month?: number; year?: number }) => {
  let url = "/attendance/me/stats";
  if (params?.month) url += `?month=${params.month}`;
  if (params?.year) url += `${params?.month ? "&" : "?"}year=${params.year}`;
  return http.get(url);
};

export const getRealTimeStatus = () => http.get("/attendance/me/realtime");

export const exportMyAttendance = (
  format: "csv" | "pdf" = "csv",
  startDate?: string,
  endDate?: string
) => {
  let url = `/attendance/me/export?format=${format}`;
  if (startDate) url += `&startDate=${startDate}`;
  if (endDate) url += `&endDate=${endDate}`;
  return http.get(url, { responseType: "blob" as any });
};

export const markAttendance = (data: {
  secretCode: string;
  action: "check-in" | "check-out";
  memberId?: string;
  location?: { latitude: number; longitude: number; accuracy: number };
  timezone?: string;
}) => http.post("/attendance/mark", data);

export const getAttendance = (
  params: {
    search?: string;
    date?: string;
    page?: number;
    limit?: number;
  } = {}
) => {
  const { search = "", date = "", page = 1, limit = 50 } = params;
  let url = `/attendance?page=${page}&limit=${limit}`;
  if (search) url += `&search=${search}`;
  if (date) url += `&date=${date}`;
  return http.get(url);
};

export const manualCheckIn = (data: {
  memberId: string;
  action: "check-in" | "check-out";
}) => http.post("/attendance/mark", data);

export const getAttendanceHistory = (params: any) =>
  http.get("/attendance", { params });

export const updateAttendanceRecord = (
  id: string,
  data: { status?: string; notes?: string; checkIn?: string; checkOut?: string }
) => http.put(`/attendance/${id}`, data);

export const deleteAttendanceRecord = (id: string) =>
  http.delete(`/attendance/${id}`);