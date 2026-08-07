import http from "../../api/http";

export const getBookings = () => http.get("/bookings");
export const createBooking = (payload: { classSlotId: string; memberId?: string }) => http.post("/bookings", payload);
export const cancelBooking = (bookingId: string) => http.patch(`/bookings/${bookingId}/cancel`);
export const applyReferral = (payload: { code: string; referredMemberId: string; benefit?: string }) =>
  http.post("/referrals/apply", payload);
