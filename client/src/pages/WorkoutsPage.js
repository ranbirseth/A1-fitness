import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Dumbbell, Utensils, Zap, Clock, Plus, Trash2, Search, UserPlus, AlertTriangle, CreditCard, FileText, CalendarCheck, TrendingUp, Award, Download, RefreshCw, UserSquare2, Mail, Phone } from 'lucide-react';
import { getWorkoutTemplates, createWorkoutTemplate, deleteWorkoutPlan, assignWorkoutToMember, getMyWorkout } from '../features/workouts/workouts.api';
import { getDietTemplates, createDietTemplate, deleteDietPlan, assignDietToMember, getMyDiet } from '../features/diets/diets.api';
import { getMembers, getMyProfile } from '../features/members/members.api';
import { getPayments } from '../features/payments/payments.api';
import { markAttendance, getMyAttendance, getTodayAttendanceStatus, getMyAttendanceStats, exportMyAttendance } from '../features/attendance/attendance.api';
import { useAuthStore } from '../store/auth.store';
import { useSocket } from '../hooks/useSocket';
import Modal from '../components/Modal';
const MemberView = () => {
    const { user } = useAuthStore();
    const [workout, setWorkout] = useState(null);
    const [diet, setDiet] = useState(null);
    const [profile, setProfile] = useState(null);
    const [payments, setPayments] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [stats, setStats] = useState(null);
    const [todayAttendance, setTodayAttendance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [markingAttendance, setMarkingAttendance] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [attendanceStatusFilter, setAttendanceStatusFilter] = useState('all');
    const [attendanceDateFilter, setAttendanceDateFilter] = useState({ start: '', end: '' });
    const [sortOrder, setSortOrder] = useState('desc');
    const [activeSection, setActiveSection] = useState('overview');
    const fetchData = async () => {
        // We only set loading true on initial fetch or filter change, not on socket update
        // to avoid UI flickering
        try {
            const results = await Promise.allSettled([
                getMyWorkout(),
                getMyDiet(),
                getMyProfile(),
                getPayments().catch(err => {
                    console.error("Payment fetch error:", err);
                    return { data: { data: { items: [] } } };
                }),
                getMyAttendance({ status: attendanceStatusFilter !== 'all' ? attendanceStatusFilter : undefined }),
                getTodayAttendanceStatus(),
                getMyAttendanceStats()
            ]);
            // Handle each result individually to prevent one failure from breaking the entire dashboard
            const wRes = results[0];
            const dRes = results[1];
            const pRes = results[2];
            const payRes = results[3];
            const attRes = results[4];
            const todayRes = results[5];
            const statsRes = results[6];
            if (wRes.status === 'fulfilled') {
                setWorkout(wRes.value?.data?.data ?? null);
            }
            else {
                console.error("Failed to fetch workout:", wRes.reason);
                setWorkout(null);
            }
            if (dRes.status === 'fulfilled') {
                setDiet(dRes.value?.data?.data ?? null);
            }
            else {
                console.error("Failed to fetch diet:", dRes.reason);
                setDiet(null);
            }
            if (pRes.status === 'fulfilled') {
                const profileData = pRes.value?.data?.data ?? null;
                setProfile(profileData);
                console.log("Member Dashboard Profile Data:", profileData);
            }
            else {
                console.error("Failed to fetch profile:", pRes.reason);
                setProfile(null);
            }
            if (payRes.status === 'fulfilled') {
                const paymentData = payRes.value?.data?.data?.items || payRes.value?.data?.data || [];
                setPayments(Array.isArray(paymentData) ? paymentData : []);
            }
            else {
                console.error("Failed to fetch payments:", payRes.reason);
                setPayments([]);
            }
            if (attRes.status === 'fulfilled') {
                setAttendance(attRes.value?.data?.data?.items || []);
            }
            else {
                console.error("Failed to fetch attendance:", attRes.reason);
                setAttendance([]);
            }
            if (todayRes.status === 'fulfilled') {
                setTodayAttendance(todayRes.value?.data?.data ?? null);
            }
            else {
                console.error("Failed to fetch today attendance:", todayRes.reason);
                setTodayAttendance(null);
            }
            if (statsRes.status === 'fulfilled') {
                setStats(statsRes.value?.data?.data ?? null);
            }
            else {
                console.error("Failed to fetch stats:", statsRes.reason);
                setStats(null);
            }
        }
        catch (error) {
            console.error("Unexpected error in fetchData:", error);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        setLoading(true);
        fetchData();
    }, [attendanceStatusFilter]);
    // Real-time synchronization
    useSocket((event, payload) => {
        if (event === "member:updated") {
            if (payload.userId === user?._id || payload.memberId === profile?._id) {
                fetchData();
            }
        }
        if (event === "attendance:checkin" || event === "attendance:checkout") {
            if (payload.memberId === profile?._id) {
                fetchData();
            }
        }
    });
    const handleMarkAttendance = async (action) => {
        if (!profile?.secretCode) {
            alert("Member code not found. Please contact admin.");
            return;
        }
        setMarkingAttendance(true);
        try {
            const res = await markAttendance({ secretCode: profile.secretCode, action });
            alert(res.data.message);
            const [attRes, todayRes, statsRes] = await Promise.all([
                getMyAttendance({ status: attendanceStatusFilter !== 'all' ? attendanceStatusFilter : undefined }),
                getTodayAttendanceStatus(),
                getMyAttendanceStats()
            ]);
            setAttendance(attRes?.data?.data?.items || []);
            setTodayAttendance(todayRes?.data?.data ?? null);
            setStats(statsRes?.data?.data ?? null);
        }
        catch (error) {
            alert(error.response?.data?.message || `Failed to ${action}`);
        }
        finally {
            setMarkingAttendance(false);
        }
    };
    const handleExport = async (format) => {
        setExporting(true);
        try {
            const res = await exportMyAttendance(format, attendanceDateFilter.start, attendanceDateFilter.end);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance_${new Date().toISOString().split('T')[0]}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        }
        catch (error) {
            alert("Failed to export attendance data");
        }
        finally {
            setExporting(false);
        }
    };
    if (loading)
        return _jsx("div", { className: "loading-state", children: _jsx("div", { className: "spinner" }) });
    const workoutDays = Array.isArray(workout?.days) ? workout.days : [];
    const mealItems = (meal) => {
        const meals = diet?.meals;
        const items = meals && typeof meals === 'object' ? meals[meal] : undefined;
        return Array.isArray(items) ? items : [];
    };
    const getDaysRemaining = () => {
        if (!profile?.membershipExpiryDate)
            return null;
        const expiry = new Date(profile.membershipExpiryDate);
        const now = new Date();
        const diffTime = expiry.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };
    const daysRemaining = getDaysRemaining();
    const isPendingPayment = profile?.paymentStatus === 'pending';
    const getStatusBadge = (status) => {
        const statusMap = {
            present: { class: 'pending', label: 'In Gym' },
            completed: { class: 'active', label: 'Completed' },
            absent: { class: 'inactive', label: 'Absent' },
            late: { class: 'pending', label: 'Late' },
            'half-day': { class: 'pending', label: 'Half Day' }
        };
        const { class: cls, label } = statusMap[status] || { class: 'pending', label: status };
        return _jsx("span", { className: `status-badge ${cls}`, children: label });
    };
    const sortedAttendance = [...attendance].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '2rem' }, children: [_jsxs("div", { style: { display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--clr-glass-border)', paddingBottom: '0.5rem' }, children: [_jsx("button", { onClick: () => setActiveSection('overview'), style: {
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            background: activeSection === 'overview' ? 'var(--clr-accent-gradient)' : 'transparent',
                            color: activeSection === 'overview' ? 'white' : 'var(--clr-text-muted)'
                        }, children: "Overview" }), _jsx("button", { onClick: () => setActiveSection('attendance'), style: {
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            background: activeSection === 'attendance' ? 'var(--clr-accent-gradient)' : 'transparent',
                            color: activeSection === 'attendance' ? 'white' : 'var(--clr-text-muted)'
                        }, children: "My Attendance" })] }), activeSection === 'overview' ? (_jsxs(_Fragment, { children: [stats && (_jsxs("div", { className: "grid-cards", style: { gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }, children: [_jsxs("div", { className: "glass-panel", style: { padding: '1rem', textAlign: 'center' }, children: [_jsx(TrendingUp, { size: 24, style: { color: 'var(--clr-success)', marginBottom: '0.5rem' } }), _jsx("h3", { style: { fontSize: '1.75rem', fontWeight: 800 }, children: stats.presentDays || 0 }), _jsx("p", { className: "text-muted", style: { fontSize: '0.75rem' }, children: "Total Sessions" })] }), _jsxs("div", { className: "glass-panel", style: { padding: '1rem', textAlign: 'center' }, children: [_jsx(Award, { size: 24, style: { color: 'var(--clr-primary)', marginBottom: '0.5rem' } }), _jsxs("h3", { style: { fontSize: '1.75rem', fontWeight: 800 }, children: [stats.attendanceRate || 0, "%"] }), _jsx("p", { className: "text-muted", style: { fontSize: '0.75rem' }, children: "Attendance Rate" })] }), _jsxs("div", { className: "glass-panel", style: { padding: '1rem', textAlign: 'center' }, children: [_jsx(CalendarCheck, { size: 24, style: { color: '#f59e0b', marginBottom: '0.5rem' } }), _jsx("h3", { style: { fontSize: '1.75rem', fontWeight: 800 }, children: stats.currentStreak || 0 }), _jsx("p", { className: "text-muted", style: { fontSize: '0.75rem' }, children: "Current Streak" })] }), _jsxs("div", { className: "glass-panel", style: { padding: '1rem', textAlign: 'center' }, children: [_jsx(Clock, { size: 24, style: { color: 'var(--clr-secondary)', marginBottom: '0.5rem' } }), _jsx("h3", { style: { fontSize: '1.75rem', fontWeight: 800 }, children: stats.avgCheckInTime || 'N/A' }), _jsx("p", { className: "text-muted", style: { fontSize: '0.75rem' }, children: "Avg Check-In" })] })] })), _jsxs("div", { className: "grid-cards", style: { gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }, children: [_jsxs("div", { className: "glass-panel", style: { padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem' }, children: [_jsx("div", { className: "stat-icon", style: { background: 'rgba(139, 92, 246, 0.1)', color: 'var(--clr-primary)', width: '40px', height: '40px' }, children: _jsx(Zap, { size: 20 }) }), _jsxs("div", { children: [_jsx("h2", { style: { fontSize: '1.1rem' }, children: "My Active Plan" }), _jsx("p", { className: "text-muted", style: { fontSize: '0.75rem' }, children: "Current Subscription" })] })] }), profile?.currentPlan ? (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '1rem' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("h3", { style: { fontSize: '1.25rem', fontWeight: 700, color: 'var(--clr-primary)' }, children: profile.currentPlan.name }), _jsx("span", { className: `status-badge ${profile.isActivePlan ? 'active' : 'pending'}`, children: profile.isActivePlan ? 'Active' : 'Pending Activation' })] }), _jsx("div", { className: "glass-panel", style: { background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px' }, children: _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }, children: [_jsxs("div", { children: [_jsx("p", { className: "text-muted", style: { fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }, children: "Duration" }), _jsx("p", { style: { fontWeight: 600, fontSize: '0.9rem' }, children: profile.currentPlan.durationType })] }), _jsxs("div", { children: [_jsx("p", { className: "text-muted", style: { fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }, children: "Price" }), _jsxs("p", { style: { fontWeight: 600, fontSize: '0.9rem' }, children: ["\u20B9", profile.currentPlan.price] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-muted", style: { fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }, children: "Start Date" }), _jsx("p", { style: { fontWeight: 600, fontSize: '0.9rem' }, children: profile.membershipStartDate ? new Date(profile.membershipStartDate).toLocaleDateString('en-IN') : 'N/A' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-muted", style: { fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }, children: "Expiry Date" }), _jsx("p", { style: { fontWeight: 600, fontSize: '0.9rem', color: daysRemaining !== null && daysRemaining <= 5 ? 'var(--clr-danger)' : 'inherit' }, children: profile.membershipExpiryDate ? new Date(profile.membershipExpiryDate).toLocaleDateString('en-IN') : 'N/A' })] })] }) }), profile.currentPlan.features?.length > 0 && (_jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }, children: profile.currentPlan.features.map((f, i) => (_jsx("span", { style: { fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.6rem', borderRadius: '20px', border: '1px solid var(--clr-glass-border)' }, children: f }, i))) }))] })) : (_jsxs("div", { style: { textAlign: 'center', padding: '1rem' }, children: [_jsx(AlertTriangle, { size: 32, style: { color: 'var(--clr-warning)', opacity: 0.5, marginBottom: '0.5rem' } }), _jsx("p", { className: "text-muted", children: "No active plan assigned." }), _jsx("p", { style: { fontSize: '0.75rem', marginTop: '0.5rem' }, children: "Please contact admin to subscribe." })] }))] }), _jsxs("div", { className: "glass-panel", style: { padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem' }, children: [_jsx("div", { className: "stat-icon", style: { background: 'rgba(6, 182, 212, 0.1)', color: 'var(--clr-secondary)', width: '40px', height: '40px' }, children: _jsx(UserSquare2, { size: 20 }) }), _jsxs("div", { children: [_jsx("h2", { style: { fontSize: '1.1rem' }, children: "My Trainer" }), _jsx("p", { className: "text-muted", style: { fontSize: '0.75rem' }, children: "Personal Coach" })] })] }), profile?.trainer ? (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '1.25rem' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem' }, children: [_jsx("div", { className: "avatar", style: { width: '50px', height: '50px', fontSize: '1.25rem' }, children: profile.trainer.name?.charAt(0) || profile.trainer.user?.name?.charAt(0) || 'T' }), _jsxs("div", { children: [_jsx("h3", { style: { fontSize: '1.1rem', fontWeight: 700 }, children: profile.trainer.name || profile.trainer.user?.name || 'Unknown Trainer' }), _jsx("p", { style: { color: 'var(--clr-secondary)', fontSize: '0.85rem', fontWeight: 500 }, children: profile.trainer.specialty || 'Personal Trainer' })] })] }), _jsxs("div", { className: "glass-panel", style: { background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.75rem' }, children: [_jsx(Mail, { size: 14, className: "text-muted" }), _jsx("span", { style: { fontSize: '0.85rem' }, children: profile.trainer.email || profile.trainer.user?.email || 'N/A' })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.75rem' }, children: [_jsx(Phone, { size: 14, className: "text-muted" }), _jsx("span", { style: { fontSize: '0.85rem' }, children: profile.trainer.phone || profile.trainer.user?.phone || 'N/A' })] })] }), _jsxs("button", { className: "btn btn-secondary w-full", style: { fontSize: '0.85rem', gap: '0.5rem' }, children: [_jsx(Mail, { size: 16 }), "Message Trainer"] })] })) : (_jsxs("div", { style: { textAlign: 'center', padding: '1.5rem' }, children: [_jsx(UserPlus, { size: 32, style: { color: 'var(--clr-secondary)', opacity: 0.5, marginBottom: '0.5rem' } }), _jsx("p", { className: "text-muted", children: "No trainer assigned yet." }), _jsx("p", { style: { fontSize: '0.75rem', marginTop: '0.5rem' }, children: "Contact admin to get a personal coach." })] }))] })] }), (isPendingPayment || (daysRemaining !== null && daysRemaining <= 5)) && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '1rem' }, children: [isPendingPayment && (_jsxs("div", { className: "glass-panel", style: { background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem' }, children: [_jsx(AlertTriangle, { style: { color: '#fbbf24' }, size: 24 }), _jsxs("div", { children: [_jsx("h4", { style: { color: '#fbbf24', fontSize: '1rem' }, children: "Payment Pending" }), _jsx("p", { className: "text-muted", style: { fontSize: '0.85rem' }, children: "Clear dues to avoid service interruption" })] })] }), _jsx("button", { className: "btn btn-warning", style: { fontSize: '0.85rem' }, children: "Pay" })] })), daysRemaining !== null && daysRemaining <= 5 && !isPendingPayment && (_jsxs("div", { className: "glass-panel", style: { background: daysRemaining <= 0 ? 'rgba(244, 63, 94, 0.1)' : 'rgba(139, 92, 246, 0.1)', border: `1px solid ${daysRemaining <= 0 ? 'rgba(244, 63, 94, 0.3)' : 'rgba(139, 92, 246, 0.3)'}`, padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem' }, children: [_jsx(Clock, { size: 24, style: { color: daysRemaining <= 0 ? 'var(--clr-danger)' : 'var(--clr-primary)' } }), _jsxs("div", { children: [_jsx("h4", { style: { color: daysRemaining <= 0 ? '#fb7185' : '#a78bfa', fontSize: '1rem' }, children: daysRemaining <= 0 ? 'Subscription Expired' : 'Expiring Soon' }), _jsxs("p", { className: "text-muted", style: { fontSize: '0.85rem' }, children: [Math.abs(daysRemaining), " days ", daysRemaining <= 0 ? 'overdue' : 'remaining'] })] })] }), _jsx("button", { className: "btn btn-primary", style: { fontSize: '0.85rem' }, children: "Renew" })] }))] })), _jsxs("div", { className: "grid-cards", style: { gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: '1.5rem' }, children: [_jsxs("div", { className: "glass-panel", style: { padding: 'var(--sp-lg)', height: 'fit-content', minHeight: '300px', background: `linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%), url('https://res.cloudinary.com/dyc33dchn/image/upload/q_auto/f_auto/v1776538385/7d99dccaaae76516dc722f79811cde9b_sr3iqo.jpg')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundBlendMode: 'overlay' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }, children: [_jsx("div", { className: "stat-icon", style: { background: 'rgba(139, 92, 246, 0.1)', color: 'var(--clr-primary)', width: '40px', height: '40px', flexShrink: 0 }, children: _jsx(Dumbbell, { size: 20 }) }), _jsx("h2", { style: { fontSize: '1.25rem' }, children: "My Workout Plan" })] }), !workout ? _jsx("p", { className: "text-muted", children: "No workout assigned yet." }) : (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '1.5rem' }, children: [_jsx("h3", { style: { marginBottom: '0.5rem', color: 'var(--clr-text-main)' }, children: workout.name }), workoutDays.map((day, i) => (_jsxs("div", { className: "glass-panel", style: { padding: '1rem', background: 'rgba(255,255,255,0.02)' }, children: [_jsx("h4", { style: { color: 'var(--clr-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--clr-glass-border)', paddingBottom: '0.5rem' }, children: day.dayName }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem' }, children: (Array.isArray(day?.exercises) ? day.exercises : []).map((ex, j) => (_jsxs("div", { style: { padding: '0.75rem', borderBottom: '1px solid var(--clr-glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }, children: [_jsxs("div", { style: { minWidth: 0 }, children: [_jsx("p", { style: { fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem', wordBreak: 'break-word' }, children: ex.name }), _jsxs("p", { className: "text-muted", style: { fontSize: '0.75rem' }, children: ["Rest: ", ex.rest] })] }), _jsx("div", { style: { textAlign: 'right', flexShrink: 0 }, children: _jsxs("p", { style: { fontWeight: 700, fontSize: '0.9rem', color: 'var(--clr-primary)' }, children: [ex.sets, " \u00D7 ", ex.reps] }) })] }, j))) })] }, i)))] }))] }), _jsxs("div", { className: "glass-panel", style: { position: 'relative', padding: 'var(--sp-lg)', height: 'fit-content', minHeight: '300px', background: `url('https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=500&h=300&fit=crop')`, backgroundSize: 'cover', backgroundPosition: 'center', color: '#fff', overflow: 'hidden' }, children: [_jsx("div", { style: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 0, borderRadius: 'inherit' } }), _jsxs("div", { style: { position: 'relative', zIndex: 1 }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }, children: [_jsx("div", { className: "stat-icon", style: { background: 'rgba(16, 185, 129, 0.2)', color: '#fff', width: '40px', height: '40px', flexShrink: 0 }, children: _jsx(Utensils, { size: 20 }) }), _jsx("h2", { style: { fontSize: '1.25rem', color: '#fff', fontWeight: 800 }, children: "My Diet Plan" })] }), !diet ? _jsx("p", { className: "text-muted", style: { color: '#e5e7eb' }, children: "No diet assigned yet." }) : (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '1.5rem' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }, children: [_jsx("h3", { style: { color: '#fff', margin: 0 }, children: diet.name }), _jsxs("span", { className: "status-badge active", style: { fontSize: '0.8rem', background: 'var(--clr-success)', color: '#fff', fontWeight: 700 }, children: [diet.calories, " kcal"] })] }), ['breakfast', 'lunch', 'dinner', 'snacks'].map((meal) => (_jsxs("div", { className: "glass-panel", style: { padding: '1.25rem', background: '#ffffff', color: '#111827', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }, children: [_jsx("h4", { style: { textTransform: 'capitalize', marginBottom: '1rem', color: '#059669', borderBottom: '2px solid #ecfdf5', paddingBottom: '0.5rem', fontWeight: 800, fontSize: '1.1rem' }, children: meal }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem' }, children: mealItems(meal).map((item, i) => (_jsxs("div", { style: { padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', gap: '1rem' }, children: [_jsx("p", { style: { fontSize: '0.95rem', wordBreak: 'break-word', color: '#374151', fontWeight: 600 }, children: item.foodName }), _jsx("p", { style: { fontSize: '0.9rem', textAlign: 'right', flexShrink: 0, color: '#6b7280', fontWeight: 500 }, children: item.quantity })] }, i))) })] }, meal)))] }))] })] })] }), _jsxs("div", { className: "glass-panel", style: { padding: 'var(--sp-lg)' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }, children: [_jsx("div", { className: "stat-icon", style: { background: 'rgba(245, 158, 11, 0.1)', color: 'var(--clr-warning)', width: '40px', height: '40px' }, children: _jsx(CreditCard, { size: 20 }) }), _jsx("h2", { style: { fontSize: '1.25rem' }, children: "Payment History" })] }), payments.length === 0 ? (_jsx("p", { className: "text-muted", children: "No payment records found." })) : (_jsx("div", { className: "table-container", style: { marginTop: 0, border: 'none', background: 'transparent' }, children: _jsxs("table", { className: "data-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Plan" }), _jsx("th", { children: "Amount" }), _jsx("th", { children: "Date" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Action" })] }) }), _jsx("tbody", { children: payments.map((pay) => (_jsxs("tr", { children: [_jsxs("td", { children: [_jsx("div", { style: { fontWeight: 600 }, children: pay.plan?.name || 'Manual Payment' }), _jsxs("div", { style: { fontSize: '0.75rem', color: 'var(--clr-text-muted)' }, children: ["INV-", pay._id.slice(-6).toUpperCase()] })] }), _jsx("td", { children: _jsxs("span", { style: { fontWeight: 700 }, children: ["\u20B9", pay.amount] }) }), _jsx("td", { children: new Date(pay.date || pay.createdAt).toLocaleDateString('en-IN') }), _jsx("td", { children: _jsx("span", { className: `status-badge ${pay.status === 'paid' ? 'active' : pay.status === 'pending' ? 'pending' : 'inactive'}`, children: pay.status }) }), _jsx("td", { children: _jsx("button", { className: "btn-icon", title: "View Invoice", children: _jsx(FileText, { size: 16 }) }) })] }, pay._id))) })] }) }))] })] })) : (_jsxs("div", { className: "glass-panel", style: { padding: 'var(--sp-lg)' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem' }, children: [_jsx("div", { className: "stat-icon", style: { background: 'rgba(6, 182, 212, 0.1)', color: 'var(--clr-secondary)', width: '40px', height: '40px' }, children: _jsx(CalendarCheck, { size: 20 }) }), _jsx("h2", { style: { fontSize: '1.25rem' }, children: "Attendance History" })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--clr-bg-base)', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--clr-glass-border)' }, children: [_jsx("input", { type: "date", value: attendanceDateFilter.start, onChange: (e) => setAttendanceDateFilter(prev => ({ ...prev, start: e.target.value })), style: { background: 'transparent', border: 'none', color: 'var(--clr-text-main)', fontSize: '0.8rem', outline: 'none', colorScheme: 'dark' } }), _jsx("span", { className: "text-muted", style: { fontSize: '0.75rem' }, children: "to" }), _jsx("input", { type: "date", value: attendanceDateFilter.end, onChange: (e) => setAttendanceDateFilter(prev => ({ ...prev, end: e.target.value })), style: { background: 'transparent', border: 'none', color: 'var(--clr-text-main)', fontSize: '0.8rem', outline: 'none', colorScheme: 'dark' } })] }), _jsxs("select", { className: "filter-select", style: { background: 'var(--clr-bg-base)', border: '1px solid var(--clr-glass-border)', color: 'var(--clr-text-main)', padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }, value: attendanceStatusFilter, onChange: (e) => setAttendanceStatusFilter(e.target.value), children: [_jsx("option", { value: "all", children: "All Status" }), _jsx("option", { value: "present", children: "In Gym" }), _jsx("option", { value: "completed", children: "Completed" }), _jsx("option", { value: "absent", children: "Absent" }), _jsx("option", { value: "late", children: "Late" }), _jsx("option", { value: "half-day", children: "Half Day" })] }), _jsxs("button", { className: "btn btn-secondary", style: { padding: '0.4rem 0.75rem', gap: '0.5rem', fontSize: '0.8rem' }, onClick: () => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'), children: [_jsx(RefreshCw, { size: 14 }), sortOrder === 'desc' ? 'Newest' : 'Oldest'] }), _jsxs("button", { className: "btn btn-primary", style: { padding: '0.4rem 0.75rem', gap: '0.5rem', fontSize: '0.8rem' }, onClick: () => handleExport('csv'), disabled: exporting, children: [_jsx(Download, { size: 14 }), exporting ? 'Exporting...' : 'Export CSV'] })] })] }), sortedAttendance.length === 0 ? (_jsxs("div", { style: { textAlign: 'center', padding: '3rem' }, children: [_jsx(CalendarCheck, { size: 48, style: { color: 'var(--clr-text-muted)', marginBottom: '1rem', opacity: 0.5 } }), _jsx("p", { className: "text-muted", children: "No attendance records found." }), _jsx("p", { style: { fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginTop: '0.5rem' }, children: "Start by checking in today!" })] })) : (_jsx("div", { className: "table-container", style: { marginTop: 0, border: 'none', background: 'transparent' }, children: _jsxs("table", { className: "data-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Date" }), _jsx("th", { children: "Check In" }), _jsx("th", { children: "Check Out" }), _jsx("th", { children: "Duration" }), _jsx("th", { children: "Status" })] }) }), _jsx("tbody", { children: sortedAttendance.map((record) => {
                                        const checkInDate = new Date(record.checkIn);
                                        const checkOutDate = record.checkOut ? new Date(record.checkOut) : null;
                                        const durationMs = checkOutDate ? checkOutDate.getTime() - checkInDate.getTime() : null;
                                        const durationStr = durationMs ? `${Math.floor(durationMs / 60000)} min` : '-';
                                        return (_jsxs("tr", { children: [_jsx("td", { style: { fontWeight: 600 }, children: new Date(record.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }), _jsx("td", { children: checkInDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }), _jsx("td", { children: checkOutDate ? checkOutDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-' }), _jsx("td", { children: durationStr }), _jsx("td", { children: getStatusBadge(record.status) })] }, record._id));
                                    }) })] }) }))] }))] }));
};
const WorkoutsPage = () => {
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
    const isTrainer = user?.role === 'trainer';
    const [activeTab, setActiveTab] = useState('workouts');
    const [workoutTemplates, setWorkoutTemplates] = useState([]);
    const [dietTemplates, setDietTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
    const [isDietModalOpen, setIsDietModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedTemplateForAssign, setSelectedTemplateForAssign] = useState(null);
    const [members, setMembers] = useState([]);
    const [memberSearch, setMemberSearch] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);
    const [workoutForm, setWorkoutForm] = useState({
        name: '',
        goal: 'General Fitness',
        difficulty: 'Beginner',
        days: [{ dayName: 'Day 1', exercises: [{ name: '', sets: 3, reps: '12', rest: '60s' }] }]
    });
    const [dietForm, setDietForm] = useState({
        name: '',
        goal: 'Maintenance',
        calories: 2000,
        meals: {
            breakfast: [{ foodName: '', quantity: '', calories: 0 }],
            lunch: [{ foodName: '', quantity: '', calories: 0 }],
            dinner: [{ foodName: '', quantity: '', calories: 0 }],
            snacks: [{ foodName: '', quantity: '', calories: 0 }]
        }
    });
    const fetchData = async () => {
        setLoading(true);
        try {
            const [wRes, dRes] = await Promise.allSettled([
                getWorkoutTemplates(),
                getDietTemplates()
            ]);
            if (wRes.status === 'fulfilled') {
                setWorkoutTemplates(wRes.value.data?.data || []);
            }
            else {
                console.error("Failed to fetch workout templates", wRes.reason);
                setWorkoutTemplates([]);
            }
            if (dRes.status === 'fulfilled') {
                setDietTemplates(dRes.value.data?.data || []);
            }
            else {
                console.error("Failed to fetch diet templates", dRes.reason);
                setDietTemplates([]);
            }
        }
        catch (error) {
            console.error("Unexpected error in fetchData", error);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (isAdmin || isTrainer) {
            fetchData();
        }
    }, [isAdmin, isTrainer]);
    useEffect(() => {
        if (isAssignModalOpen) {
            getMembers({ search: memberSearch, limit: 10 }).then(res => {
                setMembers(res.data.data.items);
            });
        }
    }, [isAssignModalOpen, memberSearch]);
    const handleCreateWorkout = async (e) => {
        e.preventDefault();
        try {
            await createWorkoutTemplate(workoutForm);
            setIsWorkoutModalOpen(false);
            setWorkoutForm({
                name: '',
                goal: 'General Fitness',
                difficulty: 'Beginner',
                days: [{ dayName: 'Day 1', exercises: [{ name: '', sets: 3, reps: '12', rest: '60s' }] }]
            });
            fetchData();
        }
        catch (error) {
            alert("Failed to create workout template");
        }
    };
    const handleCreateDiet = async (e) => {
        e.preventDefault();
        try {
            await createDietTemplate(dietForm);
            setIsDietModalOpen(false);
            setDietForm({
                name: '',
                goal: 'Maintenance',
                calories: 2000,
                meals: {
                    breakfast: [{ foodName: '', quantity: '', calories: 0 }],
                    lunch: [{ foodName: '', quantity: '', calories: 0 }],
                    dinner: [{ foodName: '', quantity: '', calories: 0 }],
                    snacks: [{ foodName: '', quantity: '', calories: 0 }]
                }
            });
            fetchData();
        }
        catch (error) {
            alert("Failed to create diet template");
        }
    };
    const handleAssign = async (memberId) => {
        if (!selectedTemplateForAssign)
            return;
        setIsAssigning(true);
        try {
            if (selectedTemplateForAssign.type === 'workout') {
                await assignWorkoutToMember({ memberId, templateId: selectedTemplateForAssign.id });
            }
            else {
                await assignDietToMember({ memberId, templateId: selectedTemplateForAssign.id });
            }
            alert("Plan assigned successfully!");
            setIsAssignModalOpen(false);
        }
        catch (error) {
            alert("Failed to assign plan");
        }
        finally {
            setIsAssigning(false);
        }
    };
    const addWorkoutDay = () => {
        setWorkoutForm({
            ...workoutForm,
            days: [...workoutForm.days, { dayName: `Day ${workoutForm.days.length + 1}`, exercises: [{ name: '', sets: 3, reps: '12', rest: '60s' }] }]
        });
    };
    const addExercise = (dayIndex) => {
        const newDays = [...workoutForm.days];
        newDays[dayIndex].exercises.push({ name: '', sets: 3, reps: '12', rest: '60s' });
        setWorkoutForm({ ...workoutForm, days: newDays });
    };
    const addMealItem = (meal) => {
        setDietForm({
            ...dietForm,
            meals: {
                ...dietForm.meals,
                [meal]: [...dietForm.meals[meal], { foodName: '', quantity: '', calories: 0 }]
            }
        });
    };
    if (!user) {
        return _jsx("div", { className: "loading-state", children: _jsx("div", { className: "spinner" }) });
    }
    if (user.role === 'member') {
        return _jsx(MemberView, {});
    }
    return (_jsxs("div", { children: [_jsx("div", { className: "page-header", style: { marginBottom: '2rem' }, children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("div", { children: [_jsx("h1", { children: "Workout & Diet Library" }), _jsx("p", { className: "text-muted", children: "Manage templates and assign plans to members." })] }), _jsx("div", { style: { display: 'flex', gap: '1rem' }, children: activeTab === 'workouts' ? ((isAdmin || isTrainer) && _jsxs("button", { className: "btn btn-primary", onClick: () => setIsWorkoutModalOpen(true), children: [_jsx(Plus, { size: 18 }), " Create Workout"] })) : ((isAdmin || isTrainer) && _jsxs("button", { className: "btn btn-primary", onClick: () => setIsDietModalOpen(true), children: [_jsx(Plus, { size: 18 }), " Create Diet"] })) })] }) }), _jsxs("div", { className: "glass-panel", style: { padding: '0.5rem', marginBottom: '2rem', display: 'inline-flex', gap: '0.5rem' }, children: [_jsxs("button", { className: `btn ${activeTab === 'workouts' ? 'btn-primary' : 'btn-secondary'}`, onClick: () => setActiveTab('workouts'), children: [_jsx(Dumbbell, { size: 18 }), " Workouts"] }), _jsxs("button", { className: `btn ${activeTab === 'diets' ? 'btn-primary' : 'btn-secondary'}`, onClick: () => setActiveTab('diets'), children: [_jsx(Utensils, { size: 18 }), " Diet Plans"] })] }), loading ? (_jsx("div", { className: "loading-state", children: _jsx("div", { className: "spinner" }) })) : (_jsx("div", { className: "grid-cards", children: activeTab === 'workouts' ? (workoutTemplates.length > 0 ? (workoutTemplates.map((t) => (_jsxs("div", { className: "glass-card", style: { padding: '1.5rem', display: 'flex', flexDirection: 'column', height: 'fit-content', minHeight: '280px' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'flex-start', gap: '1rem' }, children: [_jsx("h3", { style: { fontSize: '1.1rem', color: 'var(--clr-text-main)', wordBreak: 'break-word' }, children: t.name }), _jsx("span", { className: "status-badge active", style: { fontSize: '0.65rem', padding: '0.2rem 0.5rem', flexShrink: 0 }, children: t.difficulty })] }), _jsxs("p", { className: "text-muted", style: { fontSize: '0.8rem', marginBottom: '1rem' }, children: ["Goal: ", t.goal] }), _jsxs("div", { style: { flex: 1, marginBottom: '1.5rem' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--clr-primary)', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: '600' }, children: [_jsx(Zap, { size: 14 }), " ", t.days?.length, " Days Training"] }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '8px' }, children: t.days?.map((day, idx) => (_jsxs("div", { style: { borderLeft: '2px solid var(--clr-primary)', paddingLeft: '0.75rem' }, children: [_jsx("p", { style: { fontWeight: '700', color: 'var(--clr-text-main)', fontSize: '0.8rem', marginBottom: '0.25rem' }, children: day.dayName }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.2rem' }, children: day.exercises?.map((ex, exIdx) => (_jsxs("div", { style: { fontSize: '0.75rem', color: 'var(--clr-text-muted)', display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }, children: [_jsx("span", { style: { wordBreak: 'break-word' }, children: ex.name }), _jsxs("span", { style: { fontWeight: '600', flexShrink: 0 }, children: [ex.sets, "\u00D7", ex.reps] })] }, exIdx))) })] }, idx))) })] }), _jsxs("div", { style: { display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--clr-glass-border)' }, children: [_jsxs("button", { className: "btn btn-secondary flex-1", style: { fontSize: '0.85rem', padding: '0.5rem' }, onClick: () => {
                                        setSelectedTemplateForAssign({ id: t._id, type: 'workout', name: t.name });
                                        setIsAssignModalOpen(true);
                                    }, children: [_jsx(UserPlus, { size: 16 }), " Assign"] }), (isAdmin || isTrainer) && (_jsx("button", { className: "btn btn-icon danger", style: { width: '36px', height: '36px' }, onClick: () => deleteWorkoutPlan(t._id).then(fetchData), children: _jsx(Trash2, { size: 16 }) }))] })] }, t._id)))) : (_jsxs("div", { className: "glass-panel", style: { gridColumn: '1 / -1', padding: '3rem', textAlign: 'center' }, children: [_jsx(Dumbbell, { size: 48, className: "text-muted", style: { margin: '0 auto 1rem', opacity: 0.5 } }), _jsx("p", { className: "text-muted", children: "No workout templates found. Create your first one!" })] }))) : (dietTemplates.length > 0 ? (dietTemplates.map((t) => (_jsxs("div", { className: "glass-card", style: { padding: '1.5rem', display: 'flex', flexDirection: 'column', height: 'fit-content', minHeight: '280px' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'flex-start', gap: '1rem' }, children: [_jsx("h3", { style: { fontSize: '1.1rem', color: 'var(--clr-text-main)', wordBreak: 'break-word' }, children: t.name }), _jsx("span", { className: "status-badge active", style: { fontSize: '0.65rem', padding: '0.2rem 0.5rem', flexShrink: 0 }, children: t.goal })] }), _jsxs("p", { className: "text-muted", style: { fontSize: '0.8rem', marginBottom: '1rem' }, children: ["Target: ", t.calories, " kcal"] }), _jsxs("div", { style: { flex: 1, marginBottom: '1.5rem' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--clr-success)', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: '600' }, children: [_jsx(Utensils, { size: 14 }), " Meal Breakdown"] }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '8px' }, children: ['breakfast', 'lunch', 'dinner', 'snacks'].map((meal) => (t.meals?.[meal]?.length > 0 && (_jsxs("div", { style: { borderLeft: '2px solid var(--clr-success)', paddingLeft: '0.75rem' }, children: [_jsx("p", { style: { fontWeight: '700', color: 'var(--clr-text-main)', fontSize: '0.8rem', marginBottom: '0.25rem', textTransform: 'capitalize' }, children: meal }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.2rem' }, children: t.meals[meal].map((item, itemIdx) => (_jsxs("div", { style: { fontSize: '0.75rem', color: 'var(--clr-text-muted)', display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }, children: [_jsx("span", { style: { wordBreak: 'break-word' }, children: item.foodName }), _jsx("span", { style: { flexShrink: 0 }, children: item.quantity })] }, itemIdx))) })] }, meal)))) })] }), _jsxs("div", { style: { display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--clr-glass-border)' }, children: [_jsxs("button", { className: "btn btn-secondary flex-1", style: { fontSize: '0.85rem', padding: '0.5rem' }, onClick: () => {
                                        setSelectedTemplateForAssign({ id: t._id, type: 'diet', name: t.name });
                                        setIsAssignModalOpen(true);
                                    }, children: [_jsx(UserPlus, { size: 16 }), " Assign"] }), (isAdmin || isTrainer) && (_jsx("button", { className: "btn btn-icon danger", style: { width: '36px', height: '36px' }, onClick: () => deleteDietPlan(t._id).then(fetchData), children: _jsx(Trash2, { size: 16 }) }))] })] }, t._id)))) : (_jsxs("div", { className: "glass-panel", style: { gridColumn: '1 / -1', padding: '3rem', textAlign: 'center' }, children: [_jsx(Utensils, { size: 48, className: "text-muted", style: { margin: '0 auto 1rem', opacity: 0.5 } }), _jsx("p", { className: "text-muted", children: "No diet plans found. Create your first one!" })] }))) })), _jsx(Modal, { isOpen: isWorkoutModalOpen, onClose: () => setIsWorkoutModalOpen(false), title: "Create Workout Template", children: _jsxs("form", { onSubmit: handleCreateWorkout, style: { display: 'flex', flexDirection: 'column', height: '100%' }, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Plan Name" }), _jsx("input", { className: "form-input", required: true, value: workoutForm.name, onChange: e => setWorkoutForm({ ...workoutForm, name: e.target.value }), placeholder: "e.g. 5-Day Muscle Builder" })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1rem' }, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Goal" }), _jsxs("select", { className: "form-input", value: workoutForm.goal, onChange: e => setWorkoutForm({ ...workoutForm, goal: e.target.value }), children: [_jsx("option", { children: "Fat Loss" }), _jsx("option", { children: "Muscle Gain" }), _jsx("option", { children: "Strength" }), _jsx("option", { children: "General Fitness" })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Difficulty" }), _jsxs("select", { className: "form-input", value: workoutForm.difficulty, onChange: e => setWorkoutForm({ ...workoutForm, difficulty: e.target.value }), children: [_jsx("option", { children: "Beginner" }), _jsx("option", { children: "Intermediate" }), _jsx("option", { children: "Advanced" })] })] })] }), _jsx("div", { style: { paddingRight: '0.5rem' }, children: workoutForm.days.map((day, dIdx) => (_jsxs("div", { className: "glass-panel", style: { padding: '1rem', marginBottom: '1rem' }, children: [_jsx("input", { className: "form-input", style: { fontWeight: 700, marginBottom: '1rem', background: 'transparent', border: 'none', borderBottom: '1px solid var(--clr-glass-border)', borderRadius: 0 }, value: day.dayName, onChange: e => {
                                                    const newDays = [...workoutForm.days];
                                                    newDays[dIdx].dayName = e.target.value;
                                                    setWorkoutForm({ ...workoutForm, days: newDays });
                                                } }), day.exercises.map((ex, eIdx) => (_jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px dashed var(--clr-glass-border)', paddingBottom: '0.5rem' }, children: [_jsx("div", { className: "col-span-full md:col-span-2", children: _jsx("input", { className: "form-input", placeholder: "Exercise", value: ex.name, onChange: e => {
                                                                const newDays = [...workoutForm.days];
                                                                newDays[dIdx].exercises[eIdx].name = e.target.value;
                                                                setWorkoutForm({ ...workoutForm, days: newDays });
                                                            } }) }), _jsx("input", { className: "form-input", placeholder: "Sets", type: "number", value: ex.sets, onChange: e => {
                                                            const newDays = [...workoutForm.days];
                                                            newDays[dIdx].exercises[eIdx].sets = Number(e.target.value);
                                                            setWorkoutForm({ ...workoutForm, days: newDays });
                                                        } }), _jsx("input", { className: "form-input", placeholder: "Reps", value: ex.reps, onChange: e => {
                                                            const newDays = [...workoutForm.days];
                                                            newDays[dIdx].exercises[eIdx].reps = e.target.value;
                                                            setWorkoutForm({ ...workoutForm, days: newDays });
                                                        } }), _jsx("input", { className: "form-input", placeholder: "Rest", value: ex.rest, onChange: e => {
                                                            const newDays = [...workoutForm.days];
                                                            newDays[dIdx].exercises[eIdx].rest = e.target.value;
                                                            setWorkoutForm({ ...workoutForm, days: newDays });
                                                        } })] }, eIdx))), _jsx("button", { type: "button", className: "btn btn-secondary w-full", style: { fontSize: '0.8rem', padding: '0.4rem' }, onClick: () => addExercise(dIdx), children: "+ Add Exercise" })] }, dIdx))) }), _jsx("button", { type: "button", className: "btn btn-secondary w-full mb-4", onClick: addWorkoutDay, children: "+ Add Day" })] }), _jsx("div", { style: { marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--clr-glass-border)', position: 'sticky', bottom: 0, background: 'var(--clr-bg-sidebar)', zIndex: 10 }, children: _jsx("button", { className: "btn btn-primary w-full", type: "submit", children: "Save Template" }) })] }) }), _jsx(Modal, { isOpen: isDietModalOpen, onClose: () => setIsDietModalOpen(false), title: "Create Diet Template", children: _jsxs("form", { onSubmit: handleCreateDiet, style: { display: 'flex', flexDirection: 'column', height: '100%' }, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Plan Name" }), _jsx("input", { className: "form-input", required: true, value: dietForm.name, onChange: e => setDietForm({ ...dietForm, name: e.target.value }), placeholder: "e.g. High Protein Cutting" })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1rem' }, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Goal" }), _jsxs("select", { className: "form-input", value: dietForm.goal, onChange: e => setDietForm({ ...dietForm, goal: e.target.value }), children: [_jsx("option", { children: "Weight Loss" }), _jsx("option", { children: "Muscle Gain" }), _jsx("option", { children: "Maintenance" })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Calories" }), _jsx("input", { className: "form-input", type: "number", value: dietForm.calories, onChange: e => setDietForm({ ...dietForm, calories: Number(e.target.value) }) })] })] }), _jsx("div", { style: { paddingRight: '0.5rem' }, children: ['breakfast', 'lunch', 'dinner', 'snacks'].map((meal) => (_jsxs("div", { className: "glass-panel", style: { padding: '1rem', marginBottom: '1rem' }, children: [_jsx("h4", { style: { textTransform: 'capitalize', marginBottom: '1rem' }, children: meal }), dietForm.meals[meal].map((item, idx) => (_jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px dashed var(--clr-glass-border)', paddingBottom: '0.5rem' }, children: [_jsx("div", { className: "col-span-full md:col-span-2", children: _jsx("input", { className: "form-input", placeholder: "Food Name", value: item.foodName, onChange: e => {
                                                                const newMeals = { ...dietForm.meals };
                                                                newMeals[meal][idx].foodName = e.target.value;
                                                                setDietForm({ ...dietForm, meals: newMeals });
                                                            } }) }), _jsx("input", { className: "form-input", placeholder: "Qty", value: item.quantity, onChange: e => {
                                                            const newMeals = { ...dietForm.meals };
                                                            newMeals[meal][idx].quantity = e.target.value;
                                                            setDietForm({ ...dietForm, meals: newMeals });
                                                        } }), _jsx("input", { className: "form-input", placeholder: "Kcal", type: "number", value: item.calories, onChange: e => {
                                                            const newMeals = { ...dietForm.meals };
                                                            newMeals[meal][idx].calories = Number(e.target.value);
                                                            setDietForm({ ...dietForm, meals: newMeals });
                                                        } })] }, idx))), _jsx("button", { type: "button", className: "btn btn-secondary w-full", style: { fontSize: '0.8rem', padding: '0.4rem' }, onClick: () => addMealItem(meal), children: "+ Add Item" })] }, meal))) })] }), _jsx("div", { style: { marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--clr-glass-border)', position: 'sticky', bottom: 0, background: 'var(--clr-bg-sidebar)', zIndex: 10 }, children: _jsx("button", { className: "btn btn-primary w-full", type: "submit", children: "Save Template" }) })] }) }), _jsxs(Modal, { isOpen: isAssignModalOpen, onClose: () => setIsAssignModalOpen(false), title: `Assign ${selectedTemplateForAssign?.name}`, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Search Member" }), _jsxs("div", { className: "search-bar", children: [_jsx(Search, { size: 18 }), _jsx("input", { placeholder: "Member name or email...", value: memberSearch, onChange: e => setMemberSearch(e.target.value) })] })] }), _jsx("div", { style: { maxHeight: '300px', overflowY: 'auto', marginTop: '1rem' }, children: members.map(m => (_jsxs("div", { className: "glass-panel", style: { padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', cursor: 'pointer' }, onClick: () => handleAssign(m._id), children: [_jsxs("div", { children: [_jsx("p", { style: { fontWeight: 600 }, children: m.user?.name }), _jsx("p", { className: "text-muted", style: { fontSize: '0.8rem' }, children: m.user?.email })] }), _jsx("button", { className: "btn-icon", style: { background: 'var(--clr-primary)', color: 'white' }, disabled: isAssigning, children: _jsx(Plus, { size: 16 }) })] }, m._id))) })] })] }));
};
export default WorkoutsPage;
