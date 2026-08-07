import axios from "axios";
import { useAuthStore } from "../store/auth.store";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" }
});

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status !== 401 || error.config?._retry) throw error;
    error.config._retry = true;
    const { setTokens, logout } = useAuthStore.getState();
    try {
      const resp = await axios.post(`${http.defaults.baseURL}/auth/refresh`, {}, { withCredentials: true });
      const newAccessToken = resp.data.data.accessToken;
      setTokens(newAccessToken);
      error.config.headers.Authorization = `Bearer ${newAccessToken}`;
      return http(error.config);
    } catch (refreshError) {
      logout();
      window.location.href = "/login";
      throw refreshError;
    }
  }
);

export default http;
