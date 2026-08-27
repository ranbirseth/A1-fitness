import React, { useEffect, useState } from "react";
import { getDashboardStats } from "../features/dashboard/dashboard.api";
import {
  Users,
  IndianRupee,
  UserSquare2,
  CalendarCheck,
  TrendingUp,
  ArrowUpRight,
  Building2,
  ClipboardList,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useAuthStore } from "../store/auth.store";
import { useBranchStore } from "../store/branch.store";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { branches, selectedBranch, setSelectedBranch, fetchBranches } =
    useBranchStore();

  const [stats, setStats] = useState<any>({
    totalMembers: 0,
    activePlans: 0,
    revenue: 0,
    activeTrainers: 0,
    attendanceToday: 0,
    revenueAnalytics: [],
    recentActivities: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSuperAdmin = user?.role === "superadmin";
  const isAdmin = user?.role === "admin";
  const isTrainer = user?.role === "trainer";

  const loadStats = () => {
    if (!isAdmin && !isTrainer && !isSuperAdmin) return;

    setLoading(true);
    setError(null);

    const params =
      isSuperAdmin && selectedBranch !== "ALL"
        ? { branchCode: selectedBranch }
        : undefined;

    getDashboardStats(params)
      .then((res) => {
        if (res.data?.data) {
          setStats(res.data.data);
        }
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.message ||
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

  const maxRevenue = Math.max(
    ...(stats.revenueAnalytics?.map((d: any) => d.total) || [100]),
    100
  );

  const currentBranchName = (() => {
    if (isSuperAdmin) {
      if (selectedBranch === "ALL") return "All Branches";
      return (
        branches.find((b) => b.branchCode === selectedBranch)?.name ||
        selectedBranch
      );
    }
    if (isAdmin || isTrainer) {
      return (
        branches.find((b) => b.branchCode === user?.branchCode)?.name ||
        user?.branchCode ||
        "Main Branch"
      );
    }
    return user?.branchCode || "Main Branch";
  })();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "40vh",
          gap: "1rem",
          color: "var(--clr-text-muted)",
        }}
      >
        <Loader2
          size={36}
          className="spin"
          style={{ color: "var(--clr-primary)" }}
        />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "40vh",
          gap: "1rem",
        }}
      >
        <AlertTriangle size={36} style={{ color: "var(--clr-danger)" }} />
        <p style={{ color: "var(--clr-danger)", fontWeight: 600 }}>{error}</p>
        <button className="btn btn-primary" onClick={loadStats}>
          <ArrowUpRight size={18} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: "2rem" }}>
        <div
          className="flex-responsive"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1.5rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1>Dashboard Overview</h1>
            <p className="text-muted">
              Welcome back! Showing data for{" "}
              <strong style={{ color: "var(--clr-primary)" }}>
                {currentBranchName}
              </strong>
              .
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            {isSuperAdmin && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background:
                    "var(--bg-glass-card, rgba(255,255,255,0.06))",
                  padding: "0.4rem 0.85rem",
                  borderRadius: "8px",
                  border:
                    "1px solid var(--border-glass, rgba(255,255,255,0.1))",
                }}
              >
                <Building2
                  size={16}
                  style={{ color: "var(--clr-primary)" }}
                />
                <select
                  className="filter-select"
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "inherit",
                    fontWeight: 600,
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option
                    value="ALL"
                    style={{ background: "#1e1b4b", color: "#fff" }}
                  >
                    All Branches
                  </option>
                  {branches.map((b) => (
                    <option
                      key={b._id}
                      value={b.branchCode}
                      style={{ background: "#1e1b4b", color: "#fff" }}
                    >
                      {b.name} ({b.branchCode})
                    </option>
                  ))}
                </select>
              </div>
            )}
            {(isAdmin || isTrainer) && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background:
                    "var(--bg-glass-card, rgba(255,255,255,0.06))",
                  padding: "0.4rem 0.85rem",
                  borderRadius: "8px",
                  border:
                    "1px solid var(--border-glass, rgba(255,255,255,0.1))",
                }}
              >
                <Building2
                  size={16}
                  style={{ color: "var(--clr-primary)" }}
                />
                <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                  {currentBranchName} ({user?.branchCode})
                </span>
              </div>
            )}
            <button className="btn btn-primary" onClick={loadStats}>
              <ArrowUpRight size={18} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-stats" style={{ marginBottom: "2rem" }}>
        {/* Total Members */}
        <div
          className="stat-card"
          style={{ position: "relative", overflow: "hidden" }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.3,
            }}
          />
          <div style={{ position: "relative", zIndex: 2 }}>
            <div className="stat-info">
              <h3>Total Members</h3>
              <p className="stat-value">{stats.totalMembers}</p>
              <p className="text-muted" style={{ fontSize: "0.8rem" }}>
                Registered members
              </p>
            </div>
            <div
              className="stat-icon"
              style={{
                background: "rgba(139, 92, 246, 0.1)",
                color: "var(--clr-primary)",
              }}
            >
              <Users size={24} />
            </div>
          </div>
        </div>

        {/* Active Plans */}
        <div
          className="stat-card"
          style={{ position: "relative", overflow: "hidden" }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.3,
            }}
          />
          <div style={{ position: "relative", zIndex: 2 }}>
            <div className="stat-info">
              <h3>Active Plans</h3>
              <p className="stat-value">{stats.activePlans}</p>
              <p className="text-muted" style={{ fontSize: "0.8rem" }}>
                Members with active plans
              </p>
            </div>
            <div
              className="stat-icon"
              style={{
                background: "rgba(99, 102, 241, 0.1)",
                color: "#6366f1",
              }}
            >
              <ClipboardList size={24} />
            </div>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div
          className="stat-card"
          style={{ position: "relative", overflow: "hidden" }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(34, 197, 94, 0.08) 100%)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.3,
            }}
          />
          <div style={{ position: "relative", zIndex: 2 }}>
            <div className="stat-info">
              <h3>Monthly Revenue</h3>
              <p className="stat-value">
                ₹{(stats.revenue || 0).toLocaleString("en-IN")}
              </p>
              <p className="stat-trend trend-up">
                <TrendingUp size={14} />
                {isSuperAdmin && selectedBranch === "ALL"
                  ? "All Branches Total"
                  : "Branch Total"}
              </p>
            </div>
            <div
              className="stat-icon"
              style={{
                background: "rgba(16, 185, 129, 0.1)",
                color: "var(--clr-success)",
              }}
            >
              <IndianRupee size={24} />
            </div>
          </div>
        </div>

        {/* Active Trainers */}
        <div
          className="stat-card"
          style={{ position: "relative", overflow: "hidden" }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.3,
            }}
          />
          <div style={{ position: "relative", zIndex: 2 }}>
            <div className="stat-info">
              <h3>Active Trainers</h3>
              <p className="stat-value">{stats.activeTrainers}</p>
              <p className="text-muted" style={{ fontSize: "0.8rem" }}>
                On system
              </p>
            </div>
            <div
              className="stat-icon"
              style={{
                background: "rgba(6, 182, 212, 0.1)",
                color: "var(--clr-secondary)",
              }}
            >
              <UserSquare2 size={24} />
            </div>
          </div>
        </div>

        {/* Attendance Today */}
        <div
          className="stat-card"
          style={{ position: "relative", overflow: "hidden" }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(234, 179, 8, 0.08) 100%)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.3,
            }}
          />
          <div style={{ position: "relative", zIndex: 2 }}>
            <div className="stat-info">
              <h3>Attendance Today</h3>
              <p className="stat-value">{stats.attendanceToday}</p>
              <p className="text-muted" style={{ fontSize: "0.8rem" }}>
                Check-ins today
              </p>
            </div>
            <div
              className="stat-icon"
              style={{
                background: "rgba(245, 158, 11, 0.1)",
                color: "var(--clr-warning)",
              }}
            >
              <CalendarCheck size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Analytics + Recent Activities */}
      <div className="dashboard-grid">
        <div
          className="glass-panel"
          style={{ padding: "1.5rem", minHeight: "350px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <h3 style={{ fontSize: "1.1rem" }}>
              Revenue Analytics (Last 7 Days)
            </h3>
          </div>
          <div
            style={{
              height: "250px",
              display: "flex",
              alignItems: "flex-end",
              gap: "1rem",
              paddingBottom: "1rem",
            }}
          >
            {stats.revenueAnalytics?.length > 0 ? (
              stats.revenueAnalytics.map((day: any, i: number) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${Math.max(5, (day.total / maxRevenue) * 100)}%`,
                    background: "var(--clr-primary)",
                    borderRadius: "8px 8px 0 0",
                    opacity: 0.8,
                    position: "relative",
                  }}
                  title={`${day._id}: ₹${day.total}`}
                >
                  <span
                    style={{
                      position: "absolute",
                      bottom: "-25px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      fontSize: "0.65rem",
                      color: "var(--clr-text-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {day._id?.split("-").slice(1).join("/") || "Unknown"}
                  </span>
                </div>
              ))
            ) : (
              <div
                style={{
                  flex: 1,
                  textAlign: "center",
                  color: "var(--clr-text-muted)",
                }}
              >
                No revenue recorded for the last 7 days
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "1.5rem" }}>
            Recent Activities
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
            }}
          >
            {stats.recentActivities?.length > 0 ? (
              stats.recentActivities.map((activity: any, i: number) => (
                <div
                  key={i}
                  style={{ display: "flex", gap: "1rem" }}
                >
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: activity.color,
                      marginTop: "0.4rem",
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <p
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: "500",
                      }}
                    >
                      {activity.text}
                    </p>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--clr-text-muted)",
                      }}
                    >
                      {formatDistanceToNow(new Date(activity.time), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p
                className="text-muted"
                style={{ fontSize: "0.9rem" }}
              >
                No recent activity found.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
