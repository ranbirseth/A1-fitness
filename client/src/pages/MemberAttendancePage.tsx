import React, { useEffect, useState, useCallback } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  FileText,
  MapPin,
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Flame,
  Award,
  BarChart3,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, addMonths, eachDayOfInterval, parseISO, isSameDay } from "date-fns";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";
import {
  memberCheckIn,
  memberCheckOut,
  getMyAttendance,
  getTodayAttendanceStatus,
  getMyAttendanceStats,
  getRealTimeStatus,
  exportMyAttendance,
} from "../features/attendance/attendance.api";
import { getMyProfile } from "../features/members/members.api";
import { useAuthStore } from "../store/auth.store";
import { useDebounce } from "../hooks/useDebounce";

interface AttendanceRecord {
  _id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: "present" | "completed" | "absent" | "late" | "half-day";
  notes?: string;
  location?: {
    checkIn?: { latitude: number; longitude: number; accuracy: number };
    checkOut?: { latitude: number; longitude: number; accuracy: number };
  };
}

interface TodayStatus {
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  date: string;
}

interface Stats {
  totalDays: number;
  presentDays: number;
  completedDays: number;
  halfDays: number;
  absentDays: number;
  lateDays: number;
  avgCheckInTime: string;
  attendanceRate: number;
  currentStreak: number;
  longestStreak: number;
  dailyBreakdown?: {
    labels: string[];
    present: number[];
    late: number[];
    halfDay: number[];
    absent: number[];
  };
  month?: number;
  year?: number;
}

const STATUS_COLORS: Record<string, string> = {
  present: "var(--clr-success)",
  completed: "var(--clr-success)",
  late: "var(--clr-warning)",
  "half-day": "var(--clr-purple)",
  absent: "var(--clr-danger)",
};

const STATUS_LABELS: Record<string, string> = {
  present: "Present",
  completed: "Completed",
  late: "Late",
  "half-day": "Half Day",
  absent: "Absent",
};

