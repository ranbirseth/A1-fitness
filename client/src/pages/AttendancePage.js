import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { getAttendance, manualCheckIn } from '../features/attendance/attendance.api';
import { getMembers } from '../features/members/members.api';
import { Plus, Clock, CheckCircle2, Save, Search, UserCheck, QrCode, Download, LogOut } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import Modal from '../components/Modal';
import { format } from 'date-fns';
const AttendancePage = () => {
    const [attendance, setAttendance] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [formData, setFormData] = useState({ memberId: '' });
    const qrUrl = `${window.location.origin}/mark-attendance`;
    const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}`;
    const fetchAttendance = () => {
        setLoading(true);
        getAttendance({ search: debouncedSearch, date: dateFilter })
            .then((res) => {
            const data = res.data?.data;
            setAttendance(Array.isArray(data) ? data : (data?.items || []));
        })
            .catch(() => setAttendance([]))
            .finally(() => setLoading(false));
    };
    useEffect(() => {
        fetchAttendance();
    }, [debouncedSearch, dateFilter]);
    useEffect(() => {
        getMembers({ limit: 100 }).then(res => {
            const data = res.data?.data;
            setMembers(Array.isArray(data) ? data : (data?.items || []));
        }).catch(() => setMembers([]));
    }, []);
    const handleManualAction = async (memberId, action) => {
        setIsSaving(true);
        try {
            await manualCheckIn({ memberId, action });
            fetchAttendance();
        }
        catch (error) {
            alert(error.response?.data?.message || `Failed to ${action}`);
        }
        finally {
            setIsSaving(false);
        }
    };
    const handleMarkAttendance = async (e) => {
        e.preventDefault();
        if (!formData.memberId)
            return alert('Please select a member');
        await handleManualAction(formData.memberId, 'check-in');
        setIsModalOpen(false);
        setFormData({ memberId: '' });
    };
    const stats = {
        present: attendance.filter(a => a.status === 'present' || a.status === 'completed').length,
        completed: attendance.filter(a => a.status === 'completed').length,
        total: attendance.length
    };
    return (_jsxs("div", { children: [_jsxs("div", { className: "page-header", style: { marginBottom: '2rem', position: 'relative', overflow: 'hidden', borderRadius: '16px' }, children: [_jsx("div", { style: {
                            position: 'absolute',
                            inset: 0,
                            background: `linear-gradient(135deg, rgba(6, 182, 212, 0.7) 0%, rgba(245, 158, 11, 0.7) 100%), url('https://images.unsplash.com/photo-1517836357463-d25ddfcbf042?w=800&h=400&fit=crop')`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        } }), _jsx("div", { style: { position: 'relative', zIndex: 2 }, children: _jsxs("div", { className: "flex-responsive", style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }, children: [_jsxs("div", { children: [_jsx("h1", { style: { color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }, children: "Attendance Tracking" }), _jsx("p", { className: "text-muted", style: { color: 'rgba(255,255,255,0.9)' }, children: "Monitor daily check-ins and member activity." })] }), _jsxs("div", { style: { display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }, children: [_jsxs("button", { className: "btn btn-secondary", onClick: () => setIsQRModalOpen(true), children: [_jsx(QrCode, { size: 18 }), "View QR Code"] }), _jsxs("button", { className: "btn btn-secondary", onClick: () => window.open('/mark-attendance', '_blank'), children: [_jsx(UserCheck, { size: 18 }), "Open QR Page"] }), _jsxs("button", { className: "btn btn-primary", onClick: () => setIsModalOpen(true), children: [_jsx(Plus, { size: 18 }), "Mark Attendance"] })] })] }) })] }), _jsx(Modal, { isOpen: isModalOpen, onClose: () => setIsModalOpen(false), title: "Mark Member Attendance", children: _jsxs("form", { onSubmit: handleMarkAttendance, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Select Member" }), _jsxs("select", { className: "form-input", required: true, value: formData.memberId, onChange: e => setFormData({ ...formData, memberId: e.target.value }), children: [_jsx("option", { value: "", children: "-- Select Member --" }), members.map(m => (_jsx("option", { value: m._id, children: m.user?.name || m.name || 'Unknown' }, m._id)))] })] }), _jsx("div", { style: { marginTop: '2rem' }, children: _jsxs("button", { className: "btn btn-primary w-full", type: "submit", disabled: isSaving, children: [_jsx(Save, { size: 18 }), isSaving ? 'Saving...' : 'Save Attendance'] }) })] }) }), _jsx(Modal, { isOpen: isQRModalOpen, onClose: () => setIsQRModalOpen(false), title: "Attendance QR Code", children: _jsxs("div", { style: { textAlign: 'center', padding: '1rem' }, children: [_jsx("p", { className: "text-muted", style: { marginBottom: '1.5rem' }, children: "Display this QR code at your gym entrance. Members can scan it to mark their attendance." }), _jsx("div", { className: "glass-panel", style: {
                                display: 'inline-block',
                                padding: '1.5rem',
                                background: 'white',
                                borderRadius: '1rem',
                                marginBottom: '1.5rem'
                            }, children: _jsx("img", { src: qrImage, alt: "Attendance QR", style: { width: '250px', height: '250px', display: 'block' } }) }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem' }, children: [_jsx("p", { style: { fontSize: '0.85rem', wordBreak: 'break-all' }, className: "text-primary", children: qrUrl }), _jsxs("button", { className: "btn btn-primary", style: { justifyContent: 'center' }, onClick: () => window.open(qrImage, '_blank'), children: [_jsx(Download, { size: 18 }), "Download / Print QR"] })] })] }) }), _jsxs("div", { className: "grid-stats", children: [_jsxs("div", { className: "stat-card checkin-bg-card", style: {
                            backgroundImage: `url('https://res.cloudinary.com/dyc33dchn/image/upload/q_auto/f_auto/v1776523432/ChatGPT_Image_Apr_18_2026_08_12_31_PM_xpfcf7.png')`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }, children: [_jsxs("div", { className: "stat-info", children: [_jsx("h3", { style: { color: 'white' }, children: "Total Check-ins" }), _jsx("p", { className: "stat-value", style: { color: 'white' }, children: stats.total }), _jsxs("p", { className: "stat-trend trend-up", style: { color: '#4ade80' }, children: [stats.present, " Currently Present"] })] }), _jsx("div", { className: "stat-icon", style: { background: 'rgba(16, 185, 129, 0.3)', color: 'var(--clr-success)' }, children: _jsx(CheckCircle2, { size: 24 }) })] }), _jsxs("div", { className: "stat-card", children: [_jsxs("div", { className: "stat-info", children: [_jsx("h3", { children: "Workouts Completed" }), _jsx("p", { className: "stat-value", children: stats.completed }), _jsx("p", { className: "text-muted", children: "Members checked-out" })] }), _jsx("div", { className: "stat-icon", style: { background: 'rgba(6, 182, 212, 0.1)', color: 'var(--clr-secondary)' }, children: _jsx(UserCheck, { size: 24 }) })] }), _jsxs("div", { className: "stat-card", children: [_jsxs("div", { className: "stat-info", children: [_jsx("h3", { children: "Active Today" }), _jsx("p", { className: "stat-value", children: stats.present }), _jsx("p", { className: "text-muted", children: "Members in gym" })] }), _jsx("div", { className: "stat-icon", style: { background: 'rgba(245, 158, 11, 0.1)', color: 'var(--clr-warning)' }, children: _jsx(Clock, { size: 24 }) })] })] }), _jsxs("div", { className: "glass-panel", style: { padding: '1.5rem', marginTop: '2rem' }, children: [_jsxs("div", { className: "flex-responsive", style: { marginBottom: '1.5rem', gap: '1rem' }, children: [_jsx("h3", { style: { fontSize: '1.1rem' }, children: "Attendance Log" }), _jsxs("div", { className: "flex-responsive", style: { gap: '0.75rem', justifyContent: 'flex-end', width: '100%', maxWidth: '500px' }, children: [_jsxs("div", { className: "search-bar", style: { flex: 1, minWidth: '150px', background: 'var(--clr-bg-base)', padding: '0.4rem 0.75rem' }, children: [_jsx(Search, { size: 16, className: "text-muted" }), _jsx("input", { placeholder: "Search member...", style: { fontSize: '0.85rem' }, value: searchQuery, onChange: e => setSearchQuery(e.target.value) })] }), _jsx("input", { type: "date", className: "form-input", style: { width: 'auto', flexShrink: 0, padding: '0.4rem 0.75rem', fontSize: '0.85rem' }, value: dateFilter, onChange: e => setDateFilter(e.target.value) })] })] }), _jsx("div", { className: "table-container hide-on-mobile", style: { margin: 0, borderRadius: '12px', border: '1px solid var(--clr-glass-border)', overflowX: 'auto' }, children: _jsxs("table", { className: "data-table", style: { fontSize: '0.9rem', width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: { padding: '1rem', textAlign: 'left' }, children: "Member Name" }), _jsx("th", { style: { padding: '1rem', textAlign: 'left' }, children: "Check-in" }), _jsx("th", { style: { padding: '1rem', textAlign: 'left' }, children: "Check-out" }), _jsx("th", { style: { padding: '1rem', textAlign: 'left' }, children: "Date" }), _jsx("th", { style: { padding: '1rem', textAlign: 'left' }, children: "Status" }), _jsx("th", { style: { padding: '1rem', textAlign: 'center' }, children: "Actions" })] }) }), _jsx("tbody", { children: loading ? (_jsx("tr", { children: _jsxs("td", { colSpan: 6, className: "text-center", style: { padding: '3rem' }, children: [_jsx("div", { className: "spinner", style: { margin: '0 auto 1rem' } }), "Loading log..."] }) })) : attendance.length > 0 ? (attendance.map((entry) => (_jsxs("tr", { style: { borderBottom: '1px solid var(--clr-glass-border)' }, children: [_jsx("td", { style: { padding: '0.75rem 1rem' }, children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.75rem' }, children: [_jsx("div", { className: "avatar", style: { width: '32px', height: '32px', fontSize: '0.75rem', flexShrink: 0 }, children: (entry.member?.user?.name || 'U').charAt(0) }), _jsxs("div", { style: { minWidth: 0 }, children: [_jsx("p", { style: { fontWeight: '600', marginBottom: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }, children: entry.member?.user?.name || 'Unknown' }), _jsxs("p", { className: "text-muted", style: { fontSize: '0.7rem', marginBottom: 0 }, children: ["ID: ", entry.member?.secretCode] })] })] }) }), _jsx("td", { style: { padding: '0.75rem 1rem' }, children: entry.checkIn ? format(new Date(entry.checkIn), 'hh:mm a') : '-' }), _jsx("td", { style: { padding: '0.75rem 1rem' }, children: entry.checkOut ? format(new Date(entry.checkOut), 'hh:mm a') : '-' }), _jsx("td", { style: { padding: '0.75rem 1rem', whiteSpace: 'nowrap' }, children: entry.date }), _jsx("td", { style: { padding: '0.75rem 1rem' }, children: _jsx("span", { className: `status-badge ${entry.status === 'completed' ? 'active' : 'pending'}`, style: { fontSize: '0.75rem', padding: '0.2rem 0.6rem' }, children: entry.status }) }), _jsx("td", { style: { padding: '0.75rem 1rem', textAlign: 'center' }, children: (entry.status === 'present' || entry.status === 'late') && !entry.checkOut && (_jsx("button", { className: "btn btn-secondary btn-icon", title: "Check Out", onClick: () => handleManualAction(entry.member._id, 'check-out'), disabled: isSaving, children: _jsx(LogOut, { size: 14 }) })) })] }, entry._id)))) : (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "text-center", style: { padding: '3rem' }, children: _jsx("p", { className: "text-muted", children: "No attendance found for this selection." }) }) })) })] }) }), _jsx("div", { className: "mobile-cards-container", children: loading ? (_jsx("div", { className: "text-center", style: { padding: '2rem' }, children: _jsx("div", { className: "spinner", style: { margin: '0 auto' } }) })) : attendance.length > 0 ? (attendance.map((entry) => (_jsxs("div", { className: "mobile-card", children: [_jsxs("div", { className: "mobile-card-row", children: [_jsx("span", { className: "mobile-card-label", children: "Member" }), _jsxs("div", { className: "mobile-card-value", style: { display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end', minWidth: 0 }, children: [_jsx("div", { className: "avatar", style: { width: '24px', height: '24px', fontSize: '0.65rem', flexShrink: 0 }, children: (entry.member?.user?.name || 'U').charAt(0) }), _jsx("span", { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, children: entry.member?.user?.name || 'Unknown' })] })] }), _jsxs("div", { className: "mobile-card-row", children: [_jsx("span", { className: "mobile-card-label", children: "Check-in" }), _jsx("span", { className: "mobile-card-value", children: entry.checkIn ? format(new Date(entry.checkIn), 'hh:mm a') : '-' })] }), _jsxs("div", { className: "mobile-card-row", children: [_jsx("span", { className: "mobile-card-label", children: "Check-out" }), _jsx("span", { className: "mobile-card-value", children: entry.checkOut ? format(new Date(entry.checkOut), 'hh:mm a') : '-' })] }), _jsxs("div", { className: "mobile-card-row", children: [_jsx("span", { className: "mobile-card-label", children: "Date" }), _jsx("span", { className: "mobile-card-value", children: entry.date })] }), _jsxs("div", { className: "mobile-card-row", children: [_jsx("span", { className: "mobile-card-label", children: "Status" }), _jsxs("div", { className: "mobile-card-value", style: { display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }, children: [_jsx("span", { className: `status-badge ${entry.status === 'completed' ? 'active' : 'pending'}`, style: { fontSize: '0.7rem', padding: '0.2rem 0.5rem' }, children: entry.status }), (entry.status === 'present' || entry.status === 'late') && !entry.checkOut && (_jsx("button", { className: "btn btn-secondary btn-icon", style: { width: '28px', height: '28px' }, title: "Check Out", onClick: () => handleManualAction(entry.member._id, 'check-out'), disabled: isSaving, children: _jsx(LogOut, { size: 12 }) }))] })] })] }, entry._id)))) : (_jsx("p", { className: "text-center text-muted", style: { padding: '2rem' }, children: "No attendance found." })) })] })] }));
};
export default AttendancePage;
