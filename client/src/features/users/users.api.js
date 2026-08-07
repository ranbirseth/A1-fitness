import http from "../../api/http";
export const getMyProfile = () => http.get("/users/me");
export const updateProfile = (payload) => http.put("/users/update-profile", payload);
