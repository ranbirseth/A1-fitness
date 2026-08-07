import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { getPayments, getAdminPayments, getInvoice, markAsPaid, markAsUnpaid } from '../features/payments/payments.api';
import { getMyProfile } from '../features/members/members.api';
import { useAuthStore } from '../store/auth.store';
import { CreditCard, Calendar, Clock, Download, FileText, Printer, AlertTriangle, Check, Search, Filter, MoreVertical, X, TrendingUp, Users, DollarSign } from 'lucide-react';
import Modal from '../components/Modal';
const PaymentsPage = () => {
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
    const [payments, setPayments] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, count: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    // Invoice Modal State
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [fetchingInvoice, setFetchingInvoice] = useState(false);
    const fetchData = async () => {
        setLoading(true);
        try {
            const [payRes, profRes] = await Promise.all([
                isAdmin ? getAdminPayments() : getPayments(),
                isAdmin ? Promise.resolve({ data: { data: null } }) : getMyProfile()
            ]);
            const paymentData = payRes.data?.data;
            const items = Array.isArray(paymentData) ? paymentData : (paymentData?.items || []);
            setPayments(items);
            if (isAdmin) {
                const total = items.reduce((acc, p) => acc + (p.amount || 0), 0);
                const paid = items.filter((p) => p.status === 'paid').reduce((acc, p) => acc + (p.amount || 0), 0);
                const pending = items.filter((p) => p.status === 'pending').reduce((acc, p) => acc + (p.amount || 0), 0);
                setStats({ total, paid, pending, count: items.length });
            }
            else {
                setProfile(profRes.data?.data);
            }
        }
        catch (error) {
            console.error('Failed to fetch data', error);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchData();
    }, []);
    const handleToggleStatus = async (id, currentStatus) => {
        try {
            if (currentStatus === 'pending') {
                await markAsPaid(id);
            }
            else {
                await markAsUnpaid(id);
            }
            fetchData(); // Refresh data
        }
        catch (error) {
            alert("Failed to update payment status");
        }
    };
    const filteredPayments = payments.filter(p => {
        const matchesSearch = isAdmin
            ? p.member?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
            : p.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    const handleDownloadInvoice = async (id) => {
        setFetchingInvoice(true);
        try {
            const res = await getInvoice(id);
            setSelectedInvoice(res.data.data);
            setIsInvoiceModalOpen(true);
        }
        catch (error) {
            alert("Failed to fetch invoice data");
        }
        finally {
            setFetchingInvoice(false);
        }
    };
    const handlePrint = () => {
        window.print();
    };
    const handleDownloadPDF = () => {
        window.print();
    };
    // Calculate days until expiry
    const getDaysUntilExpiry = () => {
        if (!profile?.membershipExpiryDate)
            return null;
        const expiry = new Date(profile.membershipExpiryDate);
        const now = new Date();
        const diffTime = expiry.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };
    const daysLeft = getDaysUntilExpiry();
    const isExpirySoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
    const isExpired = daysLeft !== null && daysLeft <= 0;
    if (isAdmin) {
        return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '2rem' }, children: [_jsx("style", { children: `
          @media print {
            body * { visibility: hidden; }
            .invoice-printable, .invoice-printable * { visibility: visible; }
            .invoice-printable { position: absolute; left: 0; top: 0; width: 100%; }
            .btn-print { display: none !important; }
          }
          .stats-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 1.5rem;
            display: flex;
            align-items: center;
            gap: 1.25rem;
            transition: all 0.3s ease;
          }
          .stats-card:hover {
            transform: translateY(-4px);
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(139, 92, 246, 0.3);
          }
          .stats-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        ` }), _jsxs("div", { className: "page-header", style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }, children: [_jsxs("div", { children: [_jsx("h1", { style: { fontSize: '2rem', fontWeight: 800, margin: 0 }, children: "Payment Management" }), _jsx("p", { className: "text-muted", style: { marginTop: '0.5rem' }, children: "Overview of gym revenue and member billing" })] }), _jsxs("button", { className: "btn btn-primary", style: { display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [_jsx(DollarSign, { size: 18 }), " Record New Payment"] })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }, children: [_jsxs("div", { className: "stats-card", children: [_jsx("div", { className: "stats-icon", style: { background: 'rgba(139, 92, 246, 0.1)', color: 'var(--clr-primary)' }, children: _jsx(TrendingUp, { size: 24 }) }), _jsxs("div", { children: [_jsx("p", { className: "text-muted", style: { fontSize: '0.85rem', margin: 0 }, children: "Total Revenue" }), _jsxs("h3", { style: { fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0 0 0' }, children: ["\u20B9", stats.total.toLocaleString()] })] })] }), _jsxs("div", { className: "stats-card", children: [_jsx("div", { className: "stats-icon", style: { background: 'rgba(16, 185, 129, 0.1)', color: 'var(--clr-success)' }, children: _jsx(Check, { size: 24 }) }), _jsxs("div", { children: [_jsx("p", { className: "text-muted", style: { fontSize: '0.85rem', margin: 0 }, children: "Received" }), _jsxs("h3", { style: { fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0 0 0', color: 'var(--clr-success)' }, children: ["\u20B9", stats.paid.toLocaleString()] })] })] }), _jsxs("div", { className: "stats-card", children: [_jsx("div", { className: "stats-icon", style: { background: 'rgba(245, 158, 11, 0.1)', color: 'var(--clr-warning)' }, children: _jsx(Clock, { size: 24 }) }), _jsxs("div", { children: [_jsx("p", { className: "text-muted", style: { fontSize: '0.85rem', margin: 0 }, children: "Pending" }), _jsxs("h3", { style: { fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0 0 0', color: 'var(--clr-warning)' }, children: ["\u20B9", stats.pending.toLocaleString()] })] })] }), _jsxs("div", { className: "stats-card", children: [_jsx("div", { className: "stats-icon", style: { background: 'rgba(6, 182, 212, 0.1)', color: 'var(--clr-info)' }, children: _jsx(Users, { size: 24 }) }), _jsxs("div", { children: [_jsx("p", { className: "text-muted", style: { fontSize: '0.85rem', margin: 0 }, children: "Transactions" }), _jsx("h3", { style: { fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0 0 0' }, children: stats.count })] })] })] }), _jsxs("div", { className: "glass-panel", style: {
                        padding: '1.5rem',
                        display: 'flex',
                        gap: '1.25rem',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                    }, children: [_jsxs("div", { style: { position: 'relative', flex: 1, minWidth: '300px' }, children: [_jsx(Search, { size: 20, style: {
                                        position: 'absolute',
                                        left: '1.25rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: 'var(--clr-primary)',
                                        opacity: 0.8
                                    } }), _jsx("input", { type: "text", placeholder: "Search by member name, email or invoice #...", className: "form-control", style: {
                                        paddingLeft: '3.5rem',
                                        paddingRight: '3rem',
                                        width: '100%',
                                        height: '52px',
                                        fontSize: '1rem',
                                        background: 'rgba(0, 0, 0, 0.2)',
                                        border: '1px solid rgba(139, 92, 246, 0.2)',
                                        borderRadius: '14px',
                                        color: '#fff',
                                        transition: 'all 0.3s ease'
                                    }, onFocus: (e) => {
                                        e.target.style.borderColor = 'var(--clr-primary)';
                                        e.target.style.boxShadow = '0 0 0 4px rgba(139, 92, 246, 0.1)';
                                        e.target.style.background = 'rgba(0, 0, 0, 0.3)';
                                    }, onBlur: (e) => {
                                        e.target.style.borderColor = 'rgba(139, 92, 246, 0.2)';
                                        e.target.style.boxShadow = 'none';
                                        e.target.style.background = 'rgba(0, 0, 0, 0.2)';
                                    }, value: searchQuery, onChange: (e) => setSearchQuery(e.target.value) }), searchQuery && (_jsx("button", { onClick: () => setSearchQuery(''), style: {
                                        position: 'absolute',
                                        right: '1rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '24px',
                                        height: '24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: 'var(--clr-text-muted)',
                                        transition: 'all 0.2s ease'
                                    }, onMouseOver: (e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)', onMouseOut: (e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)', children: _jsx(X, { size: 14 }) }))] }), _jsx("div", { style: { display: 'flex', gap: '0.75rem', alignItems: 'center' }, children: _jsxs("div", { style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    background: 'rgba(0, 0, 0, 0.2)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '14px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    height: '52px'
                                }, children: [_jsx(Filter, { size: 18, style: { color: 'var(--clr-primary)' } }), _jsxs("select", { className: "form-control", style: {
                                            width: '140px',
                                            border: 'none',
                                            background: 'transparent',
                                            padding: 0,
                                            margin: 0,
                                            height: 'auto',
                                            cursor: 'pointer',
                                            fontSize: '0.95rem',
                                            fontWeight: 600,
                                            color: '#fff'
                                        }, value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), children: [_jsx("option", { value: "all", style: { background: '#1a1b23' }, children: "All Status" }), _jsx("option", { value: "paid", style: { background: '#1a1b23' }, children: "Paid" }), _jsx("option", { value: "pending", style: { background: '#1a1b23' }, children: "Pending" })] })] }) })] }), _jsx("div", { className: "glass-panel", style: { padding: 0, overflow: 'hidden' }, children: loading ? (_jsxs("div", { style: { textAlign: 'center', padding: '5rem' }, children: [_jsx("div", { className: "spinner", style: { margin: '0 auto' } }), _jsx("p", { className: "text-muted", style: { marginTop: '1rem' }, children: "Loading payment data..." })] })) : filteredPayments.length === 0 ? (_jsxs("div", { style: { textAlign: 'center', padding: '5rem' }, children: [_jsx(CreditCard, { size: 64, style: { color: 'var(--clr-text-muted)', opacity: 0.2, margin: '0 auto 1.5rem' } }), _jsx("h3", { className: "text-muted", children: "No payments found" }), _jsx("p", { className: "text-muted", style: { fontSize: '0.9rem' }, children: "Try adjusting your search or filters" })] })) : (_jsx("div", { style: { overflowX: 'auto' }, children: _jsxs("table", { className: "data-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: { padding: '1rem 1.5rem' }, children: "Member" }), _jsx("th", { style: { padding: '1rem' }, children: "Plan" }), _jsx("th", { style: { padding: '1rem' }, children: "Amount" }), _jsx("th", { style: { padding: '1rem' }, children: "Date" }), _jsx("th", { style: { padding: '1rem' }, children: "Method" }), _jsx("th", { style: { padding: '1rem' }, children: "Status" }), _jsx("th", { style: { padding: '1rem 1.5rem', textAlign: 'right' }, children: "Actions" })] }) }), _jsx("tbody", { children: filteredPayments.map((p) => (_jsxs("tr", { children: [_jsx("td", { style: { padding: '1rem 1.5rem' }, children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.75rem' }, children: [_jsx("div", { style: {
                                                                width: '36px', height: '36px', borderRadius: '10px',
                                                                background: 'rgba(139, 92, 246, 0.1)', color: 'var(--clr-primary)',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontWeight: 700, fontSize: '0.9rem'
                                                            }, children: p.member?.user?.name?.charAt(0) || '?' }), _jsxs("div", { children: [_jsx("p", { style: { fontWeight: 600, margin: 0 }, children: p.member?.user?.name || 'Unknown Member' }), _jsx("p", { className: "text-muted", style: { fontSize: '0.75rem', margin: 0, fontFamily: 'monospace' }, children: p.invoiceNumber })] })] }) }), _jsx("td", { style: { padding: '1rem' }, children: _jsx("span", { style: { fontSize: '0.9rem' }, children: p.plan?.name || 'Manual' }) }), _jsx("td", { style: { padding: '1rem' }, children: _jsxs("span", { style: { fontWeight: 700, color: 'var(--clr-primary)' }, children: ["\u20B9", (p.amount || 0).toLocaleString()] }) }), _jsx("td", { style: { padding: '1rem' }, children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }, children: [_jsx(Calendar, { size: 14, className: "text-muted" }), new Date(p.date || p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })] }) }), _jsx("td", { style: { padding: '1rem' }, children: _jsx("span", { style: { fontSize: '0.85rem', textTransform: 'capitalize', color: 'var(--clr-text-muted)' }, children: p.method || 'cash' }) }), _jsx("td", { style: { padding: '1rem' }, children: _jsx("button", { onClick: () => handleToggleStatus(p._id, p.status), className: `status-badge ${p.status === 'paid' ? 'active' : 'pending'}`, style: { border: 'none', cursor: 'pointer', transition: 'all 0.2s ease' }, children: p.status }) }), _jsx("td", { style: { padding: '1rem 1.5rem', textAlign: 'right' }, children: _jsxs("div", { style: { display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }, children: [_jsx("button", { className: "btn-icon", title: "View Invoice", onClick: () => handleDownloadInvoice(p._id), disabled: fetchingInvoice, children: _jsx(FileText, { size: 16 }) }), _jsx("button", { className: "btn-icon", title: "More Options", children: _jsx(MoreVertical, { size: 16 }) })] }) })] }, p._id))) })] }) })) }), _jsx(Modal, { isOpen: isInvoiceModalOpen, onClose: () => setIsInvoiceModalOpen(false), title: "Payment Invoice", children: selectedInvoice && (_jsxs("div", { className: "invoice-printable", style: { padding: '1rem', color: '#1a1a1a', background: 'white', borderRadius: '8px' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '2px solid #eee', paddingBottom: '1rem', alignItems: 'center' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem' }, children: [_jsx("img", { src: "https://res.cloudinary.com/dyc33dchn/image/upload/q_auto/f_auto/v1776476678/WhatsApp_Image_2026-04-15_at_10.11.03_PM_2_jvuq84.jpg", alt: "RUDRA FITNESS", style: { width: '50px', height: '50px', borderRadius: '12px', objectFit: 'cover' } }), _jsxs("div", { children: [_jsx("h2", { style: { background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '0.25rem', fontSize: '1.4rem', fontFamily: '"Bebas Neue", sans-serif', fontWeight: '700', letterSpacing: '0.1em', margin: 0 }, children: "RUDRA FITNESS" }), _jsx("p", { style: { fontSize: '0.85rem', color: '#666', margin: 0 }, children: "Premium Fitness Center" })] })] }), _jsxs("div", { style: { textAlign: 'right' }, children: [_jsx("h3", { style: { marginBottom: '0.25rem' }, children: "INVOICE" }), _jsx("p", { style: { fontSize: '0.9rem', fontWeight: 'bold' }, children: selectedInvoice.invoiceNumber })] })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }, children: [_jsxs("div", { children: [_jsx("h4", { style: { fontSize: '0.75rem', textTransform: 'uppercase', color: '#888', marginBottom: '0.5rem' }, children: "Billed To" }), _jsx("p", { style: { fontWeight: 'bold' }, children: selectedInvoice.member?.user?.name }), _jsx("p", { style: { fontSize: '0.85rem' }, children: selectedInvoice.member?.user?.email }), _jsx("p", { style: { fontSize: '0.85rem' }, children: selectedInvoice.member?.user?.phone })] }), _jsxs("div", { style: { textAlign: 'right' }, children: [_jsx("h4", { style: { fontSize: '0.75rem', textTransform: 'uppercase', color: '#888', marginBottom: '0.5rem' }, children: "Payment Details" }), _jsxs("p", { style: { fontSize: '0.85rem' }, children: ["Date: ", new Date(selectedInvoice.date).toLocaleDateString()] }), _jsxs("p", { style: { fontSize: '0.85rem' }, children: ["Method: ", _jsx("span", { style: { textTransform: 'capitalize' }, children: selectedInvoice.method })] }), _jsxs("p", { style: { fontSize: '0.85rem' }, children: ["Status: ", _jsx("span", { style: { color: selectedInvoice.status === 'paid' ? '#10b981' : '#f59e0b', fontWeight: 'bold' }, children: selectedInvoice.status.toUpperCase() })] })] })] }), _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { background: '#f8f9fa' }, children: [_jsx("th", { style: { textAlign: 'left', padding: '12px', borderBottom: '1px solid #eee' }, children: "Description" }), _jsx("th", { style: { textAlign: 'right', padding: '12px', borderBottom: '1px solid #eee' }, children: "Amount" })] }) }), _jsx("tbody", { children: _jsxs("tr", { children: [_jsxs("td", { style: { padding: '12px', borderBottom: '1px solid #eee' }, children: [_jsx("p", { style: { fontWeight: 'bold' }, children: selectedInvoice.plan?.name || 'Membership Plan' }), _jsxs("p", { style: { fontSize: '0.75rem', color: '#666' }, children: [selectedInvoice.plan?.duration, " Days Access"] })] }), _jsxs("td", { style: { textAlign: 'right', padding: '12px', borderBottom: '1px solid #eee', fontWeight: 'bold' }, children: ["\u20B9", selectedInvoice.amount.toLocaleString()] })] }) }), _jsx("tfoot", { children: _jsxs("tr", { children: [_jsx("td", { style: { padding: '12px', textAlign: 'right', fontWeight: 'bold' }, children: "Total" }), _jsxs("td", { style: { padding: '12px', textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--clr-primary)' }, children: ["\u20B9", selectedInvoice.amount.toLocaleString()] })] }) })] }), _jsxs("div", { style: { textAlign: 'center', marginTop: '3rem', borderTop: '1px solid #eee', paddingTop: '1rem' }, children: [_jsx("p", { style: { fontSize: '0.8rem', color: '#888' }, children: "Thank you for your business!" }), _jsx("p", { style: { fontSize: '0.75rem', color: '#aaa', marginTop: '0.5rem' }, children: "This is a computer-generated invoice." })] }), _jsxs("div", { className: "btn-print", style: { marginTop: '2rem', display: 'flex', gap: '1rem' }, children: [_jsxs("button", { className: "btn btn-primary flex-1", onClick: handlePrint, children: [_jsx(Printer, { size: 18 }), " Print Invoice"] }), _jsxs("button", { className: "btn btn-secondary flex-1", onClick: handleDownloadPDF, children: [_jsx(Download, { size: 18 }), " Download (PDF)"] }), _jsx("button", { className: "btn btn-secondary", onClick: () => setIsInvoiceModalOpen(false), children: "Close" })] })] })) })] }));
    }
    // Member View (Original)
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '1.5rem' }, children: [_jsx("style", { children: `
        @media print {
          body * { visibility: hidden; }
          .invoice-printable, .invoice-printable * { visibility: visible; }
          .invoice-printable { position: absolute; left: 0; top: 0; width: 100%; }
          .btn-print { display: none !important; }
        }
      ` }), _jsx("div", { className: "page-header", children: _jsxs("div", { children: [_jsx("h1", { children: "My Payments & Billing" }), _jsx("p", { className: "text-muted", children: "Manage your subscription and payment history" })] }) }), profile?.currentPlan ? (_jsxs("div", { className: "glass-panel", style: { padding: 0, background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)', border: '1px solid rgba(139, 92, 246, 0.2)', overflow: 'hidden' }, children: [_jsx("div", { style: {
                            position: 'relative',
                            height: '180px',
                            background: `linear-gradient(135deg, rgba(139, 92, 246, 0.6) 0%, rgba(6, 182, 212, 0.6) 100%), url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=300&fit=crop')`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            borderBottom: '2px solid rgba(139, 92, 246, 0.2)'
                        }, children: _jsx("div", { style: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', padding: '1.5rem', background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)' }, children: _jsxs("div", { children: [_jsx("h2", { style: { fontSize: '1.8rem', fontWeight: 700, color: 'white', margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }, children: "Premium Membership" }), _jsx("p", { style: { color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }, children: "Your exclusive fitness journey" })] }) }) }), _jsxs("div", { style: { padding: '1.5rem' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }, children: [_jsx("div", { style: { background: 'rgba(139, 92, 246, 0.15)', borderRadius: '12px', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: _jsx(CreditCard, { size: 24, style: { color: 'var(--clr-primary)' } }) }), _jsxs("div", { children: [_jsx("h2", { style: { fontSize: '1rem', margin: 0 }, children: "Plan Details" }), _jsx("p", { className: "text-muted", style: { fontSize: '0.8rem', margin: '0.25rem 0 0 0' }, children: "Your current subscription" })] }), _jsx("div", { style: { marginLeft: 'auto' }, children: _jsx("span", { className: "status-badge active", children: "Active" }) })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }, children: [_jsxs("div", { style: { background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }, children: [_jsx("p", { className: "text-muted", style: { fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, marginBottom: '0.5rem' }, children: "Plan Name" }), _jsx("p", { style: { fontWeight: 700, fontSize: '1.1rem', color: 'var(--clr-primary)', margin: 0 }, children: profile.currentPlan.name })] }), _jsxs("div", { style: { background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }, children: [_jsx("p", { className: "text-muted", style: { fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, marginBottom: '0.5rem' }, children: "Start Date" }), _jsx("p", { style: { fontWeight: 600, fontSize: '0.95rem', margin: 0 }, children: profile.membershipStartDate ? new Date(profile.membershipStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : 'N/A' })] }), _jsxs("div", { style: { background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }, children: [_jsx("p", { className: "text-muted", style: { fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, marginBottom: '0.5rem' }, children: "Expiry Date" }), _jsx("p", { style: { fontWeight: 600, fontSize: '0.95rem', color: isExpired ? 'var(--clr-danger)' : isExpirySoon ? 'var(--clr-warning)' : 'inherit', margin: 0 }, children: profile.membershipExpiryDate ? new Date(profile.membershipExpiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : 'N/A' })] }), _jsxs("div", { style: { background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }, children: [_jsx("p", { className: "text-muted", style: { fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, marginBottom: '0.5rem' }, children: "Days Left" }), _jsx("p", { style: { fontWeight: 700, fontSize: '1.1rem', color: isExpired ? 'var(--clr-danger)' : isExpirySoon ? 'var(--clr-warning)' : 'var(--clr-success)', margin: 0 }, children: daysLeft === null ? 'N/A' : daysLeft <= 0 ? 'Expired' : `${daysLeft} days` })] })] }), isExpired && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(244, 63, 94, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(244, 63, 94, 0.3)' }, children: [_jsx(AlertTriangle, { size: 20, style: { color: 'var(--clr-danger)', flexShrink: 0 } }), _jsxs("div", { children: [_jsx("p", { style: { fontWeight: 600, color: 'var(--clr-danger)', margin: 0, marginBottom: '0.25rem' }, children: "Subscription Expired" }), _jsx("p", { className: "text-muted", style: { fontSize: '0.85rem', margin: 0 }, children: "Your subscription has expired. Please renew to continue accessing the gym." })] })] })), isExpirySoon && !isExpired && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.3)' }, children: [_jsx(Clock, { size: 20, style: { color: 'var(--clr-warning)', flexShrink: 0 } }), _jsxs("div", { children: [_jsx("p", { style: { fontWeight: 600, color: 'var(--clr-warning)', margin: 0, marginBottom: '0.25rem' }, children: "Expiring Soon" }), _jsxs("p", { className: "text-muted", style: { fontSize: '0.85rem', margin: 0 }, children: ["Your subscription expires in ", daysLeft, " days. Renew now to avoid interruption."] })] })] }))] })] })) : (_jsxs("div", { className: "glass-panel", style: { padding: '1.5rem', textAlign: 'center', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)' }, children: [_jsx(AlertTriangle, { size: 32, style: { color: 'var(--clr-warning)', margin: '0 auto 0.5rem' } }), _jsx("p", { className: "text-muted", style: { marginBottom: '0.35rem' }, children: "No active plan assigned" }), _jsx("p", { style: { fontSize: '0.85rem', color: 'var(--clr-text-muted)' }, children: "Please contact the admin to subscribe to a plan." })] })), _jsxs("div", { className: "glass-panel", style: { padding: '1.5rem' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }, children: [_jsx("div", { style: { background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: _jsx(CreditCard, { size: 24, style: { color: 'var(--clr-success)' } }) }), _jsx("h2", { style: { fontSize: '1.1rem', margin: 0 }, children: "Payment History" })] }), loading ? (_jsx("div", { style: { textAlign: 'center', padding: '3rem' }, children: _jsx("div", { className: "spinner", style: { margin: '0 auto' } }) })) : filteredPayments.length === 0 ? (_jsxs("div", { style: { textAlign: 'center', padding: '2rem' }, children: [_jsx(CreditCard, { size: 48, style: { color: 'var(--clr-text-muted)', opacity: 0.3, margin: '0 auto 1rem' } }), _jsx("p", { className: "text-muted", children: "No payment records found" })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "table-container hide-on-mobile", style: { margin: 0, border: 'none', background: 'transparent', overflowX: 'auto' }, children: _jsxs("table", { className: "data-table", style: { fontSize: '0.85rem' }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: { padding: '0.75rem 1rem' }, children: "Invoice #" }), _jsx("th", { style: { padding: '0.75rem 1rem' }, children: "Plan" }), _jsx("th", { style: { padding: '0.75rem 1rem' }, children: "Amount" }), _jsx("th", { style: { padding: '0.75rem 1rem' }, children: "Date" }), _jsx("th", { style: { padding: '0.75rem 1rem' }, children: "Status" }), _jsx("th", { style: { padding: '0.75rem 1rem' }, children: "Action" })] }) }), _jsx("tbody", { children: filteredPayments.map((p) => (_jsxs("tr", { children: [_jsx("td", { style: { padding: '0.75rem 1rem' }, children: _jsx("span", { style: { fontFamily: 'monospace', fontWeight: '600', color: 'var(--clr-primary)', fontSize: '0.8rem' }, children: p.invoiceNumber }) }), _jsx("td", { style: { padding: '0.75rem 1rem' }, children: _jsx("span", { className: "status-badge active", style: { background: 'rgba(139, 92, 246, 0.1)', color: 'var(--clr-primary)', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }, children: p.plan?.name || 'Manual Payment' }) }), _jsxs("td", { style: { padding: '0.75rem 1rem', fontWeight: '700' }, children: ["\u20B9", (p.amount || 0).toLocaleString()] }), _jsx("td", { style: { padding: '0.75rem 1rem', whiteSpace: 'nowrap' }, children: new Date(p.date || p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) }), _jsx("td", { style: { padding: '0.75rem 1rem' }, children: _jsxs("span", { className: `status-badge ${p.status === 'paid' ? 'active' : 'pending'}`, style: { fontSize: '0.75rem', padding: '0.2rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }, children: [p.status === 'paid' ? _jsx(Check, { size: 12 }) : _jsx(Clock, { size: 12 }), p.status] }) }), _jsx("td", { style: { padding: '0.75rem 1rem' }, children: _jsx("button", { className: "btn-icon", style: { width: '28px', height: '28px' }, onClick: () => handleDownloadInvoice(p._id), title: "View Invoice", disabled: fetchingInvoice, children: _jsx(FileText, { size: 14 }) }) })] }, p._id))) })] }) }), _jsx("div", { className: "mobile-cards-container", children: filteredPayments.map((p) => (_jsxs("div", { className: "mobile-card", style: { cursor: 'pointer' }, onClick: () => handleDownloadInvoice(p._id), children: [_jsxs("div", { className: "mobile-card-row", children: [_jsx("span", { className: "mobile-card-label", children: "Invoice" }), _jsx("span", { className: "mobile-card-value", style: { fontFamily: 'monospace', fontWeight: '600', color: 'var(--clr-primary)' }, children: p.invoiceNumber })] }), _jsxs("div", { className: "mobile-card-row", children: [_jsx("span", { className: "mobile-card-label", children: "Plan" }), _jsx("span", { className: "mobile-card-value", children: p.plan?.name || 'Manual Payment' })] }), _jsxs("div", { className: "mobile-card-row", children: [_jsx("span", { className: "mobile-card-label", children: "Amount" }), _jsxs("span", { className: "mobile-card-value", style: { fontWeight: '700', color: 'var(--clr-primary)' }, children: ["\u20B9", (p.amount || 0).toLocaleString()] })] }), _jsxs("div", { className: "mobile-card-row", children: [_jsx("span", { className: "mobile-card-label", children: "Date" }), _jsx("span", { className: "mobile-card-value", children: new Date(p.date || p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) })] }), _jsxs("div", { className: "mobile-card-row", children: [_jsx("span", { className: "mobile-card-label", children: "Status" }), _jsx("span", { className: `status-badge ${p.status === 'paid' ? 'active' : 'pending'}`, style: { fontSize: '0.75rem' }, children: p.status })] }), _jsx("div", { style: { marginTop: '0.75rem', textAlign: 'center' }, children: _jsx("p", { className: "text-muted", style: { fontSize: '0.7rem', margin: 0 }, children: "Tap to view invoice" }) })] }, p._id))) })] }))] }), _jsx(Modal, { isOpen: isInvoiceModalOpen, onClose: () => setIsInvoiceModalOpen(false), title: "Payment Invoice", children: selectedInvoice && (_jsxs("div", { className: "invoice-printable", style: { padding: '1rem', color: '#1a1a1a', background: 'white', borderRadius: '8px' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '2px solid #eee', paddingBottom: '1rem', alignItems: 'center' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem' }, children: [_jsx("img", { src: "https://res.cloudinary.com/dyc33dchn/image/upload/q_auto/f_auto/v1776476678/WhatsApp_Image_2026-04-15_at_10.11.03_PM_2_jvuq84.jpg", alt: "RUDRA FITNESS", style: { width: '50px', height: '50px', borderRadius: '12px', objectFit: 'cover' } }), _jsxs("div", { children: [_jsx("h2", { style: { background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '0.25rem', fontSize: '1.4rem', fontFamily: '"Bebas Neue", sans-serif', fontWeight: '700', letterSpacing: '0.1em', margin: 0 }, children: "RUDRA FITNESS" }), _jsx("p", { style: { fontSize: '0.85rem', color: '#666', margin: 0 }, children: "Premium Fitness Center" })] })] }), _jsxs("div", { style: { textAlign: 'right' }, children: [_jsx("h3", { style: { marginBottom: '0.25rem' }, children: "INVOICE" }), _jsx("p", { style: { fontSize: '0.9rem', fontWeight: 'bold' }, children: selectedInvoice.invoiceNumber })] })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }, children: [_jsxs("div", { children: [_jsx("h4", { style: { fontSize: '0.75rem', textTransform: 'uppercase', color: '#888', marginBottom: '0.5rem' }, children: "Billed To" }), _jsx("p", { style: { fontWeight: 'bold' }, children: selectedInvoice.member?.user?.name }), _jsx("p", { style: { fontSize: '0.85rem' }, children: selectedInvoice.member?.user?.email }), _jsx("p", { style: { fontSize: '0.85rem' }, children: selectedInvoice.member?.user?.phone })] }), _jsxs("div", { style: { textAlign: 'right' }, children: [_jsx("h4", { style: { fontSize: '0.75rem', textTransform: 'uppercase', color: '#888', marginBottom: '0.5rem' }, children: "Payment Details" }), _jsxs("p", { style: { fontSize: '0.85rem' }, children: ["Date: ", new Date(selectedInvoice.date).toLocaleDateString()] }), _jsxs("p", { style: { fontSize: '0.85rem' }, children: ["Method: ", _jsx("span", { style: { textTransform: 'capitalize' }, children: selectedInvoice.method })] }), _jsxs("p", { style: { fontSize: '0.85rem' }, children: ["Status: ", _jsx("span", { style: { color: selectedInvoice.status === 'paid' ? '#10b981' : '#f59e0b', fontWeight: 'bold' }, children: selectedInvoice.status.toUpperCase() })] })] })] }), _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { background: '#f8f9fa' }, children: [_jsx("th", { style: { textAlign: 'left', padding: '12px', borderBottom: '1px solid #eee' }, children: "Description" }), _jsx("th", { style: { textAlign: 'right', padding: '12px', borderBottom: '1px solid #eee' }, children: "Amount" })] }) }), _jsx("tbody", { children: _jsxs("tr", { children: [_jsxs("td", { style: { padding: '12px', borderBottom: '1px solid #eee' }, children: [_jsx("p", { style: { fontWeight: 'bold' }, children: selectedInvoice.plan?.name || 'Membership Plan' }), _jsxs("p", { style: { fontSize: '0.75rem', color: '#666' }, children: [selectedInvoice.plan?.duration, " Days Access"] })] }), _jsxs("td", { style: { textAlign: 'right', padding: '12px', borderBottom: '1px solid #eee', fontWeight: 'bold' }, children: ["\u20B9", selectedInvoice.amount.toLocaleString()] })] }) }), _jsx("tfoot", { children: _jsxs("tr", { children: [_jsx("td", { style: { padding: '12px', textAlign: 'right', fontWeight: 'bold' }, children: "Total" }), _jsxs("td", { style: { padding: '12px', textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--clr-primary)' }, children: ["\u20B9", selectedInvoice.amount.toLocaleString()] })] }) })] }), _jsxs("div", { style: { textAlign: 'center', marginTop: '3rem', borderTop: '1px solid #eee', paddingTop: '1rem' }, children: [_jsx("p", { style: { fontSize: '0.8rem', color: '#888' }, children: "Thank you for your business!" }), _jsx("p", { style: { fontSize: '0.75rem', color: '#aaa', marginTop: '0.5rem' }, children: "This is a computer-generated invoice." })] }), _jsxs("div", { className: "btn-print", style: { marginTop: '2rem', display: 'flex', gap: '1rem' }, children: [_jsxs("button", { className: "btn btn-primary flex-1", onClick: handlePrint, children: [_jsx(Printer, { size: 18 }), " Print Invoice"] }), _jsxs("button", { className: "btn btn-secondary flex-1", onClick: handleDownloadPDF, children: [_jsx(Download, { size: 18 }), " Download (PDF)"] }), _jsx("button", { className: "btn btn-secondary", onClick: () => setIsInvoiceModalOpen(false), children: "Close" })] })] })) })] }));
};
export default PaymentsPage;
