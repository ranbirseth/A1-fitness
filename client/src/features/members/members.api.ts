import http from "../../api/http";

export const getMembers = (params: { page?: number; limit?: number; search?: string; status?: string; trainerId?: string } = {}) => {
  const { page = 1, limit = 10, search = "", status, trainerId } = params;
  let url = `/members?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
  if (status) url += `&status=${status}`;
  if (trainerId) url += `&trainerId=${trainerId}`;
  return http.get(url);
};
export const createMember = (payload: Record<string, unknown>) => http.post("/members", payload);
export const updateMember = (id: string, payload: Record<string, unknown>) => http.put(`/members/${id}`, payload);
export const deleteMember = (id: string) => http.delete(`/members/${id}`);
export const searchMembers = (q: string, page = 1, limit = 10) =>
  http.get(`/members/search?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`);
export const assignPlan = (id: string, payload: { planId: string; membershipStartDate?: string }) =>
  http.patch(`/members/${id}/assign-plan`, payload);
export const renewPlan = (id: string, payload: { planId?: string }) => http.patch(`/members/${id}/renew-plan`, payload);
export const upgradePlan = (id: string, payload: { planId: string }) => http.patch(`/members/${id}/upgrade-plan`, payload);
export const cancelPlan = (id: string) => http.patch(`/members/${id}/cancel-plan`);
export const freezePlan = (id: string) => http.patch(`/members/${id}/freeze-plan`);
export const resumePlan = (id: string) => http.patch(`/members/${id}/resume-plan`);
export const approveMember = (id: string) => http.patch(`/members/${id}/approve`);
export const getMyProfile = () => http.get("/members/profile/me");
export const updateMyProfile = (payload: { name?: string; phone?: string; email?: string; photo?: string }) =>
  http.patch("/members/profile/me", payload);
