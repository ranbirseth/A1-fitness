import http from "../../api/http";

export const getTrainers = () => http.get("/trainers");
export const createTrainer = (payload: Record<string, unknown>) => http.post("/trainers", payload);
export const deleteTrainer = (id: string) => http.delete(`/trainers/${id}`);
export const updateTrainer = (id: string, payload: Record<string, unknown>) => http.patch(`/trainers/${id}`, payload);
