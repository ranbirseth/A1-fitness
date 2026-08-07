import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from "react";
import { Clock, CheckCircle2, XCircle, Download, FileText, MapPin, LogIn, LogOut, ChevronLeft, ChevronRight, Search, Filter, RefreshCw, TrendingUp, Flame, Award, BarChart3, Zap, AlertTriangle, } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, addMonths, eachDayOfInterval, parseISO, isSameDay } from "date-fns";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { memberCheckIn, memberCheckOut, getMyAttendance, getMyAttendanceStats, getRealTimeStatus, exportMyAttendance, } from "../features/attendance/attendance.api";
import { getMyProfile } from "../features/members/members.api";
import { useAuthStore } from "../store/auth.store";
import { useDebounce } from "../hooks/useDebounce";
const STATUS_COLORS = {
    present: "var(--clr-success)",
    completed: "var(--clr-success)",
    late: "var(--clr-warning)",
    "half-day": "var(--clr-purple)",
    absent: "var(--clr-danger)",
};
const STATUS_LABELS = {
    present: "Present",
    completed: "Completed",
    late: "Late",
    "half-day": "Half Day",
    absent: "Absent",
};
const MemberAttendancePage = () => {
    const { user, gymId } = useAuthStore();
    const [socket, setSocket] = useState(null);
    const [todayStatus, setTodayStatus] = useState(null);
    const [stats, setStats] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [checkingIn, setCheckingIn] = useState(false);
    const [checkingOut, setCheckingOut] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [limit] = useState(10);
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showFilters, setShowFilters] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportRange, setExportRange] = useState({ start: "", end: "" });
    const [location, setLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [profile, setProfile] = useState(null);
    const debouncedSearch = useDebounce(searchQuery, 500);
    const fetchProfile = useCallback(async () => {
        try {
            const res = await getMyProfile();
            if (res.data?.data) {
                setProfile(res.data.data);
                console.log("Fetched profile data:", res.data.data); // Add this line
            }
        }
        catch (error) {
            console.error("Failed to fetch profile", error);
        }
    }, []);
    const fetchTodayStatus = useCallback(async () => {
        try {
            const res = await getRealTimeStatus();
            if (res.data?.data) {
                setTodayStatus(res.data.data);
            }
        }
        catch (error) {
            console.error("Failed to fetch today's status", error);
        }
    }, []);
    const fetchStats = useCallback(async (date = selectedMonth) => {
        try {
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            const res = await getMyAttendanceStats({ month, year });
            if (res.data?.data) {
                setStats(res.data.data);
            }
        }
        catch (error) {
            console.error("Failed to fetch stats", error);
        }
    }, [selectedMonth]);
    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit,
            };
            if (debouncedSearch)
                params.search = debouncedSearch;
            if (startDate)
                params.startDate = startDate;
            if (endDate)
                params.endDate = endDate;
            if (statusFilter !== "all")
                params.status = statusFilter;
            const res = await getMyAttendance(params);
            if (res.data?.data) {
                setRecords(res.data.data.items || []);
                setTotalRecords(res.data.data.total || 0);
            }
        }
        catch (error) {
            console.error("Failed to fetch history", error);
            toast.error("Failed to load attendance history");
        }
        finally {
            setLoading(false);
        }
    }, [currentPage, limit, debouncedSearch, startDate, endDate, statusFilter]);
    const getLocation = () => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                setLocationError("Geolocation not supported by your browser");
                resolve(null);
                return;
            }
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude, accuracy } = position.coords;
                setLocation({ latitude, longitude, accuracy });
                setLocationError(null);
                resolve({ latitude, longitude, accuracy });
            }, (error) => {
                let errorMsg = "Unable to get location";
                if (error.code === error.PERMISSION_DENIED) {
                    errorMsg = "Location permission denied. Please enable location access.";
                }
                else if (error.code === error.POSITION_UNAVAILABLE) {
                    errorMsg = "Location information unavailable";
                }
                else if (error.code === error.TIMEOUT) {
                    errorMsg = "Location request timed out";
                }
                setLocationError(errorMsg);
                resolve(null);
            }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
        });
    };
    const handleCheckIn = async () => {
        setCheckingIn(true);
        try {
            const geoLocation = await getLocation();
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            console.log("Attempting check-in with location:", geoLocation);
            await memberCheckIn({
                location: geoLocation || undefined,
                timezone,
            });
            toast.success("Checked in successfully!");
            fetchTodayStatus();
            fetchStats();
            fetchHistory();
        }
        catch (error) {
            console.error("Check-in error:", error.response?.data);
            const message = error.response?.data?.message || "Check-in failed";
            toast.error(message);
        }
        finally {
            setCheckingIn(false);
        }
    };
    const handleCheckOut = async () => {
        setCheckingOut(true);
        try {
            const geoLocation = await getLocation();
            await memberCheckOut({
                location: geoLocation || undefined,
            });
            toast.success("Checked out successfully!");
            fetchTodayStatus();
            fetchStats();
            fetchHistory();
        }
        catch (error) {
            console.error("Check-out error:", error.response?.data);
            const message = error.response?.data?.message || "Check-out failed";
            toast.error(message);
        }
        finally {
            setCheckingOut(false);
        }
    };
    const handleExport = async (format) => {
        try {
            const response = await exportMyAttendance(format, exportRange.start || undefined, exportRange.end || undefined);
            const blob = new Blob([response.data], {
                type: format === "csv" ? "text/csv" : "text/html",
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `attendance_${user?.name || "member"}_${format}_${new Date().toISOString().split("T")[0]}.${format === "csv" ? "csv" : "html"}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success(`Exported successfully as ${format.toUpperCase()}`);
            setShowExportModal(false);
        }
        catch (error) {
            toast.error("Export failed");
        }
    };
    useEffect(() => {
        fetchTodayStatus();
        fetchStats();
        fetchHistory();
        fetchProfile();
    }, [fetchTodayStatus, fetchStats, fetchHistory, fetchProfile]);
    useEffect(() => {
        if (!gymId)
            return;
        const newSocket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
            query: { gymId }
        });
        setSocket(newSocket);
        return () => {
            newSocket.disconnect();
        };
    }, [gymId]);
    useEffect(() => {
        if (!socket)
            return;
        socket.on("attendance:checkin", (data) => {
            if (data.memberId === user?._id) {
                fetchTodayStatus();
                fetchStats();
                fetchProfile();
            }
        });
        socket.on("attendance:checkout", (data) => {
            if (data.memberId === user?._id) {
                fetchTodayStatus();
                fetchStats();
                fetchProfile();
            }
        });
        socket.on("member:updated", (data) => {
            if (data.memberId === profile?._id) {
                fetchProfile();
            }
        });
        return () => {
            socket.off("attendance:checkin");
            socket.off("attendance:checkout");
            socket.off("member:updated");
        };
    }, [socket, user, fetchTodayStatus, fetchStats, fetchProfile, profile]);
    const totalPages = Math.ceil(totalRecords / limit);
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case "present":
            case "completed":
                return "active";
            case "late":
                return "pending";
            case "half-day":
                return "warning";
            case "absent":
                return "danger";
            default:
                return "";
        }
    };
    const getCalendarDays = () => {
        const start = startOfMonth(selectedMonth);
        const end = endOfMonth(selectedMonth);
        return eachDayOfInterval({ start, end });
    };
    const getDateStatus = (date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        const record = records.find((r) => r.date === dateStr);
        return record?.status || "absent";
    };
    return (_jsxs("div", { className: "member-attendance-page", children: [_jsx("div", { className: "page-header", children: _jsxs("div", { className: "flex-responsive", style: { justifyContent: "space-between", alignItems: "flex-start", gap: "1.5rem", flexWrap: "wrap" }, children: [_jsxs("div", { children: [_jsx("h1", { children: "My Attendance" }), _jsx("p", { className: "text-muted", children: "Track your check-ins, check-outs, and attendance history" })] }), _jsxs("div", { style: { display: "flex", gap: "0.75rem", flexWrap: "wrap" }, children: [_jsxs("button", { className: "btn btn-secondary", onClick: () => setShowExportModal(true), children: [_jsx(Download, { size: 18 }), "Export"] }), _jsx("button", { className: "btn btn-icon", onClick: () => { fetchTodayStatus(); fetchStats(); fetchHistory(); fetchProfile(); }, children: _jsx(RefreshCw, { size: 18 }) })] })] }) }), profile?.currentPlan && (_jsxs("div", { className: "glass-panel", style: { padding: '1.5rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)', border: '1px solid rgba(139, 92, 246, 0.2)' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }, children: [_jsx("div", { style: { background: 'rgba(139, 92, 246, 0.15)', borderRadius: '12px', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: _jsx(Zap, { size: 24, style: { color: 'var(--clr-primary)' } }) }), _jsxs("div", { children: [_jsx("h2", { style: { fontSize: '1.1rem', marginBottom: '0.25rem' }, children: "My Active Plan" }), _jsx("p", { className: "text-muted", style: { fontSize: '0.8rem' }, children: "Current Subscription" })] }), _jsx("div", { style: { marginLeft: 'auto' }, children: _jsx("span", { className: `status-badge ${profile.isActivePlan ? 'active' : 'pending'}`, children: profile.isActivePlan ? 'Active' : 'Pending Activation' }) })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }, children: [_jsxs("div", { style: { background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }, children: [_jsx("p", { className: "text-muted", style: { fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }, children: "Plan Name" }), _jsx("p", { style: { fontWeight: 700, fontSize: '1.1rem', color: 'var(--clr-primary)' }, children: profile.currentPlan.name })] }), _jsxs("div", { style: { background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }, children: [_jsx("p", { className: "text-muted", style: { fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }, children: "Duration" }), _jsx("p", { style: { fontWeight: 600, fontSize: '0.95rem' }, children: profile.currentPlan.durationType })] }), _jsxs("div", { style: { background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }, children: [_jsx("p", { className: "text-muted", style: { fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }, children: "Start Date" }), _jsx("p", { style: { fontWeight: 600, fontSize: '0.95rem' }, children: profile.membershipStartDate ? new Date(profile.membershipStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A' })] }), _jsxs("div", { style: { background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }, children: [_jsx("p", { className: "text-muted", style: { fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }, children: "Expiry Date" }), _jsx("p", { style: { fontWeight: 600, fontSize: '0.95rem', color: profile.membershipExpiryDate && new Date(profile.membershipExpiryDate) < new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) ? 'var(--clr-danger)' : 'inherit' }, children: profile.membershipExpiryDate ? new Date(profile.membershipExpiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A' })] })] }), profile.currentPlan.features?.length > 0 && (_jsx("div", { style: { marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }, children: profile.currentPlan.features.map((f, i) => (_jsx("span", { style: { fontSize: '0.75rem', background: 'rgba(139, 92, 246, 0.1)', padding: '0.35rem 0.75rem', borderRadius: '20px', border: '1px solid rgba(139, 92, 246, 0.2)', color: 'var(--clr-primary)' }, children: f }, i))) }))] })), !profile?.currentPlan && (_jsxs("div", { className: "glass-panel", style: { padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'center', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)' }, children: [_jsx(AlertTriangle, { size: 32, style: { color: 'var(--clr-warning)', marginBottom: '0.5rem' } }), _jsx("p", { className: "text-muted", style: { marginBottom: '0.35rem' }, children: "No active plan assigned" }), _jsx("p", { style: { fontSize: '0.85rem', color: 'var(--clr-text-muted)' }, children: "Please contact the admin to subscribe to a plan." })] })), _jsxs("div", { className: "attendance-checkin-section", children: [_jsxs("div", { className: "checkin-card glass-panel", children: [_jsxs("div", { className: "checkin-header", children: [_jsx("h3", { children: "Today's Status" }), _jsx("span", { className: "text-muted", style: { fontSize: "0.85rem" }, children: todayStatus?.date || format(new Date(), "yyyy-MM-dd") })] }), _jsxs("div", { className: "checkin-time-display", children: [todayStatus?.checkIn ? (_jsxs("div", { className: "time-block", children: [_jsx(LogIn, { size: 20, className: "text-success" }), _jsxs("div", { children: [_jsx("p", { className: "time-label", children: "Check-in" }), _jsx("p", { className: "time-value", children: format(parseISO(todayStatus.checkIn), "hh:mm a") })] })] })) : (_jsxs("div", { className: "time-block", children: [_jsx(LogIn, { size: 20, className: "text-muted" }), _jsxs("div", { children: [_jsx("p", { className: "time-label", children: "Check-in" }), _jsx("p", { className: "time-value text-muted", children: "--:--" })] })] })), todayStatus?.checkOut ? (_jsxs("div", { className: "time-block", children: [_jsx(LogOut, { size: 20, className: "text-success" }), _jsxs("div", { children: [_jsx("p", { className: "time-label", children: "Check-out" }), _jsx("p", { className: "time-value", children: format(parseISO(todayStatus.checkOut), "hh:mm a") })] })] })) : (_jsxs("div", { className: "time-block", children: [_jsx(LogOut, { size: 20, className: "text-muted" }), _jsxs("div", { children: [_jsx("p", { className: "time-label", children: "Check-out" }), _jsx("p", { className: "time-value text-muted", children: "--:--" })] })] }))] }), _jsx("div", { className: `current-status status-${todayStatus?.status || "absent"}`, children: _jsx("span", { className: `status-badge ${getStatusBadgeClass(todayStatus?.status || "absent")}`, children: STATUS_LABELS[todayStatus?.status || "absent"] || "Not Marked" }) }), _jsx("div", { className: "checkin-buttons", children: !todayStatus?.hasCheckedIn ? (_jsx("button", { className: "btn btn-success btn-checkin", onClick: handleCheckIn, disabled: checkingIn, children: checkingIn ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "spinner", style: { width: 18, height: 18 } }), "Checking In..."] })) : (_jsxs(_Fragment, { children: [_jsx(LogIn, { size: 20 }), "Check In"] })) })) : !todayStatus?.hasCheckedOut ? (_jsx("button", { className: "btn btn-warning btn-checkout", onClick: handleCheckOut, disabled: checkingOut, children: checkingOut ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "spinner", style: { width: 18, height: 18 } }), "Checking Out..."] })) : (_jsxs(_Fragment, { children: [_jsx(LogOut, { size: 20 }), "Check Out"] })) })) : (_jsxs("div", { className: "attendance-complete-msg", children: [_jsx(CheckCircle2, { size: 24, className: "text-success" }), _jsx("span", { children: "Attendance complete for today" })] })) }), locationError && (_jsxs("p", { className: "location-warning", children: [_jsx(MapPin, { size: 14 }), locationError] })), location && (_jsxs("p", { className: "location-success", children: [_jsx(MapPin, { size: 14 }), "Location captured (", location.accuracy, "m accuracy)"] }))] }), stats && (_jsxs("div", { className: "stats-overview glass-panel", children: [_jsxs("div", { className: "stats-header", children: [_jsx("h3", { children: "Monthly Statistics" }), _jsxs("div", { className: "month-nav", children: [_jsx("button", { className: "btn btn-icon", onClick: () => setSelectedMonth(subMonths(selectedMonth, 1)), children: _jsx(ChevronLeft, { size: 18 }) }), _jsx("span", { className: "month-label", children: format(selectedMonth, "MMMM yyyy") }), _jsx("button", { className: "btn btn-icon", onClick: () => setSelectedMonth(addMonths(selectedMonth, 1)), children: _jsx(ChevronRight, { size: 18 }) })] })] }), _jsxs("div", { className: "stats-grid-mini", children: [_jsxs("div", { className: "mini-stat", children: [_jsx("div", { className: "mini-stat-icon", style: { background: "rgba(16, 185, 129, 0.1)", color: "var(--clr-success)" }, children: _jsx(CheckCircle2, { size: 18 }) }), _jsxs("div", { className: "mini-stat-info", children: [_jsx("p", { className: "mini-stat-value", children: stats.presentDays || 0 }), _jsx("p", { className: "mini-stat-label", children: "Present" })] })] }), _jsxs("div", { className: "mini-stat", children: [_jsx("div", { className: "mini-stat-icon", style: { background: "rgba(245, 158, 11, 0.1)", color: "var(--clr-warning)" }, children: _jsx(Clock, { size: 18 }) }), _jsxs("div", { className: "mini-stat-info", children: [_jsx("p", { className: "mini-stat-value", children: stats.lateDays || 0 }), _jsx("p", { className: "mini-stat-label", children: "Late" })] })] }), _jsxs("div", { className: "mini-stat", children: [_jsx("div", { className: "mini-stat-icon", style: { background: "rgba(139, 92, 246, 0.1)", color: "var(--clr-purple)" }, children: _jsx(BarChart3, { size: 18 }) }), _jsxs("div", { className: "mini-stat-info", children: [_jsx("p", { className: "mini-stat-value", children: stats.halfDays || 0 }), _jsx("p", { className: "mini-stat-label", children: "Half Day" })] })] }), _jsxs("div", { className: "mini-stat", children: [_jsx("div", { className: "mini-stat-icon", style: { background: "rgba(244, 63, 94, 0.1)", color: "var(--clr-danger)" }, children: _jsx(XCircle, { size: 18 }) }), _jsxs("div", { className: "mini-stat-info", children: [_jsx("p", { className: "mini-stat-value", children: stats.absentDays || 0 }), _jsx("p", { className: "mini-stat-label", children: "Absent" })] })] })] }), _jsxs("div", { className: "streak-section", children: [_jsxs("div", { className: "streak-item", children: [_jsx(Flame, { size: 20, style: { color: "var(--clr-warning)" } }), _jsxs("div", { children: [_jsx("p", { className: "streak-value", children: stats.currentStreak || 0 }), _jsx("p", { className: "streak-label", children: "Current Streak" })] })] }), _jsxs("div", { className: "streak-item", children: [_jsx(Award, { size: 20, style: { color: "var(--clr-accent)" } }), _jsxs("div", { children: [_jsx("p", { className: "streak-value", children: stats.longestStreak || 0 }), _jsx("p", { className: "streak-label", children: "Best Streak" })] })] }), _jsxs("div", { className: "streak-item", children: [_jsx(TrendingUp, { size: 20, style: { color: "var(--clr-success)" } }), _jsxs("div", { children: [_jsxs("p", { className: "streak-value", children: [stats.attendanceRate || 0, "%"] }), _jsx("p", { className: "streak-label", children: "Attendance Rate" })] })] })] }), _jsxs("div", { className: "avg-checkin", children: [_jsx(Clock, { size: 16, className: "text-muted" }), _jsxs("span", { children: ["Avg. Check-in: ", _jsx("strong", { children: stats.avgCheckInTime || "--:--" })] })] })] }))] }), _jsxs("div", { className: "calendar-section glass-panel", children: [_jsx("h3", { style: { marginBottom: "1rem" }, children: "Attendance Calendar" }), _jsxs("div", { className: "calendar-grid", children: [["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (_jsx("div", { className: "calendar-header-cell", children: day }, day))), getCalendarDays().map((date) => {
                                const status = getDateStatus(date);
                                const isToday = isSameDay(date, new Date());
                                return (_jsxs("div", { className: `calendar-cell ${status} ${isToday ? "today" : ""}`, title: `${format(date, "MMM d")}: ${STATUS_LABELS[status]}`, children: [_jsx("span", { className: "calendar-date", children: format(date, "d") }), status !== "absent" && (_jsx("span", { className: "calendar-dot", style: { background: STATUS_COLORS[status] } }))] }, date.toISOString()));
                            })] }), _jsx("div", { className: "calendar-legend", children: Object.entries(STATUS_LABELS).map(([key, label]) => (_jsxs("div", { className: "legend-item", children: [_jsx("span", { className: "legend-dot", style: { background: STATUS_COLORS[key] } }), _jsx("span", { children: label })] }, key))) })] }), _jsxs("div", { className: "history-section glass-panel", children: [_jsxs("div", { className: "history-header", children: [_jsx("h3", { children: "Attendance History" }), _jsxs("button", { className: "btn btn-secondary", onClick: () => setShowFilters(!showFilters), children: [_jsx(Filter, { size: 16 }), "Filters"] })] }), showFilters && (_jsxs("div", { className: "filters-panel", children: [_jsxs("div", { className: "filter-row", children: [_jsxs("div", { className: "search-bar", style: { flex: 1 }, children: [_jsx(Search, { size: 16, className: "text-muted" }), _jsx("input", { placeholder: "Search notes...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value) })] }), _jsxs("select", { className: "form-input", style: { width: "auto", minWidth: "120px" }, value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), children: [_jsx("option", { value: "all", children: "All Status" }), _jsx("option", { value: "present", children: "Present" }), _jsx("option", { value: "completed", children: "Completed" }), _jsx("option", { value: "late", children: "Late" }), _jsx("option", { value: "half-day", children: "Half Day" }), _jsx("option", { value: "absent", children: "Absent" })] })] }), _jsxs("div", { className: "filter-row", children: [_jsxs("div", { className: "date-range", children: [_jsx("input", { type: "date", className: "form-input", value: startDate, onChange: (e) => setStartDate(e.target.value), placeholder: "Start Date" }), _jsx("span", { className: "text-muted", children: "to" }), _jsx("input", { type: "date", className: "form-input", value: endDate, onChange: (e) => setEndDate(e.target.value), placeholder: "End Date" })] }), _jsx("button", { className: "btn btn-secondary", onClick: () => {
                                            setSearchQuery("");
                                            setStartDate("");
                                            setEndDate("");
                                            setStatusFilter("all");
                                        }, children: "Clear" })] })] })), _jsx("div", { className: "table-container hide-on-mobile", children: _jsxs("table", { className: "data-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Date" }), _jsx("th", { children: "Day" }), _jsx("th", { children: "Check-in" }), _jsx("th", { children: "Check-out" }), _jsx("th", { children: "Duration" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Notes" })] }) }), _jsx("tbody", { children: loading ? (_jsx("tr", { children: _jsxs("td", { colSpan: 7, className: "text-center", style: { padding: "3rem" }, children: [_jsx("div", { className: "spinner", style: { margin: "0 auto 1rem" } }), "Loading..."] }) })) : records.length > 0 ? (records.map((record) => {
                                        const date = parseISO(record.date);
                                        const checkInTime = record.checkIn ? format(parseISO(record.checkIn), "hh:mm a") : "-";
                                        const checkOutTime = record.checkOut ? format(parseISO(record.checkOut), "hh:mm a") : "-";
                                        let duration = "-";
                                        if (record.checkIn && record.checkOut) {
                                            const diff = (new Date(record.checkOut).getTime() - new Date(record.checkIn).getTime()) / (1000 * 60 * 60);
                                            duration = `${diff.toFixed(1)} hrs`;
                                        }
                                        return (_jsxs("tr", { children: [_jsx("td", { children: record.date }), _jsx("td", { children: format(date, "EEEE") }), _jsx("td", { children: checkInTime }), _jsx("td", { children: checkOutTime }), _jsx("td", { children: duration }), _jsx("td", { children: _jsx("span", { className: `status-badge ${getStatusBadgeClass(record.status)}`, children: STATUS_LABELS[record.status] }) }), _jsx("td", { className: "notes-cell", children: record.notes || "-" })] }, record._id));
                                    })) : (_jsx("tr", { children: _jsx("td", { colSpan: 7, className: "text-center", style: { padding: "3rem" }, children: _jsx("p", { className: "text-muted", children: "No attendance records found" }) }) })) })] }) }), _jsx("div", { className: "mobile-cards-container", children: loading ? (_jsx("div", { className: "text-center", style: { padding: "2rem" }, children: _jsx("div", { className: "spinner", style: { margin: "0 auto" } }) })) : records.length > 0 ? (records.map((record) => {
                            const date = parseISO(record.date);
                            return (_jsxs("div", { className: "mobile-card", children: [_jsxs("div", { className: "mobile-card-header", children: [_jsx("span", { className: "mobile-card-date", children: format(date, "MMM d, yyyy") }), _jsx("span", { className: `status-badge ${getStatusBadgeClass(record.status)}`, children: STATUS_LABELS[record.status] })] }), _jsxs("div", { className: "mobile-card-row", children: [_jsx("span", { className: "mobile-card-label", children: "Check-in" }), _jsx("span", { className: "mobile-card-value", children: record.checkIn ? format(parseISO(record.checkIn), "hh:mm a") : "-" })] }), _jsxs("div", { className: "mobile-card-row", children: [_jsx("span", { className: "mobile-card-label", children: "Check-out" }), _jsx("span", { className: "mobile-card-value", children: record.checkOut ? format(parseISO(record.checkOut), "hh:mm a") : "-" })] }), record.notes && (_jsxs("div", { className: "mobile-card-row", children: [_jsx("span", { className: "mobile-card-label", children: "Notes" }), _jsx("span", { className: "mobile-card-value", children: record.notes })] }))] }, record._id));
                        })) : (_jsx("p", { className: "text-center text-muted", style: { padding: "2rem" }, children: "No attendance records found" })) }), totalPages > 1 && (_jsxs("div", { className: "pagination", children: [_jsxs("button", { className: "btn btn-secondary", disabled: currentPage === 1, onClick: () => setCurrentPage((p) => Math.max(1, p - 1)), children: [_jsx(ChevronLeft, { size: 16 }), "Previous"] }), _jsxs("span", { className: "page-info", children: ["Page ", currentPage, " of ", totalPages] }), _jsxs("button", { className: "btn btn-secondary", disabled: currentPage >= totalPages, onClick: () => setCurrentPage((p) => Math.min(totalPages, p + 1)), children: ["Next", _jsx(ChevronRight, { size: 16 })] })] }))] }), showExportModal && (_jsx("div", { className: "modal-overlay", onClick: () => setShowExportModal(false), children: _jsxs("div", { className: "modal-content glass-panel", onClick: (e) => e.stopPropagation(), children: [_jsx("h3", { children: "Export Attendance" }), _jsx("p", { className: "text-muted", style: { marginBottom: "1.5rem" }, children: "Choose format and date range for your attendance report" }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Date Range (Optional)" }), _jsxs("div", { className: "date-range", children: [_jsx("input", { type: "date", className: "form-input", value: exportRange.start, onChange: (e) => setExportRange({ ...exportRange, start: e.target.value }), placeholder: "Start Date" }), _jsx("span", { className: "text-muted", children: "to" }), _jsx("input", { type: "date", className: "form-input", value: exportRange.end, onChange: (e) => setExportRange({ ...exportRange, end: e.target.value }), placeholder: "End Date" })] })] }), _jsxs("div", { className: "export-buttons", children: [_jsxs("button", { className: "btn btn-secondary", onClick: () => handleExport("csv"), children: [_jsx(FileText, { size: 18 }), "Export as CSV"] }), _jsxs("button", { className: "btn btn-primary", onClick: () => handleExport("pdf"), children: [_jsx(FileText, { size: 18 }), "Export as PDF Report"] })] }), _jsx("button", { className: "btn btn-secondary w-full", style: { marginTop: "1rem" }, onClick: () => setShowExportModal(false), children: "Cancel" })] }) })), _jsx("style", { children: `
        .member-attendance-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .attendance-checkin-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        @media (max-width: 1023px) {
          .attendance-checkin-section {
            grid-template-columns: 1fr;
          }
        }

        .checkin-card {
          padding: 1.5rem;
          background-image: url('https://res.cloudinary.com/dyc33dchn/image/upload/q_auto/f_auto/v1776523432/ChatGPT_Image_Apr_18_2026_08_12_31_PM_xpfcf7.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          background-attachment: fixed;
          position: relative;
        }

        .checkin-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          border-radius: inherit;
          pointer-events: none;
          z-index: 1;
        }

        .checkin-card > * {
          position: relative;
          z-index: 2;
        }

        .checkin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .checkin-header h3 {
          font-size: 1.1rem;
          margin: 0;
        }

        .checkin-time-display {
          display: flex;
          justify-content: space-around;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding: 1.25rem;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--border-radius-md);
        }

        .time-block {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .time-label {
          font-size: 0.75rem;
          color: var(--clr-text-muted);
          margin: 0;
        }

        .time-value {
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
        }

        .current-status {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .checkin-buttons {
          display: flex;
          justify-content: center;
        }

        .btn-checkin,
        .btn-checkout {
          padding: 1rem 2rem;
          font-size: 1rem;
        }

        .attendance-complete-msg {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--clr-success);
          font-weight: 500;
        }

        .location-warning,
        .location-success {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          margin-top: 1rem;
          text-align: center;
          justify-content: center;
        }

        .location-warning {
          color: var(--clr-warning);
        }

        .location-success {
          color: var(--clr-success);
        }

        .stats-overview {
          padding: 1.5rem;
        }

        .stats-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .stats-header h3 {
          font-size: 1.1rem;
          margin: 0;
        }

        .month-nav {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .month-label {
          font-weight: 600;
          min-width: 120px;
          text-align: center;
        }

        .stats-grid-mini {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .mini-stat {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--clr-bg-base);
          border-radius: var(--border-radius-md);
        }

        .mini-stat-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mini-stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
        }

        .mini-stat-label {
          font-size: 0.75rem;
          color: var(--clr-text-muted);
          margin: 0;
        }

        .streak-section {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .streak-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .streak-value {
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0;
        }

        .streak-label {
          font-size: 0.7rem;
          color: var(--clr-text-muted);
          margin: 0;
        }

        .avg-checkin {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          justify-content: center;
          font-size: 0.85rem;
        }

        .calendar-section {
          padding: 1.5rem;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .calendar-header-cell {
          text-align: center;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--clr-text-muted);
          padding: 0.5rem;
        }

        .calendar-cell {
          position: relative;
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: var(--border-radius-sm);
          background: var(--clr-bg-base);
          font-size: 0.85rem;
          transition: var(--transition-base);
        }

        .calendar-cell:hover {
          background: var(--clr-glass-bg-hover);
        }

        .calendar-cell.today {
          border: 2px solid var(--clr-primary);
        }

        .calendar-cell.present,
        .calendar-cell.completed {
          background: rgba(16, 185, 129, 0.1);
        }

        .calendar-cell.late {
          background: rgba(245, 158, 11, 0.1);
        }

        .calendar-cell.half-day {
          background: rgba(139, 92, 246, 0.1);
        }

        .calendar-cell.absent {
          opacity: 0.5;
        }

        .calendar-date {
          font-weight: 500;
        }

        .calendar-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          position: absolute;
          bottom: 4px;
        }

        .calendar-legend {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: center;
          padding-top: 0.5rem;
          border-top: 1px solid var(--clr-glass-border);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          color: var(--clr-text-muted);
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .history-section {
          padding: 1.5rem;
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .history-header h3 {
          font-size: 1.1rem;
          margin: 0;
        }

        .filters-panel {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
          background: var(--clr-bg-base);
          border-radius: var(--border-radius-md);
          margin-bottom: 1.5rem;
        }

        .filter-row {
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .date-range {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .notes-cell {
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid var(--clr-glass-border);
        }

        .page-info {
          font-size: 0.85rem;
          color: var(--clr-text-muted);
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-content {
          max-width: 450px;
          width: 100%;
          padding: 2rem;
          border-radius: var(--border-radius-lg);
        }

        .modal-content h3 {
          margin-bottom: 0.5rem;
        }

        .export-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .w-full {
          width: 100%;
        }

        @media (max-width: 767px) {
          .stats-grid-mini {
            grid-template-columns: 1fr 1fr;
          }

          .streak-section {
            grid-template-columns: 1fr 1fr;
          }

          .calendar-grid {
            gap: 0.25rem;
          }

          .calendar-header-cell {
            font-size: 0.65rem;
            padding: 0.25rem;
          }

          .calendar-cell {
            font-size: 0.75rem;
          }

          .history-header {
            flex-direction: column;
            align-items: stretch;
          }

          .filter-row {
            flex-direction: column;
            align-items: stretch;
          }

          .date-range {
            flex-direction: column;
          }

          .pagination {
            flex-wrap: wrap;
          }

          .checkin-card {
            background-attachment: scroll;
          }
        }

        .flex-responsive {
          display: flex;
        }

        @media (max-width: 767px) {
          .flex-responsive {
            flex-direction: column;
          }
        }
      ` })] }));
};
export default MemberAttendancePage;
