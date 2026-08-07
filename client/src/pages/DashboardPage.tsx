import React, { useEffect, useState } from "react";
import { getDashboardStats } from "../features/dashboard/dashboard.api";
import { Users, IndianRupee, UserSquare2, CalendarCheck, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";
import { useAuthStore } from "../store/auth.store";
import { formatDistanceToNow } from "date-fns";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>({ 
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

  const maxRevenue = Math.max(...(stats.revenueAnalytics?.map((d: any) => d.total) || [100]), 100);

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div className="flex-responsive" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
          <div>
            <h1>Dashboard Overview</h1>
            <p className="text-muted">Welcome back! Here's what's happening today.</p>
          </div>
          <button className="btn btn-primary">
            <ArrowUpRight size={18} />
            Export
          </button>
        </div>
      </div>

      <div className="grid-stats" style={{ marginBottom: '2rem' }}>
        <div className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            background: `linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%), url('https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.3
          }} />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div className="stat-info">
              <h3>Total Members</h3>
              <p className="stat-value">{stats.totalMembers}</p>
              <p className="stat-trend trend-up">
                <TrendingUp size={14} />
                {stats.activePlans} Active Plans
              </p>
            </div>
            <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--clr-primary)' }}>
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            background: `linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(34, 197, 94, 0.08) 100%), url('https://images.unsplash.com/photo-1533827432537-70133479f06e?w=600&h=400&fit=crop')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.3
          }} />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div className="stat-info">
              <h3>Monthly Revenue</h3>
              <p className="stat-value">₹{(stats.revenue || 0).toLocaleString()}</p>
              <p className="stat-trend trend-up">
                <TrendingUp size={14} />
                Overall Total
              </p>
            </div>
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--clr-success)' }}>
              <IndianRupee size={24} />
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            background: `linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%), url('https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=400&fit=crop')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.3
          }} />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div className="stat-info">
              <h3>Active Trainers</h3>
              <p className="stat-value">{stats.activeTrainers}</p>
              <p className="text-muted" style={{ fontSize: '0.8rem' }}>On system</p>
            </div>
            <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--clr-secondary)' }}>
              <UserSquare2 size={24} />
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            background: `linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(234, 179, 8, 0.08) 100%), url('https://images.unsplash.com/photo-1517836357463-d25ddfcbf042?w=600&h=400&fit=crop')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.3
          }} />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div className="stat-info">
              <h3>Attendance Today</h3>
              <p className="stat-value">{stats.attendanceToday}</p>
              <p className="text-muted" style={{ fontSize: '0.8rem' }}>Check-ins today</p>
            </div>
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--clr-warning)' }}>
              <CalendarCheck size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="glass-panel" style={{ padding: '1.5rem', minHeight: '350px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Revenue Analytics (Last 7 Days)</h3>
          </div>
          {/* Chart Placeholder */}
          <div style={{ height: '250px', display: 'flex', alignItems: 'flex-end', gap: '1rem', paddingBottom: '1rem' }}>
            {stats.revenueAnalytics?.length > 0 ? (
              stats.revenueAnalytics.map((day: any, i: number) => (
                <div key={i} style={{ 
                  flex: 1, 
                  height: `${(day.total / maxRevenue) * 100}%`, 
                  background: 'var(--clr-primary)',
                  borderRadius: '8px 8px 0 0',
                  opacity: 0.8,
                  position: 'relative'
                }} title={`${day._id}: ₹${day.total}`}>
                  <span style={{ 
                    position: 'absolute', 
                    bottom: '-25px', 
                    left: '50%', 
                    transform: 'translateX(-50%)', 
                    fontSize: '0.65rem',
                    color: 'var(--clr-text-muted)',
                    whiteSpace: 'nowrap'
                  }}>
                    {day._id?.split('-').slice(1).join('/') || 'Unknown'}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ flex: 1, textAlign: 'center', color: 'var(--clr-text-muted)' }}>No data for the last 7 days</div>
            )}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Recent Activities</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {stats.recentActivities?.length > 0 ? (
              stats.recentActivities.map((activity: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: activity.color, marginTop: '0.4rem' }}></div>
                  <div>
                    <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>{activity.text}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
                      {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>No recent activity found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
