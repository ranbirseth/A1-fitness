import http from "../../api/http";

export const signup = (payload: Record<string, unknown>) => http.post("/auth/signup", payload);
export const login = (payload: { gymId: string; email: string; password: string; role?: string }) => http.post("/auth/login", payload);
export const logout = () => http.post("/auth/logout", {});
export const forgotPassword = (payload: { email: string; gymId: string }) => http.post("/auth/forgot-password", payload);
export const resetPassword = (token: string, payload: { password: string }) => http.post(`/auth/reset-password/${token}`, payload);
