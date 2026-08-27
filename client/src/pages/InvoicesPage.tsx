import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  FileText,
  Search,
  Filter,
  X,
  Calendar,
  Download,
  Printer,
  Send,
  Crown,
  AlertTriangle,
  TrendingUp,
  Check,
  Clock,
  DollarSign,
  Users,
  Mail,
  MessageCircle,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
  CreditCard,
  Phone,
  MapPin,
  Globe,
  Loader2
} from "lucide-react";
import Modal from "../components/Modal";
import { useAuthStore } from "../store/auth.store";
import { useBranchStore } from "../store/branch.store";
import {
  getAdminPayments,
  getPayments,
  getInvoice,
  getInvoiceDeliveryStatus,
  downloadInvoicePDF,
  markAsPaid,
  markAsUnpaid
} from "../features/payments/payments.api";

type PaymentItem = {
  _id: string;
  invoiceNumber: string;
  amount: number;
  date: string;
  method: string;
  status: "paid" | "pending";
  member?: {
    _id?: string;
    secretCode?: string;
    user?: { name?: string; email?: string; phone?: string; address?: string };
  };
  plan?: { _id?: string; name?: string; duration?: number; price?: number };
  createdAt?: string;
};

type InvoiceDetail = {
  _id: string;
  invoiceNumber: string;
  date: string;
  dueDate?: string | null;
  paymentDate?: string | null;
  status: "paid" | "pending";
  method: string;
  referenceId?: string;
  note?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  subtotal: number;
  total: number;
  lineItems: Array<{
    description: string;
    details?: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  billingPeriod?: { start: string; end: string } | null;
  business: {
    name: string;
    displayName: string;
    tagline: string;
    logo?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    gst?: string | null;
    currencySymbol: string;
  };
  member: {
    _id?: string;
    memberId?: string | null;
    branchCode?: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  plan: { _id?: string; name: string; duration?: number | null; price?: number };
};

type DeliveryStatus = {
  allowed: boolean;
  reason: string;
  message: string;
  availableProviders: Array<{
    key: string;
    name: string;
    configured: boolean;
    enabled: boolean;
  }>;
};

const formatCurrency = (val: number, sym = "\u20B9") =>
  `${sym}${Number(val || 0).toLocaleString("en-IN")}`;

const formatDate = (d?: string | null) => {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  } catch {
    return "-";
  }
};

const formatDateFull = (d?: string | null) => {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  } catch {
    return "-";
  }
};

const PAYMENT_METHODS = ["all", "cash", "card", "upi", "online"];
const STATUS_OPTIONS = ["all", "paid", "pending"];