const MemberAttendancePage: React.FC = () => {
  const { user, gymId } = useAuthStore();

  const [socket, setSocket] = useState<Socket | null>(null);

  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit] = useState(10);

  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportRange, setExportRange] = useState({ start: "", end: "" });
  const [location, setLocation] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  const debouncedSearch = useDebounce(searchQuery, 500);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await getMyProfile();
      if (res.data?.data) {
        setProfile(res.data.data);
        console.log("Fetched profile data:", res.data.data); // Add this line
      }
    } catch (error) {
      console.error("Failed to fetch profile", error);
    }
  }, []);

  const fetchTodayStatus = useCallback(async () => {
    try {
      const res = await getRealTimeStatus();
      if (res.data?.data) {
        setTodayStatus(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch today's status", error);
    }
  }, []);

  const fetchStats = useCallback(async (date: Date = selectedMonth) => {
    try {
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const res = await getMyAttendanceStats({ month, year });
      if (res.data?.data) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  }, [selectedMonth]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (statusFilter !== "all") params.status = statusFilter;

      const res = await getMyAttendance(params);
      if (res.data?.data) {
        setRecords(res.data.data.items || []);
        setTotalRecords(res.data.data.total || 0);
      }
    } catch (error) {
      console.error("Failed to fetch history", error);
      toast.error("Failed to load attendance history");
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, debouncedSearch, startDate, endDate, statusFilter]);

  const getLocation = (): Promise<{ latitude: number; longitude: number; accuracy: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setLocationError("Geolocation not supported by your browser");
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setLocation({ latitude, longitude, accuracy });
          setLocationError(null);
          resolve({ latitude, longitude, accuracy });
        },
        (error) => {
          let errorMsg = "Unable to get location";
          if (error.code === error.PERMISSION_DENIED) {
            errorMsg = "Location permission denied. Please enable location access.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMsg = "Location information unavailable";
          } else if (error.code === error.TIMEOUT) {
            errorMsg = "Location request timed out";
          }
          setLocationError(errorMsg);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
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
    } catch (error: any) {
      console.error("Check-in error:", error.response?.data);
      const message = error.response?.data?.message || "Check-in failed";
      toast.error(message);
    } finally {
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
    } catch (error: any) {
      console.error("Check-out error:", error.response?.data);
      const message = error.response?.data?.message || "Check-out failed";
      toast.error(message);
    } finally {
      setCheckingOut(false);
    }
  };

  const handleExport = async (format: "csv" | "pdf") => {
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
    } catch (error) {
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
    if (!gymId) return;
    const newSocket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      query: { gymId }
    });
    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, [gymId]);

  useEffect(() => {
    if (!socket) return;

    socket.on("attendance:checkin", (data: any) => {
      if (data.memberId === user?._id) {
        fetchTodayStatus();
        fetchStats();
        fetchProfile();
      }
    });

    socket.on("attendance:checkout", (data: any) => {
      if (data.memberId === user?._id) {
        fetchTodayStatus();
        fetchStats();
        fetchProfile();
      }
    });

    socket.on("member:updated", (data: any) => {
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

  const getStatusBadgeClass = (status: string) => {
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

  const getDateStatus = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const record = records.find((r) => r.date === dateStr);
    return record?.status || "absent";
  };

  return (
    <div className="member-attendance-page">
      <div className="page-header">
        <div className="flex-responsive" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: "1.5rem", flexWrap: "wrap" }}>
          <div>
            <h1>My Attendance</h1>
            <p className="text-muted">Track your check-ins, check-outs, and attendance history</p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button className="btn btn-secondary" onClick={() => setShowExportModal(true)}>
              <Download size={18} />
              Export
            </button>
            <button className="btn btn-icon" onClick={() => { fetchTodayStatus(); fetchStats(); fetchHistory(); fetchProfile(); }}>
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </div>

      {profile?.currentPlan && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(139, 92, 246, 0.15)', borderRadius: '12px', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={24} style={{ color: 'var(--clr-primary)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>My Active Plan</h2>
              <p className="text-muted" style={{ fontSize: '0.8rem' }}>Current Subscription</p>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span className={`status-badge ${profile.isActivePlan ? 'active' : 'pending'}`}>
                {profile.isActivePlan ? 'Active' : 'Pending Activation'}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Plan Name</p>
              <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--clr-primary)' }}>{profile.currentPlan.name}</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Duration</p>
              <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{profile.currentPlan.durationType}</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Start Date</p>
              <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                {profile.membershipStartDate ? new Date(profile.membershipStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
              </p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Expiry Date</p>
              <p style={{ fontWeight: 600, fontSize: '0.95rem', color: profile.membershipExpiryDate && new Date(profile.membershipExpiryDate) < new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) ? 'var(--clr-danger)' : 'inherit' }}>
                {profile.membershipExpiryDate ? new Date(profile.membershipExpiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
              </p>
            </div>
          </div>

          {profile.currentPlan.features?.length > 0 && (
            <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {profile.currentPlan.features.map((f: string, i: number) => (
                <span key={i} style={{ fontSize: '0.75rem', background: 'rgba(139, 92, 246, 0.1)', padding: '0.35rem 0.75rem', borderRadius: '20px', border: '1px solid rgba(139, 92, 246, 0.2)', color: 'var(--clr-primary)' }}>
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {!profile?.currentPlan && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'center', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <AlertTriangle size={32} style={{ color: 'var(--clr-warning)', marginBottom: '0.5rem' }} />
          <p className="text-muted" style={{ marginBottom: '0.35rem' }}>No active plan assigned</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>Please contact the admin to subscribe to a plan.</p>
        </div>
      )}

      <div className="attendance-checkin-section">
        <div className="checkin-card glass-panel">
          <div className="checkin-header">
            <h3>Today's Status</h3>
            <span className="text-muted" style={{ fontSize: "0.85rem" }}>
              {todayStatus?.date || format(new Date(), "yyyy-MM-dd")}
            </span>
          </div>

          <div className="checkin-time-display">
            {todayStatus?.checkIn ? (
              <div className="time-block">
                <LogIn size={20} className="text-success" />
                <div>
                  <p className="time-label">Check-in</p>
                  <p className="time-value">{format(parseISO(todayStatus.checkIn), "hh:mm a")}</p>
                </div>
              </div>
            ) : (
              <div className="time-block">
                <LogIn size={20} className="text-muted" />
                <div>
                  <p className="time-label">Check-in</p>
                  <p className="time-value text-muted">--:--</p>
                </div>
              </div>
            )}

            {todayStatus?.checkOut ? (
              <div className="time-block">
                <LogOut size={20} className="text-success" />
                <div>
                  <p className="time-label">Check-out</p>
                  <p className="time-value">{format(parseISO(todayStatus.checkOut), "hh:mm a")}</p>
                </div>
              </div>
            ) : (
              <div className="time-block">
                <LogOut size={20} className="text-muted" />
                <div>
                  <p className="time-label">Check-out</p>
                  <p className="time-value text-muted">--:--</p>
                </div>
              </div>
            )}
          </div>

          <div className={`current-status status-${todayStatus?.status || "absent"}`}>
            <span className={`status-badge ${getStatusBadgeClass(todayStatus?.status || "absent")}`}>
              {STATUS_LABELS[todayStatus?.status || "absent"] || "Not Marked"}
            </span>
          </div>

          <div className="checkin-buttons">
            {!todayStatus?.hasCheckedIn ? (
              <button
                className="btn btn-success btn-checkin"
                onClick={handleCheckIn}
                disabled={checkingIn}
              >
                {checkingIn ? (
                  <>
                    <div className="spinner" style={{ width: 18, height: 18 }}></div>
                    Checking In...
                  </>
                ) : (
                  <>
                    <LogIn size={20} />
                    Check In
                  </>
                )}
              </button>
            ) : !todayStatus?.hasCheckedOut ? (
              <button
                className="btn btn-warning btn-checkout"
                onClick={handleCheckOut}
                disabled={checkingOut}
              >
                {checkingOut ? (
                  <>
                    <div className="spinner" style={{ width: 18, height: 18 }}></div>
                    Checking Out...
                  </>
                ) : (
                  <>
                    <LogOut size={20} />
                    Check Out
                  </>
                )}
              </button>
            ) : (
              <div className="attendance-complete-msg">
                <CheckCircle2 size={24} className="text-success" />
                <span>Attendance complete for today</span>
              </div>
            )}
          </div>

          {locationError && (
            <p className="location-warning">
              <MapPin size={14} />
              {locationError}
            </p>
          )}

          {location && (
            <p className="location-success">
              <MapPin size={14} />
              Location captured ({location.accuracy}m accuracy)
            </p>
          )}
        </div>

        {stats && (
          <div className="stats-overview glass-panel">
            <div className="stats-header">
              <h3>Monthly Statistics</h3>
              <div className="month-nav">
                <button className="btn btn-icon" onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}>
                  <ChevronLeft size={18} />
                </button>
                <span className="month-label">{format(selectedMonth, "MMMM yyyy")}</span>
                <button className="btn btn-icon" onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="stats-grid-mini">
              <div className="mini-stat">
                <div className="mini-stat-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--clr-success)" }}>
                  <CheckCircle2 size={18} />
                </div>
                <div className="mini-stat-info">
                  <p className="mini-stat-value">{stats.presentDays || 0}</p>
                  <p className="mini-stat-label">Present</p>
                </div>
              </div>

              <div className="mini-stat">
                <div className="mini-stat-icon" style={{ background: "rgba(245, 158, 11, 0.1)", color: "var(--clr-warning)" }}>
                  <Clock size={18} />
                </div>
                <div className="mini-stat-info">
                  <p className="mini-stat-value">{stats.lateDays || 0}</p>
                  <p className="mini-stat-label">Late</p>
                </div>
              </div>

              <div className="mini-stat">
                <div className="mini-stat-icon" style={{ background: "rgba(139, 92, 246, 0.1)", color: "var(--clr-purple)" }}>
                  <BarChart3 size={18} />
                </div>
                <div className="mini-stat-info">
                  <p className="mini-stat-value">{stats.halfDays || 0}</p>
                  <p className="mini-stat-label">Half Day</p>
                </div>
              </div>

              <div className="mini-stat">
                <div className="mini-stat-icon" style={{ background: "rgba(244, 63, 94, 0.1)", color: "var(--clr-danger)" }}>
                  <XCircle size={18} />
                </div>
                <div className="mini-stat-info">
                  <p className="mini-stat-value">{stats.absentDays || 0}</p>
                  <p className="mini-stat-label">Absent</p>
                </div>
              </div>
            </div>

            <div className="streak-section">
              <div className="streak-item">
                <Flame size={20} style={{ color: "var(--clr-warning)" }} />
                <div>
                  <p className="streak-value">{stats.currentStreak || 0}</p>
                  <p className="streak-label">Current Streak</p>
                </div>
              </div>
              <div className="streak-item">
                <Award size={20} style={{ color: "var(--clr-accent)" }} />
                <div>
                  <p className="streak-value">{stats.longestStreak || 0}</p>
                  <p className="streak-label">Best Streak</p>
                </div>
              </div>
              <div className="streak-item">
                <TrendingUp size={20} style={{ color: "var(--clr-success)" }} />
                <div>
                  <p className="streak-value">{stats.attendanceRate || 0}%</p>
                  <p className="streak-label">Attendance Rate</p>
                </div>
              </div>
            </div>

            <div className="avg-checkin">
              <Clock size={16} className="text-muted" />
              <span>Avg. Check-in: <strong>{stats.avgCheckInTime || "--:--"}</strong></span>
            </div>
          </div>
        )}
      </div>

      <div className="calendar-section glass-panel">
        <h3 style={{ marginBottom: "1rem" }}>Attendance Calendar</h3>
        <div className="calendar-grid">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="calendar-header-cell">{day}</div>
          ))}
          {getCalendarDays().map((date) => {
            const status = getDateStatus(date);
            const isToday = isSameDay(date, new Date());
            return (
              <div
                key={date.toISOString()}
                className={`calendar-cell ${status} ${isToday ? "today" : ""}`}
                title={`${format(date, "MMM d")}: ${STATUS_LABELS[status]}`}
              >
                <span className="calendar-date">{format(date, "d")}</span>
                {status !== "absent" && (
                  <span className="calendar-dot" style={{ background: STATUS_COLORS[status] }}></span>
                )}
              </div>
            );
          })}
        </div>
        <div className="calendar-legend">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <div key={key} className="legend-item">
              <span className="legend-dot" style={{ background: STATUS_COLORS[key] }}></span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="history-section glass-panel">
        <div className="history-header">
          <h3>Attendance History</h3>
          <button className="btn btn-secondary" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={16} />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="filters-panel">
            <div className="filter-row">
              <div className="search-bar" style={{ flex: 1 }}>
                <Search size={16} className="text-muted" />
                <input
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="form-input"
                style={{ width: "auto", minWidth: "120px" }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="completed">Completed</option>
                <option value="late">Late</option>
                <option value="half-day">Half Day</option>
                <option value="absent">Absent</option>
              </select>
            </div>
            <div className="filter-row">
              <div className="date-range">
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Start Date"
                />
                <span className="text-muted">to</span>
                <input
                  type="date"
                  className="form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="End Date"
                />
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSearchQuery("");
                  setStartDate("");
                  setEndDate("");
                  setStatusFilter("all");
                }}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <div className="table-container hide-on-mobile">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center" style={{ padding: "3rem" }}>
                    <div className="spinner" style={{ margin: "0 auto 1rem" }}></div>
                    Loading...
                  </td>
                </tr>
              ) : records.length > 0 ? (
                records.map((record) => {
                  const date = parseISO(record.date);
                  const checkInTime = record.checkIn ? format(parseISO(record.checkIn), "hh:mm a") : "-";
                  const checkOutTime = record.checkOut ? format(parseISO(record.checkOut), "hh:mm a") : "-";
                  let duration = "-";
                  if (record.checkIn && record.checkOut) {
                    const diff = (new Date(record.checkOut).getTime() - new Date(record.checkIn).getTime()) / (1000 * 60 * 60);
                    duration = `${diff.toFixed(1)} hrs`;
                  }
                  return (
                    <tr key={record._id}>
                      <td>{record.date}</td>
                      <td>{format(date, "EEEE")}</td>
                      <td>{checkInTime}</td>
                      <td>{checkOutTime}</td>
                      <td>{duration}</td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(record.status)}`}>
                          {STATUS_LABELS[record.status]}
                        </span>
                      </td>
                      <td className="notes-cell">{record.notes || "-"}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center" style={{ padding: "3rem" }}>
                    <p className="text-muted">No attendance records found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mobile-cards-container">
          {loading ? (
            <div className="text-center" style={{ padding: "2rem" }}>
              <div className="spinner" style={{ margin: "0 auto" }}></div>
            </div>
          ) : records.length > 0 ? (
            records.map((record) => {
              const date = parseISO(record.date);
              return (
                <div key={record._id} className="mobile-card">
                  <div className="mobile-card-header">
                    <span className="mobile-card-date">{format(date, "MMM d, yyyy")}</span>
                    <span className={`status-badge ${getStatusBadgeClass(record.status)}`}>
                      {STATUS_LABELS[record.status]}
                    </span>
                  </div>
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Check-in</span>
                    <span className="mobile-card-value">
                      {record.checkIn ? format(parseISO(record.checkIn), "hh:mm a") : "-"}
                    </span>
                  </div>
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Check-out</span>
                    <span className="mobile-card-value">
                      {record.checkOut ? format(parseISO(record.checkOut), "hh:mm a") : "-"}
                    </span>
                  </div>
                  {record.notes && (
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Notes</span>
                      <span className="mobile-card-value">{record.notes}</span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-center text-muted" style={{ padding: "2rem" }}>
              No attendance records found
            </p>
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn btn-secondary"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <span className="page-info">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="btn btn-secondary"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <h3>Export Attendance</h3>
            <p className="text-muted" style={{ marginBottom: "1.5rem" }}>
              Choose format and date range for your attendance report
            </p>

            <div className="form-group">
              <label className="form-label">Date Range (Optional)</label>
              <div className="date-range">
                <input
                  type="date"
                  className="form-input"
                  value={exportRange.start}
                  onChange={(e) => setExportRange({ ...exportRange, start: e.target.value })}
                  placeholder="Start Date"
                />
                <span className="text-muted">to</span>
                <input
                  type="date"
                  className="form-input"
                  value={exportRange.end}
                  onChange={(e) => setExportRange({ ...exportRange, end: e.target.value })}
                  placeholder="End Date"
                />
              </div>
            </div>

            <div className="export-buttons">
              <button className="btn btn-secondary" onClick={() => handleExport("csv")}>
                <FileText size={18} />
                Export as CSV
              </button>
              <button className="btn btn-primary" onClick={() => handleExport("pdf")}>
                <FileText size={18} />
                Export as PDF Report
              </button>
            </div>

            <button className="btn btn-secondary w-full" style={{ marginTop: "1rem" }} onClick={() => setShowExportModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <style>{`
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
      `}</style>
    </div>
  );
};

export default MemberAttendancePage;