import http from "../../api/http";
export const getBookings = () => http.get("/bookings");
export const createBooking = (payload) => http.post("/bookings", payload);
export const cancelBooking = (bookingId) => http.patch(`/bookings/${bookingId}/cancel`);
export const applyReferral = (payload) => http.post("/referrals/apply", payload);
