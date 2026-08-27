import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FileText, Search, Filter, X, Calendar, Download, Printer, Send, Crown, AlertTriangle, TrendingUp, Check, Clock, DollarSign, Users, Mail, MessageCircle, Smartphone, ChevronLeft, ChevronRight, MoreVertical, Eye, CreditCard, Phone, MapPin, Globe, Loader2 } from "lucide-react";
import Modal from "../components/Modal";
import { useAuthStore } from "../store/auth.store";
import { useBranchStore } from "../store/branch.store";
import { getAdminPayments, getPayments, getInvoice, getInvoiceDeliveryStatus, downloadInvoicePDF, markAsPaid, markAsUnpaid } from "../features/payments/payments.api";
const formatCurrency = (val, sym = "\u20B9") => `${sym}${Number(val || 0).toLocaleString("en-IN")}`;
const formatDate = (d) => {
    if (!d)
        return "-";
    try {
        return new Date(d).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }
    catch {
        return "-";
    }
};
const formatDateFull = (d) => {
    if (!d)
        return "-";
    try {
        return new Date(d).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });
    }
    catch {
        return "-";
    }
};
const PAYMENT_METHODS = ["all", "cash", "card", "upi", "online"];
const STATUS_OPTIONS = ["all", "paid", "pending"];
const InvoicesPage = () => {
    const { user } = useAuthStore();
    const { selectedBranch: globalBranch } = useBranchStore();
    const isSuperAdmin = user?.role === "superadmin";
    const isAdmin = isSuperAdmin || user?.role === "admin";
    const isTrainer = user?.role === "trainer";
    const canManage = isAdmin || isTrainer;
    const [items, setItems] = useState([]);
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
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [pdfLoadingId, setPdfLoadingId] = useState(null);
    const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
    const [deliveryLoading, setDeliveryLoading] = useState(false);
    const [deliveryStatus, setDeliveryStatus] = useState(null);
    const [targetInvoiceForSend, setTargetInvoiceForSend] = useState(null);
    const printRef = useRef(null);
    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
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
                const totalAmt = list.reduce((a, p) => a + (p.amount || 0), 0);
                const paidAmt = list
                    .filter((p) => p.status === "paid")
                    .reduce((a, p) => a + (p.amount || 0), 0);
                const pendingAmt = list
                    .filter((p) => p.status === "pending")
                    .reduce((a, p) => a + (p.amount || 0), 0);
                setStats({ total: totalAmt, paid: paidAmt, pending: pendingAmt, count: list.length });
            }
        }
        catch (err) {
            toast.error(err?.response?.data?.message || "Failed to load invoices");
        }
        finally {
            setLoading(false);
        }
    }, [canManage, isSuperAdmin, globalBranch, page, limit, searchQuery, statusFilter, methodFilter, dateFrom, dateTo]);
    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const openInvoiceDetails = async (p) => {
        setDetailsLoading(true);
        setDetailsModalOpen(true);
        try {
            const resp = await getInvoice(p._id);
            setSelectedInvoice(resp.data?.data);
        }
        catch (err) {
            toast.error(err?.response?.data?.message || "Failed to load invoice details");
            setDetailsModalOpen(false);
        }
        finally {
            setDetailsLoading(false);
        }
    };
    const handleDownloadPDF = async (p) => {
        setPdfLoadingId(p._id);
        try {
            await downloadInvoicePDF(p._id);
            toast.success("Invoice downloaded successfully.");
        }
        catch (err) {
            toast.error(err?.message || "Unable to generate invoice PDF. Please try again.");
        }
        finally {
            setPdfLoadingId(null);
        }
    };
    const handlePrint = () => {
        if (!printRef.current)
            return;
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
            try {
                return Array.from(s.cssRules || []).map(r => r.cssText);
            }
            catch {
                return [];
            }
        }).join("\n")}
      </style></head><body>${printContent.outerHTML}</body></html>
    `);
        printWindow.document.close();
        setTimeout(() => {
            try {
                printWindow.print();
            }
            catch {
                window.print();
            }
        }, 300);
    };
    const openSendInvoice = async (p) => {
        setTargetInvoiceForSend(p);
        setDeliveryModalOpen(true);
        setDeliveryLoading(true);
        try {
            const resp = await getInvoiceDeliveryStatus();
            setDeliveryStatus(resp.data?.data);
        }
        catch {
            setDeliveryStatus({
                allowed: false,
                reason: "subscription_required",
                message: "Invoice delivery is a premium feature. Email, WhatsApp and SMS are enabled after subscription and provider configuration.",
                availableProviders: [
                    { key: "email", name: "Email (SMTP)", configured: false, enabled: false },
                    { key: "whatsapp", name: "WhatsApp", configured: false, enabled: false },
                    { key: "sms", name: "SMS", configured: false, enabled: false }
                ]
            });
        }
        finally {
            setDeliveryLoading(false);
        }
    };
    const togglePaymentStatus = async (p) => {
        try {
            if (p.status === "pending")
                await markAsPaid(p._id);
            else
                await markAsUnpaid(p._id);
            toast.success(`Invoice marked as ${p.status === "pending" ? "paid" : "pending"}.`);
            fetchInvoices();
        }
        catch (err) {
            toast.error(err?.response?.data?.message || "Failed to update status");
        }
    };
    const totalDisplayAmount = useMemo(() => {
        return items.reduce((a, p) => a + (p.amount || 0), 0);
    }, [items]);
    return (_jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "1.75rem" }, children: [_jsx("style", { children: `
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
      ` }), _jsxs("div", { className: "page-header flex-responsive", style: { gap: "1.5rem" }, children: [_jsxs("div", { children: [_jsx("h1", { style: { fontSize: "2rem", fontWeight: 800, margin: 0 }, children: "Invoices" }), _jsx("p", { className: "text-muted", style: { marginTop: "0.5rem", marginBottom: 0 }, children: "Manage, view, download and print invoices." })] }), canManage && (_jsx("div", { style: { display: "flex", gap: "0.75rem", flexWrap: "wrap" }, children: _jsxs("button", { className: "btn btn-secondary", onClick: fetchInvoices, disabled: loading, title: "Refresh invoices", style: { display: "inline-flex", alignItems: "center", gap: "0.5rem" }, children: [loading ? _jsx(Loader2, { size: 16, className: "animate-spin" }) : _jsx(FileText, { size: 16 }), loading ? "Loading..." : "Refresh"] }) }))] }), canManage && (_jsxs("div", { className: "grid-stats", style: { marginBottom: 0 }, children: [_jsxs("div", { className: "stat-card", children: [_jsxs("div", { className: "stat-info", children: [_jsx("h3", { children: "Total (this page)" }), _jsx("div", { className: "stat-value", children: formatCurrency(totalDisplayAmount) }), _jsxs("div", { className: "stat-trend trend-up", children: [_jsx(TrendingUp, { size: 14 }), " ", items.length, " invoices"] })] }), _jsx("div", { className: "stat-icon", style: { background: "rgba(139, 92, 246, 0.1)", color: "var(--clr-primary)" }, children: _jsx(DollarSign, { size: 22 }) })] }), _jsxs("div", { className: "stat-card", children: [_jsxs("div", { className: "stat-info", children: [_jsx("h3", { children: "Paid" }), _jsx("div", { className: "stat-value", style: { color: "var(--clr-success)" }, children: formatCurrency(stats.paid) }), _jsxs("div", { className: "stat-trend trend-up", children: [_jsx(Check, { size: 14 }), " Received"] })] }), _jsx("div", { className: "stat-icon", style: { background: "rgba(16, 185, 129, 0.1)", color: "var(--clr-success)" }, children: _jsx(Check, { size: 22 }) })] }), _jsxs("div", { className: "stat-card", children: [_jsxs("div", { className: "stat-info", children: [_jsx("h3", { children: "Pending" }), _jsx("div", { className: "stat-value", style: { color: "var(--clr-warning)" }, children: formatCurrency(stats.pending) }), _jsxs("div", { className: "stat-trend", style: { color: "var(--clr-warning)" }, children: [_jsx(Clock, { size: 14 }), " Awaiting"] })] }), _jsx("div", { className: "stat-icon", style: { background: "rgba(245, 158, 11, 0.1)", color: "var(--clr-warning)" }, children: _jsx(Clock, { size: 22 }) })] }), _jsxs("div", { className: "stat-card", children: [_jsxs("div", { className: "stat-info", children: [_jsx("h3", { children: "All Invoices" }), _jsx("div", { className: "stat-value", children: total }), _jsxs("div", { className: "stat-trend trend-up", children: [_jsx(Users, { size: 14 }), " Total records"] })] }), _jsx("div", { className: "stat-icon", style: { background: "rgba(6, 182, 212, 0.1)", color: "var(--clr-secondary)" }, children: _jsx(FileText, { size: 22 }) })] })] })), _jsxs("div", { className: "glass-panel", style: {
                    padding: "1.25rem",
                    display: "flex",
                    gap: "1rem",
                    flexWrap: "wrap",
                    alignItems: "center"
                }, children: [_jsxs("div", { style: { position: "relative", flex: "1 1 260px", minWidth: "240px" }, children: [_jsx(Search, { size: 18, style: {
                                    position: "absolute",
                                    left: "1rem",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "var(--clr-primary)",
                                    opacity: 0.8
                                } }), _jsx("input", { type: "text", placeholder: canManage
                                    ? "Search invoice #, member name, ID, phone, email..."
                                    : "Search by invoice #...", className: "form-input", style: { paddingLeft: "2.75rem", paddingRight: searchQuery ? "2.75rem" : "1rem" }, value: searchQuery, onChange: (e) => {
                                    setSearchQuery(e.target.value);
                                    setPage(1);
                                } }), searchQuery && (_jsx("button", { onClick: () => {
                                    setSearchQuery("");
                                    setPage(1);
                                }, className: "btn-icon", style: {
                                    position: "absolute",
                                    right: "0.5rem",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    width: "28px",
                                    height: "28px"
                                }, children: _jsx(X, { size: 14 }) }))] }), _jsxs("div", { style: { display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }, children: [_jsxs("div", { style: {
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    background: "var(--clr-bg-input)",
                                    padding: "0.25rem 0.75rem",
                                    borderRadius: "var(--border-radius-md)",
                                    border: "1px solid var(--clr-glass-border)",
                                    height: "44px"
                                }, children: [_jsx(Filter, { size: 16, style: { color: "var(--clr-primary)" } }), _jsx("select", { className: "form-input", style: {
                                            width: "120px",
                                            border: "none",
                                            background: "transparent",
                                            padding: 0,
                                            height: "auto"
                                        }, value: statusFilter, onChange: (e) => {
                                            setStatusFilter(e.target.value);
                                            setPage(1);
                                        }, children: STATUS_OPTIONS.map((s) => (_jsx("option", { value: s, children: s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1) }, s))) })] }), canManage && (_jsxs("div", { style: {
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    background: "var(--clr-bg-input)",
                                    padding: "0.25rem 0.75rem",
                                    borderRadius: "var(--border-radius-md)",
                                    border: "1px solid var(--clr-glass-border)",
                                    height: "44px"
                                }, children: [_jsx(CreditCard, { size: 16, style: { color: "var(--clr-primary)" } }), _jsx("select", { className: "form-input", style: {
                                            width: "130px",
                                            border: "none",
                                            background: "transparent",
                                            padding: 0,
                                            height: "auto",
                                            textTransform: "capitalize"
                                        }, value: methodFilter, onChange: (e) => {
                                            setMethodFilter(e.target.value);
                                            setPage(1);
                                        }, children: PAYMENT_METHODS.map((m) => (_jsx("option", { value: m, children: m === "all" ? "All Methods" : m.charAt(0).toUpperCase() + m.slice(1) }, m))) })] })), canManage && (_jsxs("div", { style: { display: "flex", gap: "0.5rem", alignItems: "center" }, children: [_jsx(Calendar, { size: 16, style: { color: "var(--clr-primary)" } }), _jsx("input", { type: "date", className: "form-input", style: { width: "140px", height: "44px", padding: "0 0.75rem" }, value: dateFrom, onChange: (e) => {
                                            setDateFrom(e.target.value);
                                            setPage(1);
                                        } }), _jsx("span", { className: "text-muted", style: { fontSize: "0.85rem" }, children: "to" }), _jsx("input", { type: "date", className: "form-input", style: { width: "140px", height: "44px", padding: "0 0.75rem" }, value: dateTo, onChange: (e) => {
                                            setDateTo(e.target.value);
                                            setPage(1);
                                        } }), (dateFrom || dateTo) && (_jsx("button", { className: "btn-icon", onClick: () => {
                                            setDateFrom("");
                                            setDateTo("");
                                            setPage(1);
                                        }, title: "Clear dates", children: _jsx(X, { size: 14 }) }))] }))] })] }), _jsx("div", { className: "glass-panel", style: { padding: 0, overflow: "hidden" }, children: loading ? (_jsxs("div", { style: { textAlign: "center", padding: "5rem" }, children: [_jsx("div", { className: "spinner", style: { margin: "0 auto" } }), _jsx("p", { className: "text-muted", style: { marginTop: "1rem" }, children: "Loading invoices..." })] })) : items.length === 0 ? (_jsxs("div", { style: { textAlign: "center", padding: "5rem 2rem" }, children: [_jsx("div", { style: {
                                width: "96px",
                                height: "96px",
                                borderRadius: "50%",
                                background: "rgba(139, 92, 246, 0.06)",
                                border: "1px dashed rgba(139, 92, 246, 0.25)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto 1.5rem"
                            }, children: _jsx(FileText, { size: 44, style: { color: "var(--clr-primary)", opacity: 0.5 } }) }), _jsx("h3", { style: { fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }, children: "No invoices found" }), _jsx("p", { className: "text-muted", style: { fontSize: "0.95rem", marginBottom: 0 }, children: searchQuery || statusFilter !== "all" || methodFilter !== "all" || dateFrom || dateTo
                                ? "Try adjusting your search or filters to find what you\u2019re looking for."
                                : canManage
                                    ? "Record a payment to generate your first invoice."
                                    : "You haven\u2019t received any invoices yet." })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "table-container hide-on-mobile", style: { margin: 0, border: "none", background: "transparent" }, children: _jsxs("table", { className: "data-table", style: { minWidth: "900px" }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: { padding: "1rem 1.5rem" }, children: "Invoice" }), _jsx("th", { style: { padding: "1rem" }, children: canManage ? "Member" : "Plan" }), _jsx("th", { style: { padding: "1rem" }, className: "inv-desktop-only", children: "Date" }), _jsx("th", { style: { padding: "1rem", textAlign: "right" }, children: "Amount" }), _jsx("th", { style: { padding: "1rem" }, className: "inv-desktop-only", children: "Payment" }), _jsx("th", { style: { padding: "1rem" }, children: "Status" }), _jsx("th", { style: { padding: "1rem 1.5rem", textAlign: "right" }, children: "Action" })] }) }), _jsx("tbody", { children: items.map((p) => (_jsxs("tr", { children: [_jsx("td", { style: { padding: "1rem 1.5rem" }, children: _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "0.75rem" }, children: [_jsx("div", { style: {
                                                                    width: "40px",
                                                                    height: "40px",
                                                                    borderRadius: "10px",
                                                                    background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.12))",
                                                                    color: "var(--clr-primary)",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    flexShrink: 0
                                                                }, children: _jsx(FileText, { size: 18 }) }), _jsxs("div", { children: [_jsx("p", { style: { fontWeight: 700, margin: 0, fontSize: "0.95rem" }, children: _jsx("span", { className: "inv-thumbnail", children: p.invoiceNumber }) }), _jsx("p", { className: "text-muted", style: { fontSize: "0.8rem", margin: "0.25rem 0 0 0" }, children: canManage
                                                                            ? p.plan?.name || "Membership"
                                                                            : p.plan?.name || "Membership" })] })] }) }), _jsx("td", { style: { padding: "1rem" }, children: canManage ? (_jsxs("div", { children: [_jsx("p", { style: { fontWeight: 600, margin: 0 }, children: p.member?.user?.name || "Unknown Member" }), _jsxs("p", { className: "text-muted", style: { fontSize: "0.78rem", margin: "0.15rem 0 0 0" }, children: [p.member?.secretCode
                                                                        ? `#${p.member.secretCode} \u00B7 `
                                                                        : "", p.member?.user?.phone || p.member?.user?.email || "-"] })] })) : (_jsx("span", { className: "status-badge active", style: { fontSize: "0.8rem" }, children: p.plan?.name || "Membership" })) }), _jsx("td", { style: { padding: "1rem" }, className: "inv-desktop-only", children: _jsxs("div", { style: {
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "0.5rem",
                                                            fontSize: "0.85rem"
                                                        }, children: [_jsx(Calendar, { size: 14, className: "text-muted" }), formatDate(p.date || p.createdAt)] }) }), _jsx("td", { style: { padding: "1rem", textAlign: "right" }, children: _jsx("span", { style: {
                                                            fontWeight: 800,
                                                            color: "var(--clr-primary)",
                                                            fontSize: "1rem"
                                                        }, children: formatCurrency(p.amount) }) }), _jsx("td", { style: { padding: "1rem" }, className: "inv-desktop-only", children: _jsx("span", { style: {
                                                            fontSize: "0.85rem",
                                                            textTransform: "capitalize",
                                                            color: "var(--clr-text-muted)",
                                                            fontWeight: 500
                                                        }, children: p.method || "cash" }) }), _jsx("td", { style: { padding: "1rem" }, children: _jsxs("button", { onClick: () => canManage && togglePaymentStatus(p), className: `status-badge ${p.status === "paid" ? "active" : "pending"}`, style: {
                                                            border: "none",
                                                            cursor: canManage ? "pointer" : "default",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "4px"
                                                        }, disabled: !canManage, children: [p.status === "paid" ? _jsx(Check, { size: 12 }) : _jsx(Clock, { size: 12 }), p.status] }) }), _jsx("td", { style: { padding: "1rem 1.5rem", textAlign: "right" }, children: _jsxs("div", { style: {
                                                            display: "flex",
                                                            gap: "0.35rem",
                                                            justifyContent: "flex-end",
                                                            flexWrap: "wrap"
                                                        }, children: [_jsx("button", { className: "btn-icon", title: "View Invoice", onClick: () => openInvoiceDetails(p), children: _jsx(Eye, { size: 16 }) }), _jsx("button", { className: "btn-icon", title: "Download PDF", onClick: () => handleDownloadPDF(p), disabled: pdfLoadingId === p._id, children: pdfLoadingId === p._id ? (_jsx(Loader2, { size: 16, className: "animate-spin" })) : (_jsx(Download, { size: 16 })) }), _jsx("button", { className: "btn-icon", title: "Print", onClick: async () => {
                                                                    await openInvoiceDetails(p);
                                                                }, children: _jsx(Printer, { size: 16 }) }), canManage && (_jsxs(_Fragment, { children: [_jsx("button", { className: "btn-icon", title: "Send Invoice", onClick: () => openSendInvoice(p), style: {
                                                                            background: "rgba(245, 158, 11, 0.08)",
                                                                            color: "var(--clr-warning)",
                                                                            borderColor: "rgba(245, 158, 11, 0.2)"
                                                                        }, children: _jsx(Send, { size: 16 }) }), _jsx("div", { className: "inv-desktop-only", children: _jsx("button", { className: "btn-icon", title: "More Options", children: _jsx(MoreVertical, { size: 16 }) }) })] }))] }) })] }, p._id))) })] }) }), _jsx("div", { className: "mobile-cards-container", style: { padding: "1.25rem" }, children: items.map((p) => (_jsxs("div", { className: "mobile-card", children: [_jsxs("div", { style: {
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "flex-start",
                                            gap: "1rem",
                                            marginBottom: "0.5rem"
                                        }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "0.75rem" }, children: [_jsx("div", { style: {
                                                            width: "40px",
                                                            height: "40px",
                                                            borderRadius: "10px",
                                                            background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.12))",
                                                            color: "var(--clr-primary)",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center"
                                                        }, children: _jsx(FileText, { size: 18 }) }), _jsxs("div", { children: [_jsx("p", { style: {
                                                                    fontWeight: 700,
                                                                    margin: 0,
                                                                    fontFamily: "monospace",
                                                                    color: "var(--clr-primary)",
                                                                    fontSize: "0.9rem"
                                                                }, children: p.invoiceNumber }), _jsx("p", { className: "text-muted", style: { fontSize: "0.8rem", margin: "0.1rem 0 0 0" }, children: p.plan?.name || "Membership" })] })] }), _jsx("span", { className: `status-badge ${p.status === "paid" ? "active" : "pending"}`, style: { fontSize: "0.75rem" }, children: p.status })] }), canManage && p.member?.user?.name && (_jsxs("div", { className: "mobile-card-row", children: [_jsx("span", { className: "mobile-card-label", children: "Member" }), _jsx("span", { className: "mobile-card-value", style: { fontWeight: 600 }, children: p.member.user.name })] })), _jsxs("div", { className: "mobile-card-row", children: [_jsx("span", { className: "mobile-card-label", children: "Date" }), _jsx("span", { className: "mobile-card-value", children: formatDate(p.date || p.createdAt) })] }), _jsxs("div", { className: "mobile-card-row", children: [_jsx("span", { className: "mobile-card-label", children: "Method" }), _jsx("span", { className: "mobile-card-value", style: { textTransform: "capitalize" }, children: p.method || "cash" })] }), _jsxs("div", { className: "mobile-card-row", children: [_jsx("span", { className: "mobile-card-label", children: "Amount" }), _jsx("span", { className: "mobile-card-value", style: { fontWeight: 800, color: "var(--clr-primary)", fontSize: "1rem" }, children: formatCurrency(p.amount) })] }), _jsxs("div", { style: {
                                            display: "grid",
                                            gridTemplateColumns: "repeat(2, 1fr)",
                                            gap: "0.5rem",
                                            marginTop: "0.75rem"
                                        }, children: [_jsxs("button", { className: "btn btn-secondary", style: { padding: "0.5rem", fontSize: "0.8rem" }, onClick: () => openInvoiceDetails(p), children: [_jsx(Eye, { size: 14 }), " View"] }), _jsxs("button", { className: "btn btn-secondary", style: { padding: "0.5rem", fontSize: "0.8rem" }, onClick: () => handleDownloadPDF(p), disabled: pdfLoadingId === p._id, children: [pdfLoadingId === p._id ? (_jsx(Loader2, { size: 14, className: "animate-spin" })) : (_jsx(Download, { size: 14 })), "PDF"] }), _jsxs("button", { className: "btn btn-secondary", style: { padding: "0.5rem", fontSize: "0.8rem" }, onClick: () => openInvoiceDetails(p), children: [_jsx(Printer, { size: 14 }), " Print"] }), canManage && (_jsxs("button", { className: "btn", style: {
                                                    padding: "0.5rem",
                                                    fontSize: "0.8rem",
                                                    background: "rgba(245, 158, 11, 0.08)",
                                                    color: "var(--clr-warning)",
                                                    border: "1px solid rgba(245, 158, 11, 0.2)"
                                                }, onClick: () => openSendInvoice(p), children: [_jsx(Send, { size: 14 }), " Send"] }))] })] }, p._id))) }), totalPages > 1 && (_jsxs("div", { style: {
                                padding: "1.25rem 1.5rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "1rem",
                                flexWrap: "wrap",
                                borderTop: "1px solid var(--clr-glass-border)"
                            }, children: [_jsxs("p", { className: "text-muted", style: { fontSize: "0.9rem", margin: 0 }, children: ["Showing ", _jsx("strong", { style: { color: "var(--clr-text-main)" }, children: (page - 1) * limit + 1 }), " ", "-", " ", _jsx("strong", { style: { color: "var(--clr-text-main)" }, children: Math.min(page * limit, total) }), " ", "of ", _jsx("strong", { style: { color: "var(--clr-text-main)" }, children: total }), " invoices"] }), _jsxs("div", { style: { display: "flex", gap: "0.35rem", alignItems: "center", flexWrap: "wrap" }, children: [_jsx("button", { className: "pagination-btn", onClick: () => setPage((p) => Math.max(1, p - 1)), disabled: page === 1, children: _jsx(ChevronLeft, { size: 16 }) }), Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5)
                                                pageNum = i + 1;
                                            else if (page <= 3)
                                                pageNum = i + 1;
                                            else if (page >= totalPages - 2)
                                                pageNum = totalPages - 4 + i;
                                            else
                                                pageNum = page - 2 + i;
                                            return (_jsx("button", { className: `pagination-btn ${page === pageNum ? "active" : ""}`, onClick: () => setPage(pageNum), children: pageNum }, pageNum));
                                        }), _jsx("button", { className: "pagination-btn", onClick: () => setPage((p) => Math.min(totalPages, p + 1)), disabled: page === totalPages, children: _jsx(ChevronRight, { size: 16 }) })] })] }))] })) }), _jsx(Modal, { isOpen: detailsModalOpen, onClose: () => setDetailsModalOpen(false), title: "Invoice Details", children: detailsLoading ? (_jsxs("div", { style: { padding: "3rem 1rem", textAlign: "center" }, children: [_jsx("div", { className: "spinner", style: { margin: "0 auto" } }), _jsx("p", { className: "text-muted", style: { marginTop: "1rem" }, children: "Loading invoice details..." })] })) : selectedInvoice ? (_jsxs("div", { children: [_jsxs("div", { style: {
                                display: "flex",
                                gap: "0.75rem",
                                flexWrap: "wrap",
                                marginBottom: "1.25rem",
                                paddingBottom: "1rem",
                                borderBottom: "1px solid var(--clr-glass-border)"
                            }, className: "print-hide", children: [_jsxs("button", { className: "btn btn-primary", onClick: handlePrint, children: [_jsx(Printer, { size: 16 }), " Print Invoice"] }), _jsxs("button", { className: "btn btn-secondary", onClick: () => handleDownloadPDF({ _id: selectedInvoice._id }), disabled: pdfLoadingId === selectedInvoice._id, children: [pdfLoadingId === selectedInvoice._id ? (_jsx(Loader2, { size: 16, className: "animate-spin" })) : (_jsx(Download, { size: 16 })), "Download PDF"] }), canManage && (_jsxs("button", { className: "btn", style: {
                                        background: "rgba(245, 158, 11, 0.08)",
                                        color: "var(--clr-warning)",
                                        border: "1px solid rgba(245, 158, 11, 0.2)",
                                        fontWeight: 600
                                    }, onClick: () => {
                                        setDetailsModalOpen(false);
                                        openSendInvoice({
                                            _id: selectedInvoice._id,
                                            invoiceNumber: selectedInvoice.invoiceNumber,
                                            amount: selectedInvoice.total,
                                            status: selectedInvoice.status,
                                            date: selectedInvoice.date,
                                            method: selectedInvoice.method
                                        });
                                    }, children: [_jsx(Send, { size: 16 }), " Send Invoice"] }))] }), _jsx("div", { id: "invoice-print-area", className: "inv-print-wrap", ref: printRef, children: _jsxs("div", { style: { maxWidth: "780px", margin: "0 auto" }, children: [_jsxs("div", { style: {
                                            display: "flex",
                                            justifyContent: "space-between",
                                            gap: "1.5rem",
                                            marginBottom: "1.5rem",
                                            paddingBottom: "1.25rem",
                                            borderBottom: "2px solid #8b5cf6",
                                            alignItems: "flex-start",
                                            flexWrap: "wrap"
                                        }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "1rem" }, children: [selectedInvoice.business.logo ? (_jsx("img", { src: selectedInvoice.business.logo, alt: selectedInvoice.business.displayName, style: {
                                                            width: "56px",
                                                            height: "56px",
                                                            borderRadius: "12px",
                                                            objectFit: "cover",
                                                            border: "1px solid #e5e7eb"
                                                        } })) : (_jsx("div", { style: {
                                                            width: "56px",
                                                            height: "56px",
                                                            borderRadius: "12px",
                                                            background: "linear-gradient(135deg,#8b5cf6,#06b6d4)",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            color: "white",
                                                            fontWeight: 800
                                                        }, children: (selectedInvoice.business.displayName || "A1").charAt(0) })), _jsxs("div", { children: [_jsx("h2", { style: {
                                                                    fontSize: "1.5rem",
                                                                    fontWeight: 800,
                                                                    margin: 0,
                                                                    background: "linear-gradient(135deg,#8b5cf6,#ec4899)",
                                                                    WebkitBackgroundClip: "text",
                                                                    WebkitTextFillColor: "transparent",
                                                                    backgroundClip: "text",
                                                                    letterSpacing: "0.02em"
                                                                }, children: selectedInvoice.business.displayName }), _jsx("p", { style: { color: "#6b7280", fontSize: "0.85rem", margin: "0.2rem 0 0 0" }, children: selectedInvoice.business.tagline })] })] }), _jsxs("div", { style: { textAlign: "right" }, children: [_jsx("p", { style: {
                                                            fontSize: "0.7rem",
                                                            textTransform: "uppercase",
                                                            letterSpacing: "0.1em",
                                                            color: "#6b7280",
                                                            fontWeight: 700,
                                                            margin: 0
                                                        }, children: "Invoice" }), _jsx("h3", { style: { fontSize: "1.3rem", fontWeight: 800, margin: "0.25rem 0 0 0" }, children: _jsxs("span", { style: { fontFamily: "monospace" }, children: ["#", selectedInvoice.invoiceNumber] }) })] })] }), _jsxs("div", { style: {
                                            display: "grid",
                                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                                            gap: "1.5rem",
                                            marginBottom: "2rem"
                                        }, children: [_jsxs("div", { children: [_jsx("div", { className: "inv-info-label", children: "From" }), _jsx("div", { className: "inv-info-value", style: { fontWeight: 700 }, children: selectedInvoice.business.displayName }), selectedInvoice.business.address && (_jsxs("div", { style: { fontSize: "0.88rem", color: "#4b5563", marginTop: "0.25rem" }, children: [_jsx(MapPin, { size: 12, style: { display: "inline-block", verticalAlign: "middle", marginRight: 4 } }), selectedInvoice.business.address] })), selectedInvoice.business.phone && (_jsxs("div", { style: { fontSize: "0.88rem", color: "#4b5563", marginTop: "0.15rem" }, children: [_jsx(Phone, { size: 12, style: { display: "inline-block", verticalAlign: "middle", marginRight: 4 } }), selectedInvoice.business.phone] })), selectedInvoice.business.email && (_jsxs("div", { style: { fontSize: "0.88rem", color: "#4b5563", marginTop: "0.15rem" }, children: [_jsx(Mail, { size: 12, style: { display: "inline-block", verticalAlign: "middle", marginRight: 4 } }), selectedInvoice.business.email] })), selectedInvoice.business.website && (_jsxs("div", { style: { fontSize: "0.88rem", color: "#06b6d4", marginTop: "0.15rem" }, children: [_jsx(Globe, { size: 12, style: { display: "inline-block", verticalAlign: "middle", marginRight: 4 } }), selectedInvoice.business.website] }))] }), _jsxs("div", { children: [_jsx("div", { className: "inv-info-label", children: "Bill To" }), _jsx("div", { className: "inv-info-value", style: { fontWeight: 700 }, children: selectedInvoice.member.name || "Member" }), selectedInvoice.member.memberId && (_jsxs("div", { style: { fontSize: "0.82rem", color: "#6b7280", marginTop: "0.15rem" }, children: ["Member ID:", " ", _jsx("span", { style: { fontFamily: "monospace", fontWeight: 600 }, children: selectedInvoice.member.memberId })] })), selectedInvoice.member.email && (_jsxs("div", { style: { fontSize: "0.88rem", color: "#4b5563", marginTop: "0.15rem" }, children: [_jsx(Mail, { size: 12, style: { display: "inline-block", verticalAlign: "middle", marginRight: 4 } }), selectedInvoice.member.email] })), selectedInvoice.member.phone && (_jsxs("div", { style: { fontSize: "0.88rem", color: "#4b5563", marginTop: "0.15rem" }, children: [_jsx(Phone, { size: 12, style: { display: "inline-block", verticalAlign: "middle", marginRight: 4 } }), selectedInvoice.member.phone] })), selectedInvoice.member.address && (_jsxs("div", { style: { fontSize: "0.88rem", color: "#4b5563", marginTop: "0.15rem" }, children: [_jsx(MapPin, { size: 12, style: { display: "inline-block", verticalAlign: "middle", marginRight: 4 } }), selectedInvoice.member.address] }))] }), _jsxs("div", { children: [_jsx("div", { className: "inv-info-label", children: "Invoice Details" }), _jsx("table", { style: { width: "100%", borderCollapse: "collapse" }, children: _jsxs("tbody", { children: [_jsxs("tr", { children: [_jsx("td", { style: {
                                                                                fontSize: "0.85rem",
                                                                                color: "#6b7280",
                                                                                padding: "3px 0"
                                                                            }, children: "Invoice Date" }), _jsx("td", { style: {
                                                                                fontSize: "0.85rem",
                                                                                color: "#111827",
                                                                                fontWeight: 600,
                                                                                textAlign: "right",
                                                                                padding: "3px 0"
                                                                            }, children: formatDateFull(selectedInvoice.date) })] }), selectedInvoice.dueDate && (_jsxs("tr", { children: [_jsx("td", { style: { fontSize: "0.85rem", color: "#6b7280", padding: "3px 0" }, children: "Due Date" }), _jsx("td", { style: {
                                                                                fontSize: "0.85rem",
                                                                                color: "#111827",
                                                                                fontWeight: 600,
                                                                                textAlign: "right",
                                                                                padding: "3px 0"
                                                                            }, children: formatDateFull(selectedInvoice.dueDate) })] })), _jsxs("tr", { children: [_jsx("td", { style: { fontSize: "0.85rem", color: "#6b7280", padding: "3px 0" }, children: "Status" }), _jsx("td", { style: { textAlign: "right", padding: "3px 0" }, children: _jsx("span", { style: {
                                                                                    display: "inline-block",
                                                                                    padding: "0.15rem 0.55rem",
                                                                                    borderRadius: "999px",
                                                                                    fontSize: "0.72rem",
                                                                                    fontWeight: 700,
                                                                                    textTransform: "uppercase",
                                                                                    letterSpacing: "0.03em",
                                                                                    background: selectedInvoice.status === "paid"
                                                                                        ? "rgba(16,185,129,0.1)"
                                                                                        : "rgba(245,158,11,0.1)",
                                                                                    color: selectedInvoice.status === "paid" ? "#10b981" : "#f59e0b"
                                                                                }, children: selectedInvoice.status }) })] }), _jsxs("tr", { children: [_jsx("td", { style: { fontSize: "0.85rem", color: "#6b7280", padding: "3px 0" }, children: "Method" }), _jsx("td", { style: {
                                                                                fontSize: "0.85rem",
                                                                                color: "#111827",
                                                                                fontWeight: 600,
                                                                                textAlign: "right",
                                                                                textTransform: "capitalize",
                                                                                padding: "3px 0"
                                                                            }, children: selectedInvoice.method || "Cash" })] }), selectedInvoice.paymentDate &&
                                                                    selectedInvoice.status === "paid" && (_jsxs("tr", { children: [_jsx("td", { style: { fontSize: "0.85rem", color: "#6b7280", padding: "3px 0" }, children: "Paid On" }), _jsx("td", { style: {
                                                                                fontSize: "0.85rem",
                                                                                color: "#10b981",
                                                                                fontWeight: 600,
                                                                                textAlign: "right",
                                                                                padding: "3px 0"
                                                                            }, children: formatDateFull(selectedInvoice.paymentDate) })] }))] }) })] })] }), _jsxs("table", { className: "inv-print-table", style: { marginBottom: "1.5rem" }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: { textAlign: "left", width: "46%" }, children: "Description" }), _jsx("th", { style: { textAlign: "center", width: "12%" }, children: "Qty" }), _jsx("th", { style: { textAlign: "right", width: "18%" }, children: "Unit" }), _jsx("th", { style: { textAlign: "right", width: "24%" }, children: "Amount" })] }) }), _jsx("tbody", { children: selectedInvoice.lineItems.map((item, idx) => (_jsxs("tr", { children: [_jsxs("td", { children: [_jsx("div", { style: { fontWeight: 600, fontSize: "14px", color: "#111827" }, children: item.description }), item.details && (_jsx("div", { style: { fontSize: "11px", color: "#6b7280", marginTop: "2px" }, children: item.details }))] }), _jsx("td", { style: { textAlign: "center" }, children: item.quantity || 1 }), _jsx("td", { style: { textAlign: "right", fontFamily: "monospace" }, children: formatCurrency(item.unitPrice, selectedInvoice.business.currencySymbol) }), _jsx("td", { style: {
                                                                textAlign: "right",
                                                                fontWeight: 600,
                                                                fontFamily: "monospace"
                                                            }, children: formatCurrency(item.amount, selectedInvoice.business.currencySymbol) })] }, idx))) })] }), _jsx("div", { style: {
                                            display: "flex",
                                            justifyContent: "flex-end",
                                            marginBottom: "2rem"
                                        }, children: _jsx("table", { style: {
                                                width: "100%",
                                                maxWidth: "320px",
                                                borderCollapse: "collapse"
                                            }, className: "inv-print-totals", children: _jsxs("tbody", { children: [_jsxs("tr", { children: [_jsx("td", { style: { color: "#6b7280" }, children: "Subtotal" }), _jsx("td", { style: {
                                                                    textAlign: "right",
                                                                    fontWeight: 600,
                                                                    fontFamily: "monospace",
                                                                    color: "#111827"
                                                                }, children: formatCurrency(selectedInvoice.subtotal, selectedInvoice.business.currencySymbol) })] }), selectedInvoice.discount > 0 && (_jsxs("tr", { children: [_jsx("td", { style: { color: "#10b981" }, children: "Discount" }), _jsxs("td", { style: {
                                                                    textAlign: "right",
                                                                    fontWeight: 600,
                                                                    fontFamily: "monospace",
                                                                    color: "#10b981"
                                                                }, children: ["-", formatCurrency(selectedInvoice.discount, selectedInvoice.business.currencySymbol)] })] })), selectedInvoice.tax > 0 && (_jsxs("tr", { children: [_jsx("td", { style: { color: "#6b7280" }, children: "Tax" }), _jsx("td", { style: {
                                                                    textAlign: "right",
                                                                    fontWeight: 600,
                                                                    fontFamily: "monospace",
                                                                    color: "#111827"
                                                                }, children: formatCurrency(selectedInvoice.tax, selectedInvoice.business.currencySymbol) })] })), _jsx("tr", { children: _jsx("td", { colSpan: 2, style: { padding: "6px 0" }, children: _jsx("div", { style: {
                                                                    height: "1px",
                                                                    background: "#e5e7eb",
                                                                    margin: "4px 0"
                                                                } }) }) }), _jsxs("tr", { children: [_jsx("td", { style: { color: "#111827", fontWeight: 700, fontSize: "1rem" }, children: "Total" }), _jsx("td", { style: {
                                                                    textAlign: "right",
                                                                    fontWeight: 800,
                                                                    fontSize: "1.15rem",
                                                                    fontFamily: "monospace",
                                                                    color: "#8b5cf6"
                                                                }, children: formatCurrency(selectedInvoice.total, selectedInvoice.business.currencySymbol) })] })] }) }) }), (selectedInvoice.referenceId ||
                                        selectedInvoice.billingPeriod?.start ||
                                        selectedInvoice.note) && (_jsxs("div", { style: {
                                            background: "#f9fafb",
                                            padding: "0.9rem 1rem",
                                            borderRadius: "8px",
                                            marginBottom: "1.5rem",
                                            border: "1px solid #f3f4f6"
                                        }, children: [selectedInvoice.referenceId && (_jsxs("p", { style: { fontSize: "12px", color: "#4b5563", margin: "0 0 0.25rem 0" }, children: [_jsx("strong", { children: "Transaction ID:" }), " ", _jsx("span", { style: { fontFamily: "monospace" }, children: selectedInvoice.referenceId })] })), selectedInvoice.billingPeriod?.start && selectedInvoice.billingPeriod?.end && (_jsxs("p", { style: { fontSize: "12px", color: "#4b5563", margin: "0 0 0.25rem 0" }, children: [_jsx("strong", { children: "Billing Period:" }), " ", formatDateFull(selectedInvoice.billingPeriod.start), " -", " ", formatDateFull(selectedInvoice.billingPeriod.end)] })), selectedInvoice.note && (_jsxs("p", { style: { fontSize: "12px", color: "#4b5563", margin: 0 }, children: [_jsx("strong", { children: "Note:" }), " ", selectedInvoice.note] }))] })), _jsxs("div", { style: {
                                            textAlign: "center",
                                            paddingTop: "1rem",
                                            borderTop: "1px dashed #d1d5db"
                                        }, children: [_jsx("p", { style: { fontSize: "12px", color: "#6b7280", margin: "0 0 0.35rem 0" }, children: "Thank you for your business!" }), _jsx("p", { style: { fontSize: "11px", color: "#9ca3af", margin: 0 }, children: "This is a computer-generated invoice. No signature required." })] })] }) })] })) : null }), _jsx(Modal, { isOpen: deliveryModalOpen, onClose: () => setDeliveryModalOpen(false), title: "", children: _jsxs("div", { style: { padding: "0.25rem" }, children: [_jsxs("div", { style: {
                                position: "relative",
                                overflow: "hidden",
                                borderRadius: "var(--border-radius-lg)",
                                padding: "1.75rem 1.5rem",
                                background: "linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(245,158,11,0.12) 50%, rgba(6,182,212,0.12) 100%)",
                                border: "1px solid rgba(139,92,246,0.2)",
                                marginBottom: "1.5rem",
                                textAlign: "center"
                            }, children: [_jsx("div", { style: {
                                        width: "64px",
                                        height: "64px",
                                        borderRadius: "50%",
                                        background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        margin: "0 auto 1rem",
                                        boxShadow: "0 8px 24px rgba(245,158,11,0.3)"
                                    }, children: _jsx(Crown, { size: 28, style: { color: "white" } }) }), _jsx("h3", { style: {
                                        fontSize: "1.25rem",
                                        fontWeight: 800,
                                        margin: "0 0 0.4rem 0",
                                        background: "linear-gradient(135deg, #f59e0b, #ec4899)",
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                        backgroundClip: "text"
                                    }, children: "Invoice Sending \\u2014 Subscription Required" }), _jsx("p", { className: "text-muted", style: { fontSize: "0.9rem", margin: 0 }, children: "Deliver invoices automatically via Email, WhatsApp or SMS." }), targetInvoiceForSend && (_jsxs("div", { style: {
                                        marginTop: "1rem",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                        padding: "0.35rem 0.75rem",
                                        borderRadius: "999px",
                                        background: "rgba(255,255,255,0.06)",
                                        border: "1px solid rgba(255,255,255,0.08)"
                                    }, children: [_jsx(FileText, { size: 14, style: { color: "var(--clr-primary)" } }), _jsx("span", { style: { fontFamily: "monospace", fontWeight: 700, fontSize: "0.8rem" }, children: targetInvoiceForSend.invoiceNumber }), _jsx("span", { style: { fontWeight: 600, fontSize: "0.8rem", color: "var(--clr-primary)" }, children: formatCurrency(targetInvoiceForSend.amount) })] }))] }), _jsxs("div", { style: {
                                display: "flex",
                                gap: "0.85rem",
                                padding: "1rem 1rem",
                                borderRadius: "var(--border-radius-md)",
                                background: "rgba(245,158,11,0.06)",
                                border: "1px solid rgba(245,158,11,0.2)",
                                marginBottom: "1.25rem"
                            }, children: [_jsx(AlertTriangle, { size: 20, style: { color: "var(--clr-warning)", flexShrink: 0 } }), _jsxs("div", { children: [_jsx("p", { style: { fontWeight: 600, margin: "0 0 0.2rem 0", fontSize: "0.92rem" }, children: "Premium feature is currently locked" }), _jsx("p", { className: "text-muted", style: { fontSize: "0.82rem", margin: 0, lineHeight: 1.55 }, children: deliveryStatus?.message ||
                                                "Invoice delivery via Email, WhatsApp and SMS is a paid premium feature. External provider charges may apply (SMTP, WhatsApp Business API, SMS gateway). Delivery services will become available after subscription and provider credentials are configured by an administrator." })] })] }), _jsx("h4", { style: {
                                fontSize: "0.78rem",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                color: "var(--clr-text-muted)",
                                fontWeight: 700,
                                margin: "0 0 0.85rem 0"
                            }, children: "Available delivery channels" }), _jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }, children: (deliveryStatus?.availableProviders || []).map((p) => {
                                const icon = p.key === "email" ? (_jsx(Mail, { size: 18 })) : p.key === "whatsapp" ? (_jsx(MessageCircle, { size: 18 })) : (_jsx(Smartphone, { size: 18 }));
                                return (_jsxs("div", { style: {
                                        padding: "1rem",
                                        borderRadius: "var(--border-radius-md)",
                                        background: "var(--clr-bg-input)",
                                        border: "1px solid var(--clr-glass-border)",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.75rem",
                                        opacity: 0.6
                                    }, children: [_jsx("div", { style: {
                                                width: "36px",
                                                height: "36px",
                                                borderRadius: "10px",
                                                background: "rgba(245,158,11,0.1)",
                                                color: "var(--clr-warning)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0
                                            }, children: icon }), _jsxs("div", { children: [_jsx("p", { style: { fontWeight: 600, margin: 0, fontSize: "0.88rem" }, children: p.name }), _jsx("p", { style: {
                                                        fontSize: "0.72rem",
                                                        margin: "0.15rem 0 0 0",
                                                        color: "var(--clr-text-muted)"
                                                    }, children: p.configured && p.enabled ? "Ready" : "Configuration required" })] })] }, p.key));
                            }) }), _jsxs("div", { style: {
                                background: "rgba(6,182,212,0.05)",
                                border: "1px solid rgba(6,182,212,0.15)",
                                borderRadius: "var(--border-radius-md)",
                                padding: "1rem",
                                marginBottom: "1.5rem"
                            }, children: [_jsx("p", { style: {
                                        fontSize: "0.78rem",
                                        fontWeight: 700,
                                        color: "var(--clr-secondary)",
                                        letterSpacing: "0.05em",
                                        textTransform: "uppercase",
                                        margin: "0 0 0.5rem 0"
                                    }, children: "Future-ready architecture" }), _jsxs("div", { style: {
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.4rem",
                                        flexWrap: "wrap",
                                        fontSize: "0.8rem",
                                        color: "var(--clr-text-muted)"
                                    }, children: [_jsx("span", { style: {
                                                padding: "0.3rem 0.6rem",
                                                borderRadius: "6px",
                                                background: "var(--clr-bg-input)",
                                                color: "var(--clr-text-main)",
                                                fontWeight: 600
                                            }, children: "Invoice" }), _jsx("span", { children: "\\u2192" }), _jsx("span", { style: {
                                                padding: "0.3rem 0.6rem",
                                                borderRadius: "6px",
                                                background: "rgba(245,158,11,0.1)",
                                                color: "var(--clr-warning)",
                                                fontWeight: 600
                                            }, children: "Feature / Subscription Check" }), _jsx("span", { children: "\\u2192" }), _jsx("span", { style: {
                                                padding: "0.3rem 0.6rem",
                                                borderRadius: "6px",
                                                background: "rgba(6,182,212,0.1)",
                                                color: "var(--clr-secondary)",
                                                fontWeight: 600
                                            }, children: "Delivery Service (Email / WhatsApp / SMS)" })] })] }), _jsxs("details", { style: {
                                borderRadius: "var(--border-radius-md)",
                                border: "1px solid var(--clr-glass-border)",
                                padding: "0.75rem 1rem",
                                background: "var(--clr-bg-input)",
                                marginBottom: "1.5rem"
                            }, children: [_jsx("summary", { style: {
                                        cursor: "pointer",
                                        fontWeight: 600,
                                        fontSize: "0.88rem",
                                        color: "var(--clr-text-muted)"
                                    }, children: "Administrator provider configuration (preview)" }), _jsxs("div", { style: { marginTop: "0.85rem", display: "grid", gap: "0.65rem" }, children: [["SMTP Host", "SMTP Port", "SMTP Username", "SMTP Password", "From Name", "From Email", "Encryption (TLS/SSL)"].map((f) => (_jsxs("div", { style: { display: "flex", gap: "0.75rem", alignItems: "center" }, children: [_jsx("div", { style: { width: "36%", fontSize: "0.78rem", color: "var(--clr-text-muted)" }, children: f }), _jsx("div", { style: {
                                                        flex: 1,
                                                        padding: "0.4rem 0.6rem",
                                                        borderRadius: "6px",
                                                        background: "rgba(0,0,0,0.2)",
                                                        color: "var(--clr-text-muted)",
                                                        fontSize: "0.78rem",
                                                        border: "1px dashed rgba(139,92,246,0.3)"
                                                    }, children: "\\u2022\\u2022\\u2022\\u2022\\u2022\\u2022\\u2022\\u2022\\u2022\\u2022\\u2022 (requires subscription)" })] }, f))), _jsx("p", { style: {
                                                fontSize: "0.72rem",
                                                color: "var(--clr-danger)",
                                                margin: "0.35rem 0 0 0"
                                            }, children: "\\u26A0 Credentials remain backend-only. Never exposed to the frontend." })] })] }), _jsxs("div", { style: { display: "flex", gap: "0.75rem", flexWrap: "wrap" }, children: [_jsxs("button", { className: "btn btn-primary flex-1", onClick: () => {
                                        toast.success("Subscription option noted. Please contact A1 Fitness admin to activate Invoice Sending.");
                                        setDeliveryModalOpen(false);
                                    }, children: [_jsx(Crown, { size: 16 }), " Take Subscription"] }), _jsx("button", { className: "btn btn-secondary", onClick: () => setDeliveryModalOpen(false), children: "Close" })] })] }) })] }));
};
export default InvoicesPage;
