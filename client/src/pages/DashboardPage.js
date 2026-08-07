import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { getDashboardStats } from "../features/dashboard/dashboard.api";
import { Users, IndianRupee, UserSquare2, CalendarCheck, TrendingUp, ArrowUpRight } from "lucide-react";
import { useAuthStore } from "../store/auth.store";
import { formatDistanceToNow } from "date-fns";
export default function DashboardPage() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState({
        totalMembers: 0,
        activePlans: 0,
        revenue: 0,
        activeTrainers: 0,
        attendanceToday: 0,
        revenueAnalytics: [],
        recentActivities: []
    });
    useEffect(() => {
        if (user?.role === "admin" || user?.role === "trainer" || user?.role === "superadmin") {
            getDashboardStats()
                .then((res) => {
                if (res.data?.data) {
                    setStats(res.data.data);
                }
            })
                .catch(() => null);
        }
    }, [user]);
    const maxRevenue = Math.max(...(stats.revenueAnalytics?.map((d) => d.total) || [100]), 100);
    return (_jsxs("div", { children: [_jsx("div", { className: "page-header", style: { marginBottom: '2rem' }, children: _jsxs("div", { className: "flex-responsive", style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }, children: [_jsxs("div", { children: [_jsx("h1", { children: "Dashboard Overview" }), _jsx("p", { className: "text-muted", children: "Welcome back! Here's what's happening today." })] }), _jsxs("button", { className: "btn btn-primary", children: [_jsx(ArrowUpRight, { size: 18 }), "Export"] })] }) }), _jsxs("div", { className: "grid-stats", style: { marginBottom: '2rem' }, children: [_jsxs("div", { className: "stat-card", style: { position: 'relative', overflow: 'hidden' }, children: [_jsx("div", { style: {
                                    position: 'absolute',
                                    inset: 0,
                                    background: `linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%), url('https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop')`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    opacity: 0.3
                                } }), _jsxs("div", { style: { position: 'relative', zIndex: 2 }, children: [_jsxs("div", { className: "stat-info", children: [_jsx("h3", { children: "Total Members" }), _jsx("p", { className: "stat-value", children: stats.totalMembers }), _jsxs("p", { className: "stat-trend trend-up", children: [_jsx(TrendingUp, { size: 14 }), stats.activePlans, " Active Plans"] })] }), _jsx("div", { className: "stat-icon", style: { background: 'rgba(139, 92, 246, 0.1)', color: 'var(--clr-primary)' }, children: _jsx(Users, { size: 24 }) })] })] }), _jsxs("div", { className: "stat-card", style: { position: 'relative', overflow: 'hidden' }, children: [_jsx("div", { style: {
                                    position: 'absolute',
                                    inset: 0,
                                    background: `linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(34, 197, 94, 0.08) 100%), url('https://images.unsplash.com/photo-1533827432537-70133479f06e?w=600&h=400&fit=crop')`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    opacity: 0.3
                                } }), _jsxs("div", { style: { position: 'relative', zIndex: 2 }, children: [_jsxs("div", { className: "stat-info", children: [_jsx("h3", { children: "Monthly Revenue" }), _jsxs("p", { className: "stat-value", children: ["\u20B9", (stats.revenue || 0).toLocaleString()] }), _jsxs("p", { className: "stat-trend trend-up", children: [_jsx(TrendingUp, { size: 14 }), "Overall Total"] })] }), _jsx("div", { className: "stat-icon", style: { background: 'rgba(16, 185, 129, 0.1)', color: 'var(--clr-success)' }, children: _jsx(IndianRupee, { size: 24 }) })] })] }), _jsxs("div", { className: "stat-card", style: { position: 'relative', overflow: 'hidden' }, children: [_jsx("div", { style: {
                                    position: 'absolute',
                                    inset: 0,
                                    background: `linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%), url('https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=400&fit=crop')`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    opacity: 0.3
                                } }), _jsxs("div", { style: { position: 'relative', zIndex: 2 }, children: [_jsxs("div", { className: "stat-info", children: [_jsx("h3", { children: "Active Trainers" }), _jsx("p", { className: "stat-value", children: stats.activeTrainers }), _jsx("p", { className: "text-muted", style: { fontSize: '0.8rem' }, children: "On system" })] }), _jsx("div", { className: "stat-icon", style: { background: 'rgba(6, 182, 212, 0.1)', color: 'var(--clr-secondary)' }, children: _jsx(UserSquare2, { size: 24 }) })] })] }), _jsxs("div", { className: "stat-card", style: { position: 'relative', overflow: 'hidden' }, children: [_jsx("div", { style: {
                                    position: 'absolute',
                                    inset: 0,
                                    background: `linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(234, 179, 8, 0.08) 100%), url('https://images.unsplash.com/photo-1517836357463-d25ddfcbf042?w=600&h=400&fit=crop')`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    opacity: 0.3
                                } }), _jsxs("div", { style: { position: 'relative', zIndex: 2 }, children: [_jsxs("div", { className: "stat-info", children: [_jsx("h3", { children: "Attendance Today" }), _jsx("p", { className: "stat-value", children: stats.attendanceToday }), _jsx("p", { className: "text-muted", style: { fontSize: '0.8rem' }, children: "Check-ins today" })] }), _jsx("div", { className: "stat-icon", style: { background: 'rgba(245, 158, 11, 0.1)', color: 'var(--clr-warning)' }, children: _jsx(CalendarCheck, { size: 24 }) })] })] })] }), _jsxs("div", { className: "dashboard-grid", children: [_jsxs("div", { className: "glass-panel", style: { padding: '1.5rem', minHeight: '350px' }, children: [_jsx("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }, children: _jsx("h3", { style: { fontSize: '1.1rem' }, children: "Revenue Analytics (Last 7 Days)" }) }), _jsx("div", { style: { height: '250px', display: 'flex', alignItems: 'flex-end', gap: '1rem', paddingBottom: '1rem' }, children: stats.revenueAnalytics?.length > 0 ? (stats.revenueAnalytics.map((day, i) => (_jsx("div", { style: {
                                        flex: 1,
                                        height: `${(day.total / maxRevenue) * 100}%`,
                                        background: 'var(--clr-primary)',
                                        borderRadius: '8px 8px 0 0',
                                        opacity: 0.8,
                                        position: 'relative'
                                    }, title: `${day._id}: ₹${day.total}`, children: _jsx("span", { style: {
                                            position: 'absolute',
                                            bottom: '-25px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            fontSize: '0.65rem',
                                            color: 'var(--clr-text-muted)',
                                            whiteSpace: 'nowrap'
                                        }, children: day._id?.split('-').slice(1).join('/') || 'Unknown' }) }, i)))) : (_jsx("div", { style: { flex: 1, textAlign: 'center', color: 'var(--clr-text-muted)' }, children: "No data for the last 7 days" })) })] }), _jsxs("div", { className: "glass-panel", style: { padding: '1.5rem' }, children: [_jsx("h3", { style: { fontSize: '1.1rem', marginBottom: '1.5rem' }, children: "Recent Activities" }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '1.5rem' }, children: stats.recentActivities?.length > 0 ? (stats.recentActivities.map((activity, i) => (_jsxs("div", { style: { display: 'flex', gap: '1rem' }, children: [_jsx("div", { style: { width: '10px', height: '10px', borderRadius: '50%', background: activity.color, marginTop: '0.4rem' } }), _jsxs("div", { children: [_jsx("p", { style: { fontSize: '0.9rem', fontWeight: '500' }, children: activity.text }), _jsx("p", { style: { fontSize: '0.75rem', color: 'var(--clr-text-muted)' }, children: formatDistanceToNow(new Date(activity.time), { addSuffix: true }) })] })] }, i)))) : (_jsx("p", { className: "text-muted", style: { fontSize: '0.9rem' }, children: "No recent activity found." })) })] })] })] }));
}
