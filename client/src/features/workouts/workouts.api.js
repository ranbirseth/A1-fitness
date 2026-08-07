import http from "../../api/http";
export const getWorkoutTemplates = () => http.get("/workouts/templates");
export const createWorkoutTemplate = (data) => http.post("/workouts/templates", data);
export const deleteWorkoutPlan = (id) => http.delete(`/workouts/${id}`);
export const assignWorkoutToMember = (data) => http.post("/workouts/assign", data);
export const getMyWorkout = () => http.get("/workouts/my-workout");
