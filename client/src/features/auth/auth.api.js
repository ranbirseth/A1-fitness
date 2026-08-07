import http from "../../api/http";
export const signup = (payload) => http.post("/auth/signup", payload);
export const login = (payload) => http.post("/auth/login", payload);
export const logout = () => http.post("/auth/logout", {});
export const forgotPassword = (payload) => http.post("/auth/forgot-password", payload);
export const resetPassword = (token, payload) => http.post(`/auth/reset-password/${token}`, payload);
