import http from "../../api/http";
import { useAuthStore } from "../../store/auth.store";

export const getPayments = (params?: Record<string, any>) =>
  http.get("/payments/my-payments", { params });
export const getAdminPayments = (params?: Record<string, any>) =>
  http.get("/payments", { params });
export const getInvoice = (paymentId: string) =>
  http.get(`/payments/${paymentId}/invoice`);
export const recordPayment = (payload: {
  member: string;
  plan: string;
  amount: number;
  method?: string;
  status?: string;
  note?: string;
  date?: string;
}) => http.post("/payments", payload);
export const markAsPaid = (paymentId: string) =>
  http.patch(`/payments/${paymentId}/paid`);
export const markAsUnpaid = (paymentId: string) =>
  http.patch(`/payments/${paymentId}/unpaid`);

export const sendReminders = (branchCode?: string) =>
  http.post("/payments/reminders", {}, { params: branchCode ? { branchCode } : {} });

export const getInvoiceDeliveryStatus = () =>
  http.get("/payments/delivery-status");

const getAccessToken = (): string => {
  try {
    return useAuthStore.getState().accessToken || "";
  } catch {
    return "";
  }
};

export const downloadInvoicePDF = async (
  paymentId: string,
  onProgress?: () => void
): Promise<void> => {
  try {
    const base = (http.defaults.baseURL || "").replace(/\/$/, "");
    const token = getAccessToken();
    const resp = await fetch(`${base}/payments/${paymentId}/pdf`, {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(text || "Failed to generate PDF");
    }
    const blob = await resp.blob();
    if (onProgress) onProgress();
    const url = window.URL.createObjectURL(blob);
    const cd = resp.headers.get("Content-Disposition") || "";
    const match = cd.match(/filename="?([^"]+)"?/);
    const filename = match?.[1] || `Invoice-${paymentId}.pdf`;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  } catch (err: any) {
    throw new Error(err?.message || "Unable to generate invoice PDF.");
  }
};
