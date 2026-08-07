import http from "../../api/http";

export type UpdateProfilePayload = {
  name: string;
  email: string;
  phone: string;
  password?: string;
  photo?: string;
  address?: string;
  emergencyContact?: string;
};

export const getMyProfile = () => http.get("/users/me");
export const updateProfile = (payload: UpdateProfilePayload) => http.put("/users/update-profile", payload);
