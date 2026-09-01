import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { getDashboardStats } from "../features/dashboard/dashboard.api";
import { Users, IndianRupee, UserSquare2, CalendarCheck, TrendingUp, ArrowUpRight, Building2, ClipboardList, Loader2, AlertTriangle, } from "lucide-react";
import { useAuthStore } from "../store/auth.store";
import { useBranchStore } from "../store/branch.store";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
export default function DashboardPage() {
    const { user } = useAuthStore();
    const { branches, selectedBranch, setSelectedBranch, fetchBranches } = useBranchStore();
    const [stats, setStats] = useState({
        totalMembers: 0,
        activePlans: 0,
        revenue: 0,
        activeTrainers: 0,
        attendanceToday: 0,
        revenueAnalytics: [],
        recentActivities: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const isSuperAdmin = user?.role === "superadmin";
    const isAdmin = user?.role === "admin";
    const isTrainer = user?.role === "trainer";
    const loadStats = () => {
        if (!isAdmin && !isTrainer && !isSuperAdmin)
            return;
        setLoading(true);
        setError(null);
        const params = isSuperAdmin && selectedBranch !== "ALL"
            ? { branchCode: selectedBranch }
            : undefined;
        getDashboardStats(params)
            .then((res) => {
            if (res.data?.data) {
                setStats(res.data.data);
            }
        })
            .catch((err) => {
            const msg = err?.response?.data?.message ||
                "Failed to load dashboard data. Please try again.";
            setError(msg);
            toast.error(msg);
        })
            .finally(() => setLoading(false));
    };
    useEffect(() => {
        loadStats();
        if (branches.length === 0) {
            fetchBranches();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, selectedBranch]);
    const maxRevenue = Math.max(...(stats.revenueAnalytics?.map((d) => d.total) || [100]), 100);
    const currentBranchName = (() => {
        if (isSuperAdmin) {
            if (selectedBranch === "ALL")
                return "All Branches";
            return (branches.find((b) => b.branchCode === selectedBranch)?.name ||
                selectedBranch);
        }
        if (isAdmin || isTrainer) {
            return (branches.find((b) => b.branchCode === user?.branchCode)?.name ||
                user?.branchCode ||
                "Main Branch");
        }
        return user?.branchCode || "Main Branch";
    })();
    if (loading) {
        return (_jsxs("div", { style: {
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "40vh",
                gap: "1rem",
                color: "var(--clr-text-muted)",
            }, children: [_jsx(Loader2, { size: 36, className: "spin", style: { color: "var(--clr-primary)" } }), _jsx("p", { children: "Loading dashboard..." })] }));
    }
    if (error) {
        return (_jsxs("div", { style: {
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "40vh",
                gap: "1rem",
            }, children: [_jsx(AlertTriangle, { size: 36, style: { color: "var(--clr-danger)" } }), _jsx("p", { style: { color: "var(--clr-danger)", fontWeight: 600 }, children: error }), _jsxs("button", { className: "btn btn-primary", onClick: loadStats, children: [_jsx(ArrowUpRight, { size: 18 }), "Retry"] })] }));
    }
    return (_jsxs("div", { children: [_jsx("div", { className: "page-header", style: { marginBottom: "2rem" }, children: _jsxs("div", { className: "flex-responsive", style: {
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "1.5rem",
                        flexWrap: "wrap",
                    }, children: [_jsxs("div", { children: [_jsx("h1", { children: "Dashboard Overview" }), _jsxs("p", { className: "text-muted", children: ["Welcome back! Showing data for", " ", _jsx("strong", { style: { color: "var(--clr-primary)" }, children: currentBranchName }), "."] })] }), _jsxs("div", { style: {
                                display: "flex",
                                alignItems: "center",
                                gap: "0.75rem",
                            }, children: [isSuperAdmin && (_jsxs("div", { style: {
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                        background: "var(--bg-glass-card, rgba(255,255,255,0.06))",
                                        padding: "0.4rem 0.85rem",
                                        borderRadius: "8px",
                                        border: "1px solid var(--border-glass, rgba(255,255,255,0.1))",
                                    }, children: [_jsx(Building2, { size: 16, style: { color: "var(--clr-primary)" } }), _jsxs("select", { className: "filter-select", value: selectedBranch, onChange: (e) => setSelectedBranch(e.target.value), style: {
                                                background: "transparent",
                                                border: "none",
                                                color: "inherit",
                                                fontWeight: 600,
                                                outline: "none",
                                                cursor: "pointer",
                                            }, children: [_jsx("option", { value: "ALL", style: { background: "#1e1b4b", color: "#fff" }, children: "All Branches" }), branches.map((b) => (_jsxs("option", { value: b.branchCode, style: { background: "#1e1b4b", color: "#fff" }, children: [b.name, " (", b.branchCode, ")"] }, b._id)))] })] })), (isAdmin || isTrainer) && (_jsxs("div", { style: {
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                        background: "var(--bg-glass-card, rgba(255,255,255,0.06))",
                                        padding: "0.4rem 0.85rem",
                                        borderRadius: "8px",
                                        border: "1px solid var(--border-glass, rgba(255,255,255,0.1))",
                                    }, children: [_jsx(Building2, { size: 16, style: { color: "var(--clr-primary)" } }), _jsxs("span", { style: { fontWeight: 600, fontSize: "0.85rem" }, children: [currentBranchName, " (", user?.branchCode, ")"] })] })), _jsxs("button", { className: "btn btn-primary", onClick: loadStats, children: [_jsx(ArrowUpRight, { size: 18 }), "Refresh"] })] })] }) }), _jsxs("div", { className: "grid-stats", style: { marginBottom: "2rem" }, children: [_jsxs("div", { className: "stat-card", style: { position: "relative", overflow: "hidden" }, children: [_jsx("div", { style: {
                                    position: "absolute",
                                    inset: 0,
                                    background: "linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)",
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    opacity: 0.3,
                                } }), _jsxs("div", { style: { position: "relative", zIndex: 2 }, children: [_jsxs("div", { className: "stat-info", children: [_jsx("h3", { children: "Total Members" }), _jsx("p", { className: "stat-value", children: stats.totalMembers }), _jsx("p", { className: "text-muted", style: { fontSize: "0.8rem" }, children: "Registered members" })] }), _jsx("div", { className: "stat-icon", style: {
                                            background: "rgba(139, 92, 246, 0.1)",
                                            color: "var(--clr-primary)",
                                        }, children: _jsx(Users, { size: 24 }) })] })] }), _jsxs("div", { className: "stat-card", style: { position: "relative", overflow: "hidden" }, children: [_jsx("div", { style: {
                                    position: "absolute",
                                    inset: 0,
                                    background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)",
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    opacity: 0.3,
                                } }), _jsxs("div", { style: { position: "relative", zIndex: 2 }, children: [_jsxs("div", { className: "stat-info", children: [_jsx("h3", { children: "Active Plans" }), _jsx("p", { className: "stat-value", children: stats.activePlans }), _jsx("p", { className: "text-muted", style: { fontSize: "0.8rem" }, children: "Members with active plans" })] }), _jsx("div", { className: "stat-icon", style: {
                                            background: "rgba(99, 102, 241, 0.1)",
                                            color: "#6366f1",
                                        }, children: _jsx(ClipboardList, { size: 24 }) })] })] }), !isTrainer && (_jsxs("div", { className: "stat-card", style: { position: "relative", overflow: "hidden" }, children: [_jsx("div", { style: {
                                    position: "absolute",
                                    inset: 0,
                                    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(34, 197, 94, 0.08) 100%)",
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    opacity: 0.3,
                                } }), _jsxs("div", { style: { position: "relative", zIndex: 2 }, children: [_jsxs("div", { className: "stat-info", children: [_jsx("h3", { children: "Monthly Revenue" }), _jsxs("p", { className: "stat-value", children: ["\u20B9", (stats.revenue || 0).toLocaleString("en-IN")] }), _jsxs("p", { className: "stat-trend trend-up", children: [_jsx(TrendingUp, { size: 14 }), isSuperAdmin && selectedBranch === "ALL"
                                                        ? "All Branches Total"
                                                        : "Branch Total"] })] }), _jsx("div", { className: "stat-icon", style: {
                                            background: "rgba(16, 185, 129, 0.1)",
                                            color: "var(--clr-success)",
                                        }, children: _jsx(IndianRupee, { size: 24 }) })] })] })), _jsxs("div", { className: "stat-card", style: { position: "relative", overflow: "hidden" }, children: [_jsx("div", { style: {
                                    position: "absolute",
                                    inset: 0,
                                    background: "linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)",
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    opacity: 0.3,
                                } }), _jsxs("div", { style: { position: "relative", zIndex: 2 }, children: [_jsxs("div", { className: "stat-info", children: [_jsx("h3", { children: "Active Trainers" }), _jsx("p", { className: "stat-value", children: stats.activeTrainers }), _jsx("p", { className: "text-muted", style: { fontSize: "0.8rem" }, children: "On system" })] }), _jsx("div", { className: "stat-icon", style: {
                                            background: "rgba(6, 182, 212, 0.1)",
                                            color: "var(--clr-secondary)",
                                        }, children: _jsx(UserSquare2, { size: 24 }) })] })] }), _jsxs("div", { className: "stat-card", style: { position: "relative", overflow: "hidden" }, children: [_jsx("div", { style: {
                                    position: "absolute",
                                    inset: 0,
                                    background: "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(234, 179, 8, 0.08) 100%)",
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    opacity: 0.3,
                                } }), _jsxs("div", { style: { position: "relative", zIndex: 2 }, children: [_jsxs("div", { className: "stat-info", children: [_jsx("h3", { children: "Attendance Today" }), _jsx("p", { className: "stat-value", children: stats.attendanceToday }), _jsx("p", { className: "text-muted", style: { fontSize: "0.8rem" }, children: "Check-ins today" })] }), _jsx("div", { className: "stat-icon", style: {
                                            background: "rgba(245, 158, 11, 0.1)",
                                            color: "var(--clr-warning)",
                                        }, children: _jsx(CalendarCheck, { size: 24 }) })] })] })] }), _jsxs("div", { className: "dashboard-grid", children: [!isTrainer && (_jsxs("div", { className: "glass-panel", style: { padding: "1.5rem", minHeight: "350px" }, children: [_jsx("div", { style: {
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "1.5rem",
                                }, children: _jsx("h3", { style: { fontSize: "1.1rem" }, children: "Revenue Analytics (Last 7 Days)" }) }), _jsx("div", { style: {
                                    height: "250px",
                                    display: "flex",
                                    alignItems: "flex-end",
                                    gap: "1rem",
                                    paddingBottom: "1rem",
                                }, children: stats.revenueAnalytics?.length > 0 ? (stats.revenueAnalytics.map((day, i) => (_jsx("div", { style: {
                                        flex: 1,
                                        height: `${Math.max(5, (day.total / maxRevenue) * 100)}%`,
                                        background: "var(--clr-primary)",
                                        borderRadius: "8px 8px 0 0",
                                        opacity: 0.8,
                                        position: "relative",
                                    }, title: `${day._id}: ₹${day.total}`, children: _jsx("span", { style: {
                                            position: "absolute",
                                            bottom: "-25px",
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                            fontSize: "0.65rem",
                                            color: "var(--clr-text-muted)",
                                            whiteSpace: "nowrap",
                                        }, children: day._id?.split("-").slice(1).join("/") || "Unknown" }) }, i)))) : (_jsx("div", { style: {
                                        flex: 1,
                                        textAlign: "center",
                                        color: "var(--clr-text-muted)",
                                    }, children: "No revenue recorded for the last 7 days" })) })] })), _jsxs("div", { className: "glass-panel", style: { padding: "1.5rem" }, children: [_jsx("h3", { style: { fontSize: "1.1rem", marginBottom: "1.5rem" }, children: "Recent Activities" }), _jsx("div", { style: {
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "1.5rem",
                                }, children: stats.recentActivities?.length > 0 ? (stats.recentActivities.map((activity, i) => (_jsxs("div", { style: { display: "flex", gap: "1rem" }, children: [_jsx("div", { style: {
                                                width: "10px",
                                                height: "10px",
                                                borderRadius: "50%",
                                                background: activity.color,
                                                marginTop: "0.4rem",
                                                flexShrink: 0,
                                            } }), _jsxs("div", { children: [_jsx("p", { style: {
                                                        fontSize: "0.9rem",
                                                        fontWeight: "500",
                                                    }, children: activity.text }), _jsx("p", { style: {
                                                        fontSize: "0.75rem",
                                                        color: "var(--clr-text-muted)",
                                                    }, children: formatDistanceToNow(new Date(activity.time), {
                                                        addSuffix: true,
                                                    }) })] })] }, i)))) : (_jsx("p", { className: "text-muted", style: { fontSize: "0.9rem" }, children: "No recent activity found." })) })] })] })] }));
}
