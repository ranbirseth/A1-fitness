import http from "../../api/http";
export const getTrainers = () => http.get("/trainers");
export const createTrainer = (payload) => http.post("/trainers", payload);
export const deleteTrainer = (id) => http.delete(`/trainers/${id}`);
export const updateTrainer = (id, payload) => http.patch(`/trainers/${id}`, payload);
