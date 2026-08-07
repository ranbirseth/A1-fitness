import http from "../../api/http";
export const memberCheckIn = (data) => http.post("/attendance/check-in", data);
export const memberCheckOut = (data) => http.post("/attendance/check-out", data);
export const getMyAttendance = (params = {}) => {
    const { page = 1, limit = 10, startDate, endDate, status } = params;
    let url = `/attendance/me?page=${page}&limit=${limit}`;
    if (startDate)
        url += `&startDate=${startDate}`;
    if (endDate)
        url += `&endDate=${endDate}`;
    if (status)
        url += `&status=${status}`;
    return http.get(url);
};
export const getTodayAttendanceStatus = () => http.get("/attendance/me/today");
export const getMyAttendanceStats = (params) => {
    let url = "/attendance/me/stats";
    if (params?.month)
        url += `?month=${params.month}`;
    if (params?.year)
        url += `${params?.month ? "&" : "?"}year=${params.year}`;
    return http.get(url);
};
export const getRealTimeStatus = () => http.get("/attendance/me/realtime");
export const exportMyAttendance = (format = "csv", startDate, endDate) => {
    let url = `/attendance/me/export?format=${format}`;
    if (startDate)
        url += `&startDate=${startDate}`;
    if (endDate)
        url += `&endDate=${endDate}`;
    return http.get(url, { responseType: "blob" });
};
export const markAttendance = (data) => http.post("/attendance/mark", data);
export const getAttendance = (params = {}) => {
    const { search = "", date = "", page = 1, limit = 50 } = params;
    let url = `/attendance?page=${page}&limit=${limit}`;
    if (search)
        url += `&search=${search}`;
    if (date)
        url += `&date=${date}`;
    return http.get(url);
};
export const manualCheckIn = (data) => http.post("/attendance/mark", data);
export const getAttendanceHistory = (params) => http.get("/attendance", { params });
export const updateAttendanceRecord = (id, data) => http.put(`/attendance/${id}`, data);
export const deleteAttendanceRecord = (id) => http.delete(`/attendance/${id}`);