const InvoicesPage: React.FC = () => {
  const { user } = useAuthStore();
  const { selectedBranch: globalBranch } = useBranchStore();
  const isSuperAdmin = user?.role === "superadmin";
  const isAdmin = isSuperAdmin || user?.role === "admin";
  const isTrainer = user?.role === "trainer";
  const canManage = isAdmin || isTrainer;

  const [items, setItems] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, count: 0 });

  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);

  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus | null>(null);
  const [targetInvoiceForSend, setTargetInvoiceForSend] = useState<PaymentItem | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit,
        q: searchQuery || undefined,
        status: statusFilter,
        method: methodFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      };
      if (isSuperAdmin && globalBranch && globalBranch !== 'ALL') {
        params.branchCode = globalBranch;
      }
      const resp = canManage
        ? await getAdminPayments(params)
        : await getPayments({ page, limit, status: statusFilter });
      const data = resp.data?.data || {};
      const list = Array.isArray(data) ? data : data.items || [];
      setItems(list);
      setTotal(Number(data.total) || list.length);

      if (canManage) {
        const totalAmt = list.reduce((a: number, p: any) => a + (p.amount || 0), 0);
        const paidAmt = list
          .filter((p: any) => p.status === "paid")
          .reduce((a: number, p: any) => a + (p.amount || 0), 0);
        const pendingAmt = list
          .filter((p: any) => p.status === "pending")
          .reduce((a: number, p: any) => a + (p.amount || 0), 0);
        setStats({ total: totalAmt, paid: paidAmt, pending: pendingAmt, count: list.length });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [canManage, isSuperAdmin, globalBranch, page, limit, searchQuery, statusFilter, methodFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const openInvoiceDetails = async (p: PaymentItem) => {
    setDetailsLoading(true);
    setDetailsModalOpen(true);
    try {
      const resp = await getInvoice(p._id);
      setSelectedInvoice(resp.data?.data as InvoiceDetail);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load invoice details");
      setDetailsModalOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDownloadPDF = async (p: PaymentItem) => {
    setPdfLoadingId(p._id);
    try {
      await downloadInvoicePDF(p._id);
      toast.success("Invoice downloaded successfully.");
    } catch (err: any) {
      toast.error(err?.message || "Unable to generate invoice PDF. Please try again.");
    } finally {
      setPdfLoadingId(null);
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContent = printRef.current;
    const printWindow = window.open("", "_blank", "width=900,height=1100");
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Invoice</title>
      <style>
        @page { size: A4; margin: 12mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; margin: 0; }
        ${Array.from(document.styleSheets).flatMap(s => {
          try { return Array.from(s.cssRules || []).map(r => r.cssText); } catch { return []; }
        }).join("\n")}
      </style></head><body>${printContent.outerHTML}</body></html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      try { printWindow.print(); } catch { window.print(); }
    }, 300);
  };

  const openSendInvoice = async (p: PaymentItem) => {
    setTargetInvoiceForSend(p);
    setDeliveryModalOpen(true);
    setDeliveryLoading(true);
    try {
      const resp = await getInvoiceDeliveryStatus();
      setDeliveryStatus(resp.data?.data as DeliveryStatus);
    } catch {
      setDeliveryStatus({
        allowed: false,
        reason: "subscription_required",
        message:
          "Invoice delivery is a premium feature. Email, WhatsApp and SMS are enabled after subscription and provider configuration.",
        availableProviders: [
          { key: "email", name: "Email (SMTP)", configured: false, enabled: false },
          { key: "whatsapp", name: "WhatsApp", configured: false, enabled: false },
          { key: "sms", name: "SMS", configured: false, enabled: false }
        ]
      });
    } finally {
      setDeliveryLoading(false);
    }
  };

  const togglePaymentStatus = async (p: PaymentItem) => {
    try {
      if (p.status === "pending") await markAsPaid(p._id);
      else await markAsUnpaid(p._id);
      toast.success(
        `Invoice marked as ${p.status === "pending" ? "paid" : "pending"}.`
      );
      fetchInvoices();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    }
  };

  const totalDisplayAmount = useMemo(() => {
    return items.reduce((a, p) => a + (p.amount || 0), 0);
  }, [items]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #invoice-print-area, #invoice-print-area * { visibility: visible !important; }
          #invoice-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            background: white !important;
            color: #111827 !important;
          }
          .print-hide, .print-hide * { display: none !important; }
          @page { size: A4; margin: 12mm; }
        }
        .pagination-btn {
          min-width: 36px; height: 36px; padding: 0 0.75rem;
          border-radius: 10px; border: 1px solid var(--clr-glass-border);
          background: var(--clr-bg-input); color: var(--clr-text-main);
          display: inline-flex; align-items: center; justify-content: center;
          font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s ease;
        }
        .pagination-btn:hover:not(:disabled) {
          background: var(--clr-glass-bg-hover); border-color: var(--clr-primary);
        }
        .pagination-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pagination-btn.active {
          background: var(--clr-accent-gradient); color: white; border-color: transparent;
          box-shadow: var(--shadow-glow);
        }
        .inv-info-label {
          font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em;
          color: #6b7280; font-weight: 700; margin-bottom: 0.35rem;
        }
        .inv-info-value { font-size: 0.95rem; color: #111827; font-weight: 500; }
        @media (max-width: 900px) {
          .inv-desktop-only { display: none !important; }
        }
        @media (min-width: 901px) {
          .inv-mobile-only { display: none !important; }
        }
        .inv-thumbnail {
          font-family: monospace; font-weight: 700; color: var(--clr-primary);
          background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.18);
          padding: 0.15rem 0.45rem; border-radius: 6px; font-size: 0.75rem;
        }
        .inv-print-wrap { background: white; color: #111827; padding: 20px; }
        .inv-print-table { width: 100%; border-collapse: collapse; }
        .inv-print-table th {
          background: #f9fafb; padding: 10px 12px; text-align: left;
          font-size: 11px; font-weight: 700; color: #374151; letter-spacing: 0.05em;
          text-transform: uppercase; border-bottom: 1px solid #e5e7eb;
        }
        .inv-print-table td {
          padding: 10px 12px; border-bottom: 1px dashed #e5e7eb; font-size: 13px;
        }
        .inv-print-totals td { padding: 6px 12px; border: none; font-size: 14px; }
      `}</style>

      {/* Page Header */}
      <div className="page-header flex-responsive" style={{ gap: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>Invoices</h1>
          <p className="text-muted" style={{ marginTop: "0.5rem", marginBottom: 0 }}>
            Manage, view, download and print invoices.
          </p>
        </div>
        {canManage && (
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              className="btn btn-secondary"
              onClick={fetchInvoices}
              disabled={loading}
              title="Refresh invoices"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      {canManage && (
        <div className="grid-stats" style={{ marginBottom: 0 }}>
          <div className="stat-card">
            <div className="stat-info">
              <h3>Total (this page)</h3>
              <div className="stat-value">{formatCurrency(totalDisplayAmount)}</div>
              <div className="stat-trend trend-up">
                <TrendingUp size={14} /> {items.length} invoices
              </div>
            </div>
            <div
              className="stat-icon"
              style={{ background: "rgba(139, 92, 246, 0.1)", color: "var(--clr-primary)" }}
            >
              <DollarSign size={22} />
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <h3>Paid</h3>
              <div className="stat-value" style={{ color: "var(--clr-success)" }}>
                {formatCurrency(stats.paid)}
              </div>
              <div className="stat-trend trend-up">
                <Check size={14} /> Received
              </div>
            </div>
            <div
              className="stat-icon"
              style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--clr-success)" }}
            >
              <Check size={22} />
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <h3>Pending</h3>
              <div className="stat-value" style={{ color: "var(--clr-warning)" }}>
                {formatCurrency(stats.pending)}
              </div>
              <div className="stat-trend" style={{ color: "var(--clr-warning)" }}>
                <Clock size={14} /> Awaiting
              </div>
            </div>
            <div
              className="stat-icon"
              style={{ background: "rgba(245, 158, 11, 0.1)", color: "var(--clr-warning)" }}
            >
              <Clock size={22} />
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <h3>All Invoices</h3>
              <div className="stat-value">{total}</div>
              <div className="stat-trend trend-up">
                <Users size={14} /> Total records
              </div>
            </div>
            <div
              className="stat-icon"
              style={{ background: "rgba(6, 182, 212, 0.1)", color: "var(--clr-secondary)" }}
            >
              <FileText size={22} />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div
        className="glass-panel"
        style={{
          padding: "1.25rem",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "center"
        }}
      >
        <div style={{ position: "relative", flex: "1 1 260px", minWidth: "240px" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "1rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--clr-primary)",
              opacity: 0.8
            }}
          />
          <input
            type="text"
            placeholder={
              canManage
                ? "Search invoice #, member name, ID, phone, email..."
                : "Search by invoice #..."
            }
            className="form-input"
            style={{ paddingLeft: "2.75rem", paddingRight: searchQuery ? "2.75rem" : "1rem" }}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setPage(1);
              }}
              className="btn-icon"
              style={{
                position: "absolute",
                right: "0.5rem",
                top: "50%",
                transform: "translateY(-50%)",
                width: "28px",
                height: "28px"
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "var(--clr-bg-input)",
              padding: "0.25rem 0.75rem",
              borderRadius: "var(--border-radius-md)",
              border: "1px solid var(--clr-glass-border)",
              height: "44px"
            }}
          >
            <Filter size={16} style={{ color: "var(--clr-primary)" }} />
            <select
              className="form-input"
              style={{
                width: "120px",
                border: "none",
                background: "transparent",
                padding: 0,
                height: "auto"
              }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {canManage && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "var(--clr-bg-input)",
                padding: "0.25rem 0.75rem",
                borderRadius: "var(--border-radius-md)",
                border: "1px solid var(--clr-glass-border)",
                height: "44px"
              }}
            >
              <CreditCard size={16} style={{ color: "var(--clr-primary)" }} />
              <select
                className="form-input"
                style={{
                  width: "130px",
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  height: "auto",
                  textTransform: "capitalize"
                }}
                value={methodFilter}
                onChange={(e) => {
                  setMethodFilter(e.target.value);
                  setPage(1);
                }}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m === "all" ? "All Methods" : m.charAt(0).toUpperCase() + m.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {canManage && (
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <Calendar size={16} style={{ color: "var(--clr-primary)" }} />
              <input
                type="date"
                className="form-input"
                style={{ width: "140px", height: "44px", padding: "0 0.75rem" }}
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
              />
              <span className="text-muted" style={{ fontSize: "0.85rem" }}>
                to
              </span>
              <input
                type="date"
                className="form-input"
                style={{ width: "140px", height: "44px", padding: "0 0.75rem" }}
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
              />
              {(dateFrom || dateTo) && (
                <button
                  className="btn-icon"
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                    setPage(1);
                  }}
                  title="Clear dates"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Invoices List */}
      <div className="glass-panel" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "5rem" }}>
            <div className="spinner" style={{ margin: "0 auto" }}></div>
            <p className="text-muted" style={{ marginTop: "1rem" }}>
              Loading invoices...
            </p>
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "5rem 2rem" }}>
            <div
              style={{
                width: "96px",
                height: "96px",
                borderRadius: "50%",
                background: "rgba(139, 92, 246, 0.06)",
                border: "1px dashed rgba(139, 92, 246, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.5rem"
              }}
            >
              <FileText size={44} style={{ color: "var(--clr-primary)", opacity: 0.5 }} />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              No invoices found
            </h3>
            <p className="text-muted" style={{ fontSize: "0.95rem", marginBottom: 0 }}>
              {searchQuery || statusFilter !== "all" || methodFilter !== "all" || dateFrom || dateTo
                ? "Try adjusting your search or filters to find what you\u2019re looking for."
                : canManage
                  ? "Record a payment to generate your first invoice."
                  : "You haven\u2019t received any invoices yet."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="table-container hide-on-mobile" style={{ margin: 0, border: "none", background: "transparent" }}>
              <table className="data-table" style={{ minWidth: "900px" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "1rem 1.5rem" }}>Invoice</th>
                    <th style={{ padding: "1rem" }}>{canManage ? "Member" : "Plan"}</th>
                    <th style={{ padding: "1rem" }} className="inv-desktop-only">Date</th>
                    <th style={{ padding: "1rem", textAlign: "right" }}>Amount</th>
                    <th style={{ padding: "1rem" }} className="inv-desktop-only">Payment</th>
                    <th style={{ padding: "1rem" }}>Status</th>
                    <th style={{ padding: "1rem 1.5rem", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => (
                    <tr key={p._id}>
                      <td style={{ padding: "1rem 1.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "10px",
                              background:
                                "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.12))",
                              color: "var(--clr-primary)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0
                            }}
                          >
                            <FileText size={18} />
                          </div>
                          <div>
                            <p style={{ fontWeight: 700, margin: 0, fontSize: "0.95rem" }}>
                              <span className="inv-thumbnail">{p.invoiceNumber}</span>
                            </p>
                            <p
                              className="text-muted"
                              style={{ fontSize: "0.8rem", margin: "0.25rem 0 0 0" }}
                            >
                              {canManage
                                ? p.plan?.name || "Membership"
                                : p.plan?.name || "Membership"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        {canManage ? (
                          <div>
                            <p style={{ fontWeight: 600, margin: 0 }}>
                              {p.member?.user?.name || "Unknown Member"}
                            </p>
                            <p
                              className="text-muted"
                              style={{ fontSize: "0.78rem", margin: "0.15rem 0 0 0" }}
                            >
                              {p.member?.secretCode
                                ? `#${p.member.secretCode} \u00B7 `
                                : ""}
                              {p.member?.user?.phone || p.member?.user?.email || "-"}
                            </p>
                          </div>
                        ) : (
                          <span className="status-badge active" style={{ fontSize: "0.8rem" }}>
                            {p.plan?.name || "Membership"}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "1rem" }} className="inv-desktop-only">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            fontSize: "0.85rem"
                          }}
                        >
                          <Calendar size={14} className="text-muted" />
                          {formatDate(p.date || p.createdAt)}
                        </div>
                      </td>
                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        <span
                          style={{
                            fontWeight: 800,
                            color: "var(--clr-primary)",
                            fontSize: "1rem"
                          }}
                        >
                          {formatCurrency(p.amount)}
                        </span>
                      </td>
                      <td style={{ padding: "1rem" }} className="inv-desktop-only">
                        <span
                          style={{
                            fontSize: "0.85rem",
                            textTransform: "capitalize",
                            color: "var(--clr-text-muted)",
                            fontWeight: 500
                          }}
                        >
                          {p.method || "cash"}
                        </span>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <button
                          onClick={() => canManage && togglePaymentStatus(p)}
                          className={`status-badge ${p.status === "paid" ? "active" : "pending"}`}
                          style={{
                            border: "none",
                            cursor: canManage ? "pointer" : "default",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                          disabled={!canManage}
                        >
                          {p.status === "paid" ? <Check size={12} /> : <Clock size={12} />}
                          {p.status}
                        </button>
                      </td>
                      <td style={{ padding: "1rem 1.5rem", textAlign: "right" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: "0.35rem",
                            justifyContent: "flex-end",
                            flexWrap: "wrap"
                          }}
                        >
                          <button
                            className="btn-icon"
                            title="View Invoice"
                            onClick={() => openInvoiceDetails(p)}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="btn-icon"
                            title="Download PDF"
                            onClick={() => handleDownloadPDF(p)}
                            disabled={pdfLoadingId === p._id}
                          >
                            {pdfLoadingId === p._id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Download size={16} />
                            )}
                          </button>
                          <button
                            className="btn-icon"
                            title="Print"
                            onClick={async () => {
                              await openInvoiceDetails(p);
                            }}
                          >
                            <Printer size={16} />
                          </button>
                          {canManage && (
                            <>
                              <button
                                className="btn-icon"
                                title="Send Invoice"
                                onClick={() => openSendInvoice(p)}
                                style={{
                                  background: "rgba(245, 158, 11, 0.08)",
                                  color: "var(--clr-warning)",
                                  borderColor: "rgba(245, 158, 11, 0.2)"
                                }}
                              >
                                <Send size={16} />
                              </button>
                              <div className="inv-desktop-only">
                                <button className="btn-icon" title="More Options">
                                  <MoreVertical size={16} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="mobile-cards-container" style={{ padding: "1.25rem" }}>
              {items.map((p) => (
                <div key={p._id} className="mobile-card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "1rem",
                      marginBottom: "0.5rem"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "10px",
                          background:
                            "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.12))",
                          color: "var(--clr-primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <FileText size={18} />
                      </div>
                      <div>
                        <p
                          style={{
                            fontWeight: 700,
                            margin: 0,
                            fontFamily: "monospace",
                            color: "var(--clr-primary)",
                            fontSize: "0.9rem"
                          }}
                        >
                          {p.invoiceNumber}
                        </p>
                        <p
                          className="text-muted"
                          style={{ fontSize: "0.8rem", margin: "0.1rem 0 0 0" }}
                        >
                          {p.plan?.name || "Membership"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`status-badge ${p.status === "paid" ? "active" : "pending"}`}
                      style={{ fontSize: "0.75rem" }}
                    >
                      {p.status}
                    </span>
                  </div>

                  {canManage && p.member?.user?.name && (
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Member</span>
                      <span className="mobile-card-value" style={{ fontWeight: 600 }}>
                        {p.member.user.name}
                      </span>
                    </div>
                  )}

                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Date</span>
                    <span className="mobile-card-value">{formatDate(p.date || p.createdAt)}</span>
                  </div>

                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Method</span>
                    <span className="mobile-card-value" style={{ textTransform: "capitalize" }}>
                      {p.method || "cash"}
                    </span>
                  </div>

                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Amount</span>
                    <span
                      className="mobile-card-value"
                      style={{ fontWeight: 800, color: "var(--clr-primary)", fontSize: "1rem" }}
                    >
                      {formatCurrency(p.amount)}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: "0.5rem",
                      marginTop: "0.75rem"
                    }}
                  >
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "0.5rem", fontSize: "0.8rem" }}
                      onClick={() => openInvoiceDetails(p)}
                    >
                      <Eye size={14} /> View
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "0.5rem", fontSize: "0.8rem" }}
                      onClick={() => handleDownloadPDF(p)}
                      disabled={pdfLoadingId === p._id}
                    >
                      {pdfLoadingId === p._id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Download size={14} />
                      )}
                      PDF
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "0.5rem", fontSize: "0.8rem" }}
                      onClick={() => openInvoiceDetails(p)}
                    >
                      <Printer size={14} /> Print
                    </button>
                    {canManage && (
                      <button
                        className="btn"
                        style={{
                          padding: "0.5rem",
                          fontSize: "0.8rem",
                          background: "rgba(245, 158, 11, 0.08)",
                          color: "var(--clr-warning)",
                          border: "1px solid rgba(245, 158, 11, 0.2)"
                        }}
                        onClick={() => openSendInvoice(p)}
                      >
                        <Send size={14} /> Send
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  padding: "1.25rem 1.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                  flexWrap: "wrap",
                  borderTop: "1px solid var(--clr-glass-border)"
                }}
              >
                <p className="text-muted" style={{ fontSize: "0.9rem", margin: 0 }}>
                  Showing <strong style={{ color: "var(--clr-text-main)" }}>{(page - 1) * limit + 1}</strong>{" "}
                  -{" "}
                  <strong style={{ color: "var(--clr-text-main)" }}>
                    {Math.min(page * limit, total)}
                  </strong>{" "}
                  of <strong style={{ color: "var(--clr-text-main)" }}>{total}</strong> invoices
                </p>
                <div style={{ display: "flex", gap: "0.35rem", alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    className="pagination-btn"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (page <= 3) pageNum = i + 1;
                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = page - 2 + i;
                    return (
                      <button
                        key={pageNum}
                        className={`pagination-btn ${page === pageNum ? "active" : ""}`}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    className="pagination-btn"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Invoice Details Modal */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="Invoice Details"
      >
        {detailsLoading ? (
          <div style={{ padding: "3rem 1rem", textAlign: "center" }}>
            <div className="spinner" style={{ margin: "0 auto" }}></div>
            <p className="text-muted" style={{ marginTop: "1rem" }}>
              Loading invoice details...
            </p>
          </div>
        ) : selectedInvoice ? (
          <div>
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                flexWrap: "wrap",
                marginBottom: "1.25rem",
                paddingBottom: "1rem",
                borderBottom: "1px solid var(--clr-glass-border)"
              }}
              className="print-hide"
            >
              <button className="btn btn-primary" onClick={handlePrint}>
                <Printer size={16} /> Print Invoice
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleDownloadPDF({ _id: selectedInvoice._id } as PaymentItem)}
                disabled={pdfLoadingId === selectedInvoice._id}
              >
                {pdfLoadingId === selectedInvoice._id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                Download PDF
              </button>
              {canManage && (
                <button
                  className="btn"
                  style={{
                    background: "rgba(245, 158, 11, 0.08)",
                    color: "var(--clr-warning)",
                    border: "1px solid rgba(245, 158, 11, 0.2)",
                    fontWeight: 600
                  }}
                  onClick={() => {
                    setDetailsModalOpen(false);
                    openSendInvoice({
                      _id: selectedInvoice._id,
                      invoiceNumber: selectedInvoice.invoiceNumber,
                      amount: selectedInvoice.total,
                      status: selectedInvoice.status,
                      date: selectedInvoice.date,
                      method: selectedInvoice.method
                    } as PaymentItem);
                  }}
                >
                  <Send size={16} /> Send Invoice
                </button>
              )}
            </div>

            {/* Professional Invoice Print Area */}
            <div id="invoice-print-area" className="inv-print-wrap" ref={printRef}>
              <div style={{ maxWidth: "780px", margin: "0 auto" }}>
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1.5rem",
                    marginBottom: "1.5rem",
                    paddingBottom: "1.25rem",
                    borderBottom: "2px solid #8b5cf6",
                    alignItems: "flex-start",
                    flexWrap: "wrap"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    {selectedInvoice.business.logo ? (
                      <img
                        src={selectedInvoice.business.logo}
                        alt={selectedInvoice.business.displayName}
                        style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "12px",
                          objectFit: "cover",
                          border: "1px solid #e5e7eb"
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "12px",
                          background: "linear-gradient(135deg,#8b5cf6,#06b6d4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: 800
                        }}
                      >
                        {(selectedInvoice.business.displayName || "A1").charAt(0)}
                      </div>
                    )}
                    <div>
                      <h2
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: 800,
                          margin: 0,
                          background: "linear-gradient(135deg,#8b5cf6,#ec4899)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                          letterSpacing: "0.02em"
                        }}
                      >
                        {selectedInvoice.business.displayName}
                      </h2>
                      <p style={{ color: "#6b7280", fontSize: "0.85rem", margin: "0.2rem 0 0 0" }}>
                        {selectedInvoice.business.tagline}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p
                      style={{
                        fontSize: "0.7rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "#6b7280",
                        fontWeight: 700,
                        margin: 0
                      }}
                    >
                      Invoice
                    </p>
                    <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0.25rem 0 0 0" }}>
                      <span style={{ fontFamily: "monospace" }}>
                        #{selectedInvoice.invoiceNumber}
                      </span>
                    </h3>
                  </div>
                </div>

                {/* Business + Invoice details */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "1.5rem",
                    marginBottom: "2rem"
                  }}
                >
                  <div>
                    <div className="inv-info-label">From</div>
                    <div className="inv-info-value" style={{ fontWeight: 700 }}>
                      {selectedInvoice.business.displayName}
                    </div>
                    {selectedInvoice.business.address && (
                      <div style={{ fontSize: "0.88rem", color: "#4b5563", marginTop: "0.25rem" }}>
                        <MapPin
                          size={12}
                          style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }}
                        />
                        {selectedInvoice.business.address}
                      </div>
                    )}
                    {selectedInvoice.business.phone && (
                      <div style={{ fontSize: "0.88rem", color: "#4b5563", marginTop: "0.15rem" }}>
                        <Phone
                          size={12}
                          style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }}
                        />
                        {selectedInvoice.business.phone}
                      </div>
                    )}
                    {selectedInvoice.business.email && (
                      <div style={{ fontSize: "0.88rem", color: "#4b5563", marginTop: "0.15rem" }}>
                        <Mail
                          size={12}
                          style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }}
                        />
                        {selectedInvoice.business.email}
                      </div>
                    )}
                    {selectedInvoice.business.website && (
                      <div style={{ fontSize: "0.88rem", color: "#06b6d4", marginTop: "0.15rem" }}>
                        <Globe
                          size={12}
                          style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }}
                        />
                        {selectedInvoice.business.website}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="inv-info-label">Bill To</div>
                    <div className="inv-info-value" style={{ fontWeight: 700 }}>
                      {selectedInvoice.member.name || "Member"}
                    </div>
                    {selectedInvoice.member.memberId && (
                      <div style={{ fontSize: "0.82rem", color: "#6b7280", marginTop: "0.15rem" }}>
                        Member ID:{" "}
                        <span style={{ fontFamily: "monospace", fontWeight: 600 }}>
                          {selectedInvoice.member.memberId}
                        </span>
                      </div>
                    )}
                    {selectedInvoice.member.email && (
                      <div style={{ fontSize: "0.88rem", color: "#4b5563", marginTop: "0.15rem" }}>
                        <Mail
                          size={12}
                          style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }}
                        />
                        {selectedInvoice.member.email}
                      </div>
                    )}
                    {selectedInvoice.member.phone && (
                      <div style={{ fontSize: "0.88rem", color: "#4b5563", marginTop: "0.15rem" }}>
                        <Phone
                          size={12}
                          style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }}
                        />
                        {selectedInvoice.member.phone}
                      </div>
                    )}
                    {selectedInvoice.member.address && (
                      <div style={{ fontSize: "0.88rem", color: "#4b5563", marginTop: "0.15rem" }}>
                        <MapPin
                          size={12}
                          style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }}
                        />
                        {selectedInvoice.member.address}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="inv-info-label">Invoice Details</div>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <tbody>
                        <tr>
                          <td
                            style={{
                              fontSize: "0.85rem",
                              color: "#6b7280",
                              padding: "3px 0"
                            }}
                          >
                            Invoice Date
                          </td>
                          <td
                            style={{
                              fontSize: "0.85rem",
                              color: "#111827",
                              fontWeight: 600,
                              textAlign: "right",
                              padding: "3px 0"
                            }}
                          >
                            {formatDateFull(selectedInvoice.date)}
                          </td>
                        </tr>
                        {selectedInvoice.dueDate && (
                          <tr>
                            <td style={{ fontSize: "0.85rem", color: "#6b7280", padding: "3px 0" }}>
                              Due Date
                            </td>
                            <td
                              style={{
                                fontSize: "0.85rem",
                                color: "#111827",
                                fontWeight: 600,
                                textAlign: "right",
                                padding: "3px 0"
                              }}
                            >
                              {formatDateFull(selectedInvoice.dueDate)}
                            </td>
                          </tr>
                        )}
                        <tr>
                          <td style={{ fontSize: "0.85rem", color: "#6b7280", padding: "3px 0" }}>
                            Status
                          </td>
                          <td style={{ textAlign: "right", padding: "3px 0" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "0.15rem 0.55rem",
                                borderRadius: "999px",
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.03em",
                                background:
                                  selectedInvoice.status === "paid"
                                    ? "rgba(16,185,129,0.1)"
                                    : "rgba(245,158,11,0.1)",
                                color:
                                  selectedInvoice.status === "paid" ? "#10b981" : "#f59e0b"
                              }}
                            >
                              {selectedInvoice.status}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontSize: "0.85rem", color: "#6b7280", padding: "3px 0" }}>
                            Method
                          </td>
                          <td
                            style={{
                              fontSize: "0.85rem",
                              color: "#111827",
                              fontWeight: 600,
                              textAlign: "right",
                              textTransform: "capitalize",
                              padding: "3px 0"
                            }}
                          >
                            {selectedInvoice.method || "Cash"}
                          </td>
                        </tr>
                        {selectedInvoice.paymentDate &&
                          selectedInvoice.status === "paid" && (
                            <tr>
                              <td
                                style={{ fontSize: "0.85rem", color: "#6b7280", padding: "3px 0" }}
                              >
                                Paid On
                              </td>
                              <td
                                style={{
                                  fontSize: "0.85rem",
                                  color: "#10b981",
                                  fontWeight: 600,
                                  textAlign: "right",
                                  padding: "3px 0"
                                }}
                              >
                                {formatDateFull(selectedInvoice.paymentDate)}
                              </td>
                            </tr>
                          )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Line Items */}
                <table className="inv-print-table" style={{ marginBottom: "1.5rem" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", width: "46%" }}>Description</th>
                      <th style={{ textAlign: "center", width: "12%" }}>Qty</th>
                      <th style={{ textAlign: "right", width: "18%" }}>Unit</th>
                      <th style={{ textAlign: "right", width: "24%" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.lineItems.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: "14px", color: "#111827" }}>
                            {item.description}
                          </div>
                          {item.details && (
                            <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
                              {item.details}
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: "center" }}>{item.quantity || 1}</td>
                        <td style={{ textAlign: "right", fontFamily: "monospace" }}>
                          {formatCurrency(item.unitPrice, selectedInvoice.business.currencySymbol)}
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            fontWeight: 600,
                            fontFamily: "monospace"
                          }}
                        >
                          {formatCurrency(item.amount, selectedInvoice.business.currencySymbol)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: "2rem"
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      maxWidth: "320px",
                      borderCollapse: "collapse"
                    }}
                    className="inv-print-totals"
                  >
                    <tbody>
                      <tr>
                        <td style={{ color: "#6b7280" }}>Subtotal</td>
                        <td
                          style={{
                            textAlign: "right",
                            fontWeight: 600,
                            fontFamily: "monospace",
                            color: "#111827"
                          }}
                        >
                          {formatCurrency(
                            selectedInvoice.subtotal,
                            selectedInvoice.business.currencySymbol
                          )}
                        </td>
                      </tr>
                      {selectedInvoice.discount > 0 && (
                        <tr>
                          <td style={{ color: "#10b981" }}>Discount</td>
                          <td
                            style={{
                              textAlign: "right",
                              fontWeight: 600,
                              fontFamily: "monospace",
                              color: "#10b981"
                            }}
                          >
                            -
                            {formatCurrency(
                              selectedInvoice.discount,
                              selectedInvoice.business.currencySymbol
                            )}
                          </td>
                        </tr>
                      )}
                      {selectedInvoice.tax > 0 && (
                        <tr>
                          <td style={{ color: "#6b7280" }}>Tax</td>
                          <td
                            style={{
                              textAlign: "right",
                              fontWeight: 600,
                              fontFamily: "monospace",
                              color: "#111827"
                            }}
                          >
                            {formatCurrency(
                              selectedInvoice.tax,
                              selectedInvoice.business.currencySymbol
                            )}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan={2} style={{ padding: "6px 0" }}>
                          <div
                            style={{
                              height: "1px",
                              background: "#e5e7eb",
                              margin: "4px 0"
                            }}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ color: "#111827", fontWeight: 700, fontSize: "1rem" }}>
                          Total
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            fontWeight: 800,
                            fontSize: "1.15rem",
                            fontFamily: "monospace",
                            color: "#8b5cf6"
                          }}
                        >
                          {formatCurrency(
                            selectedInvoice.total,
                            selectedInvoice.business.currencySymbol
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Extra Info */}
                {(selectedInvoice.referenceId ||
                  selectedInvoice.billingPeriod?.start ||
                  selectedInvoice.note) && (
                  <div
                    style={{
                      background: "#f9fafb",
                      padding: "0.9rem 1rem",
                      borderRadius: "8px",
                      marginBottom: "1.5rem",
                      border: "1px solid #f3f4f6"
                    }}
                  >
                    {selectedInvoice.referenceId && (
                      <p style={{ fontSize: "12px", color: "#4b5563", margin: "0 0 0.25rem 0" }}>
                        <strong>Transaction ID:</strong>{" "}
                        <span style={{ fontFamily: "monospace" }}>
                          {selectedInvoice.referenceId}
                        </span>
                      </p>
                    )}
                    {selectedInvoice.billingPeriod?.start && selectedInvoice.billingPeriod?.end && (
                      <p style={{ fontSize: "12px", color: "#4b5563", margin: "0 0 0.25rem 0" }}>
                        <strong>Billing Period:</strong>{" "}
                        {formatDateFull(selectedInvoice.billingPeriod.start)} -{" "}
                        {formatDateFull(selectedInvoice.billingPeriod.end)}
                      </p>
                    )}
                    {selectedInvoice.note && (
                      <p style={{ fontSize: "12px", color: "#4b5563", margin: 0 }}>
                        <strong>Note:</strong> {selectedInvoice.note}
                      </p>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div
                  style={{
                    textAlign: "center",
                    paddingTop: "1rem",
                    borderTop: "1px dashed #d1d5db"
                  }}
                >
                  <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 0.35rem 0" }}>
                    Thank you for your business!
                  </p>
                  <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>
                    This is a computer-generated invoice. No signature required.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Subscription Lock: Send Invoice Modal */}
      <Modal isOpen={deliveryModalOpen} onClose={() => setDeliveryModalOpen(false)} title="">
        <div style={{ padding: "0.25rem" }}>
          {/* Hero header */}
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: "var(--border-radius-lg)",
              padding: "1.75rem 1.5rem",
              background:
                "linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(245,158,11,0.12) 50%, rgba(6,182,212,0.12) 100%)",
              border: "1px solid rgba(139,92,246,0.2)",
              marginBottom: "1.5rem",
              textAlign: "center"
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem",
                boxShadow: "0 8px 24px rgba(245,158,11,0.3)"
              }}
            >
              <Crown size={28} style={{ color: "white" }} />
            </div>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 800,
                margin: "0 0 0.4rem 0",
                background: "linear-gradient(135deg, #f59e0b, #ec4899)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}
            >
              Invoice Sending \u2014 Subscription Required
            </h3>
            <p className="text-muted" style={{ fontSize: "0.9rem", margin: 0 }}>
              Deliver invoices automatically via Email, WhatsApp or SMS.
            </p>
            {targetInvoiceForSend && (
              <div
                style={{
                  marginTop: "1rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.35rem 0.75rem",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)"
                }}
              >
                <FileText size={14} style={{ color: "var(--clr-primary)" }} />
                <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.8rem" }}>
                  {targetInvoiceForSend.invoiceNumber}
                </span>
                <span style={{ fontWeight: 600, fontSize: "0.8rem", color: "var(--clr-primary)" }}>
                  {formatCurrency(targetInvoiceForSend.amount)}
                </span>
              </div>
            )}
          </div>

          {/* Alert */}
          <div
            style={{
              display: "flex",
              gap: "0.85rem",
              padding: "1rem 1rem",
              borderRadius: "var(--border-radius-md)",
              background: "rgba(245,158,11,0.06)",
              border: "1px solid rgba(245,158,11,0.2)",
              marginBottom: "1.25rem"
            }}
          >
            <AlertTriangle size={20} style={{ color: "var(--clr-warning)", flexShrink: 0 }} />
            <div>
              <p style={{ fontWeight: 600, margin: "0 0 0.2rem 0", fontSize: "0.92rem" }}>
                Premium feature is currently locked
              </p>
              <p
                className="text-muted"
                style={{ fontSize: "0.82rem", margin: 0, lineHeight: 1.55 }}
              >
                {deliveryStatus?.message ||
                  "Invoice delivery via Email, WhatsApp and SMS is a paid premium feature. External provider charges may apply (SMTP, WhatsApp Business API, SMS gateway). Delivery services will become available after subscription and provider credentials are configured by an administrator."}
              </p>
            </div>
          </div>

          {/* Delivery channels */}
          <h4
            style={{
              fontSize: "0.78rem",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--clr-text-muted)",
              fontWeight: 700,
              margin: "0 0 0.85rem 0"
            }}
          >
            Available delivery channels
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
            {(deliveryStatus?.availableProviders || []).map((p) => {
              const icon =
                p.key === "email" ? (
                  <Mail size={18} />
                ) : p.key === "whatsapp" ? (
                  <MessageCircle size={18} />
                ) : (
                  <Smartphone size={18} />
                );
              return (
                <div
                  key={p.key}
                  style={{
                    padding: "1rem",
                    borderRadius: "var(--border-radius-md)",
                    background: "var(--clr-bg-input)",
                    border: "1px solid var(--clr-glass-border)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    opacity: 0.6
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: "rgba(245,158,11,0.1)",
                      color: "var(--clr-warning)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    {icon}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, margin: 0, fontSize: "0.88rem" }}>{p.name}</p>
                    <p
                      style={{
                        fontSize: "0.72rem",
                        margin: "0.15rem 0 0 0",
                        color: "var(--clr-text-muted)"
                      }}
                    >
                      {p.configured && p.enabled ? "Ready" : "Configuration required"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Architecture */}
          <div
            style={{
              background: "rgba(6,182,212,0.05)",
              border: "1px solid rgba(6,182,212,0.15)",
              borderRadius: "var(--border-radius-md)",
              padding: "1rem",
              marginBottom: "1.5rem"
            }}
          >
            <p
              style={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "var(--clr-secondary)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                margin: "0 0 0.5rem 0"
              }}
            >
              Future-ready architecture
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                flexWrap: "wrap",
                fontSize: "0.8rem",
                color: "var(--clr-text-muted)"
              }}
            >
              <span
                style={{
                  padding: "0.3rem 0.6rem",
                  borderRadius: "6px",
                  background: "var(--clr-bg-input)",
                  color: "var(--clr-text-main)",
                  fontWeight: 600
                }}
              >
                Invoice
              </span>
              <span>\u2192</span>
              <span
                style={{
                  padding: "0.3rem 0.6rem",
                  borderRadius: "6px",
                  background: "rgba(245,158,11,0.1)",
                  color: "var(--clr-warning)",
                  fontWeight: 600
                }}
              >
                Feature / Subscription Check
              </span>
              <span>\u2192</span>
              <span
                style={{
                  padding: "0.3rem 0.6rem",
                  borderRadius: "6px",
                  background: "rgba(6,182,212,0.1)",
                  color: "var(--clr-secondary)",
                  fontWeight: 600
                }}
              >
                Delivery Service (Email / WhatsApp / SMS)
              </span>
            </div>
          </div>

          {/* Provider config preview */}
          <details
            style={{
              borderRadius: "var(--border-radius-md)",
              border: "1px solid var(--clr-glass-border)",
              padding: "0.75rem 1rem",
              background: "var(--clr-bg-input)",
              marginBottom: "1.5rem"
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.88rem",
                color: "var(--clr-text-muted)"
              }}
            >
              Administrator provider configuration (preview)
            </summary>
            <div style={{ marginTop: "0.85rem", display: "grid", gap: "0.65rem" }}>
              {(["SMTP Host", "SMTP Port", "SMTP Username", "SMTP Password", "From Name", "From Email", "Encryption (TLS/SSL)"] as string[]).map((f) => (
                <div key={f} style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <div style={{ width: "36%", fontSize: "0.78rem", color: "var(--clr-text-muted)" }}>
                    {f}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      padding: "0.4rem 0.6rem",
                      borderRadius: "6px",
                      background: "rgba(0,0,0,0.2)",
                      color: "var(--clr-text-muted)",
                      fontSize: "0.78rem",
                      border: "1px dashed rgba(139,92,246,0.3)"
                    }}
                  >
                    \u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022 (requires subscription)
                  </div>
                </div>
              ))}
              <p
                style={{
                  fontSize: "0.72rem",
                  color: "var(--clr-danger)",
                  margin: "0.35rem 0 0 0"
                }}
              >
                \u26A0 Credentials remain backend-only. Never exposed to the frontend.
              </p>
            </div>
          </details>

          {/* CTAs */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              className="btn btn-primary flex-1"
              onClick={() => {
                toast.success(
                  "Subscription option noted. Please contact A1 Fitness admin to activate Invoice Sending."
                );
                setDeliveryModalOpen(false);
              }}
            >
              <Crown size={16} /> Take Subscription
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setDeliveryModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InvoicesPage;
