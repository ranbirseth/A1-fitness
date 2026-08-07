import http from "../../api/http";

export const getWorkoutTemplates = () => http.get("/workouts/templates");
export const createWorkoutTemplate = (data: any) => http.post("/workouts/templates", data);
export const deleteWorkoutPlan = (id: string) => http.delete(`/workouts/${id}`);
export const assignWorkoutToMember = (data: { memberId: string; templateId?: string; customPlan?: any }) => 
  http.post("/workouts/assign", data);
export const getMyWorkout = () => http.get("/workouts/my-workout");
