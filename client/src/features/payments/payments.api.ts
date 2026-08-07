import http from "../../api/http";

export const getPayments = () => http.get("/payments/my-payments");
export const getAdminPayments = () => http.get("/payments");
export const getPendingDues = () => http.get("/payments/dues");
export const getInvoice = (paymentId: string) => http.get(`/payments/${paymentId}/invoice`);
export const recordPayment = (payload: { member: string; plan: string; amount: number; method?: string; status?: string; note?: string; date?: string }) => 
  http.post("/payments", payload);
export const markAsPaid = (paymentId: string) => http.patch(`/payments/${paymentId}/paid`);
export const markAsUnpaid = (paymentId: string) => http.patch(`/payments/${paymentId}/unpaid`);
export const createOnlinePaymentIntent = () => http.post("/payments/online/intent");
export const confirmOnlinePayment = (payload: { intentId: string; member: string; amount: number }) =>
  http.post("/payments/online/confirm", payload);
