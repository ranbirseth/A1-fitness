import http from "../../api/http";
export const getMembers = (params = {}) => {
    const { page = 1, limit = 10, search = "", status, trainerId } = params;
    let url = `/members?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
    if (status)
        url += `&status=${status}`;
    if (trainerId)
        url += `&trainerId=${trainerId}`;
    return http.get(url);
};
export const createMember = (payload) => http.post("/members", payload);
export const updateMember = (id, payload) => http.put(`/members/${id}`, payload);
export const deleteMember = (id) => http.delete(`/members/${id}`);
export const searchMembers = (q, page = 1, limit = 10) => http.get(`/members/search?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`);
export const assignPlan = (id, payload) => http.patch(`/members/${id}/assign-plan`, payload);
export const renewPlan = (id, payload) => http.patch(`/members/${id}/renew-plan`, payload);
export const upgradePlan = (id, payload) => http.patch(`/members/${id}/upgrade-plan`, payload);
export const cancelPlan = (id) => http.patch(`/members/${id}/cancel-plan`);
export const freezePlan = (id) => http.patch(`/members/${id}/freeze-plan`);
export const resumePlan = (id) => http.patch(`/members/${id}/resume-plan`);
export const approveMember = (id) => http.patch(`/members/${id}/approve`);
export const getMyProfile = () => http.get("/members/profile/me");
export const updateMyProfile = (payload) => http.patch("/members/profile/me", payload);
