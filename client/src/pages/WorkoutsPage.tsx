import React, { useEffect, useState } from 'react';
import { Dumbbell, Utensils, Zap, Clock, Plus, Trash2, Search, UserPlus, AlertTriangle, Calendar, CreditCard, FileText, CheckCircle2, LogOut, CalendarCheck, TrendingUp, Award, Download, RefreshCw, UserSquare2, Mail, Phone, Edit2, Building2, X } from 'lucide-react';
import { getWorkoutTemplates, createWorkoutTemplate, updateWorkoutTemplate, deleteWorkoutPlan, applyWorkoutTemplateToBranch, removeWorkoutTemplateFromBranch, assignWorkoutToMember, getMyWorkout } from '../features/workouts/workouts.api';
import { getDietTemplates, createDietTemplate, updateDietTemplate, deleteDietPlan, applyDietTemplateToBranch, removeDietTemplateFromBranch, assignDietToMember, getMyDiet } from '../features/diets/diets.api';
import { getMembers, getMyProfile } from '../features/members/members.api';
import { getBranches } from '../features/branches/branches.api';
import { getPayments } from '../features/payments/payments.api';
import { markAttendance, getMyAttendance, getTodayAttendanceStatus, getMyAttendanceStats, exportMyAttendance } from '../features/attendance/attendance.api';
import { useAuthStore } from '../store/auth.store';
import { useSocket } from '../hooks/useSocket';
import Modal from '../components/Modal';

const formatDuration = (days: number | undefined): string => {
  const d = Number(days);
  if (!Number.isFinite(d) || d <= 0) return "N/A";
  if (d % 365 === 0) {
    const n = d / 365;
    return n === 1 ? "1 Year" : `${n} Years`;
  }
  if (d % 30 === 0) {
    const n = d / 30;
    return n === 1 ? "1 Month" : `${n} Months`;
  }
  return d === 1 ? "1 Day" : `${d} Days`;
};

const MemberView: React.FC = () => {
  const { user } = useAuthStore();
  const [workout, setWorkout] = useState<any>(null);
  const [diet, setDiet] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState('all');
  const [attendanceDateFilter, setAttendanceDateFilter] = useState({ start: '', end: '' });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeSection, setActiveSection] = useState<'overview' | 'attendance'>('overview');

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
      } else {
        console.error("Failed to fetch workout:", wRes.reason);
        setWorkout(null);
      }

      if (dRes.status === 'fulfilled') {
        setDiet(dRes.value?.data?.data ?? null);
      } else {
        console.error("Failed to fetch diet:", dRes.reason);
        setDiet(null);
      }

      if (pRes.status === 'fulfilled') {
        const profileData = pRes.value?.data?.data ?? null;
        setProfile(profileData);
        console.log("Member Dashboard Profile Data:", profileData);
      } else {
        console.error("Failed to fetch profile:", pRes.reason);
        setProfile(null);
      }

      if (payRes.status === 'fulfilled') {
        const paymentData = payRes.value?.data?.data?.items || payRes.value?.data?.data || [];
        setPayments(Array.isArray(paymentData) ? paymentData : []);
      } else {
        console.error("Failed to fetch payments:", payRes.reason);
        setPayments([]);
      }

      if (attRes.status === 'fulfilled') {
        setAttendance(attRes.value?.data?.data?.items || []);
      } else {
        console.error("Failed to fetch attendance:", attRes.reason);
        setAttendance([]);
      }

      if (todayRes.status === 'fulfilled') {
        setTodayAttendance(todayRes.value?.data?.data ?? null);
      } else {
        console.error("Failed to fetch today attendance:", todayRes.reason);
        setTodayAttendance(null);
      }

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value?.data?.data ?? null);
      } else {
        console.error("Failed to fetch stats:", statsRes.reason);
        setStats(null);
      }
    } catch (error) {
      console.error("Unexpected error in fetchData:", error);
    } finally {
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

  const handleMarkAttendance = async (action: 'check-in' | 'check-out') => {
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
    } catch (error: any) {
      alert(error.response?.data?.message || `Failed to ${action}`);
    } finally {
      setMarkingAttendance(false);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
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
    } catch (error) {
      alert("Failed to export attendance data");
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <div className="loading-state"><div className="spinner"></div></div>;

  const workoutDays = Array.isArray(workout?.days) ? workout.days : [];
  const mealItems = (meal: 'breakfast' | 'lunch' | 'dinner' | 'snacks') => {
    const meals = diet?.meals;
    const items = meals && typeof meals === 'object' ? (meals as any)[meal] : undefined;
    return Array.isArray(items) ? items : [];
  };

  const getDaysRemaining = () => {
    if (!profile?.membershipExpiryDate) return null;
    const expiry = new Date(profile.membershipExpiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = getDaysRemaining();
  const isPendingPayment = profile?.paymentStatus === 'pending';

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { class: string; label: string }> = {
      present: { class: 'pending', label: 'In Gym' },
      completed: { class: 'active', label: 'Completed' },
      absent: { class: 'inactive', label: 'Absent' },
      late: { class: 'pending', label: 'Late' },
      'half-day': { class: 'pending', label: 'Half Day' }
    };
    const { class: cls, label } = statusMap[status] || { class: 'pending', label: status };
    return <span className={`status-badge ${cls}`}>{label}</span>;
  };

  const sortedAttendance = [...attendance].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--clr-glass-border)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveSection('overview')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
            background: activeSection === 'overview' ? 'var(--clr-accent-gradient)' : 'transparent',
            color: activeSection === 'overview' ? 'white' : 'var(--clr-text-muted)'
          }}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveSection('attendance')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
            background: activeSection === 'attendance' ? 'var(--clr-accent-gradient)' : 'transparent',
            color: activeSection === 'attendance' ? 'white' : 'var(--clr-text-muted)'
          }}
        >
          My Attendance
        </button>
      </div>

      {activeSection === 'overview' ? (
        <>
          {stats && (
            <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                <TrendingUp size={24} style={{ color: 'var(--clr-success)', marginBottom: '0.5rem' }} />
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.presentDays || 0}</h3>
                <p className="text-muted" style={{ fontSize: '0.75rem' }}>Total Sessions</p>
              </div>
              <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                <Award size={24} style={{ color: 'var(--clr-primary)', marginBottom: '0.5rem' }} />
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.attendanceRate || 0}%</h3>
                <p className="text-muted" style={{ fontSize: '0.75rem' }}>Attendance Rate</p>
              </div>
              <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                <CalendarCheck size={24} style={{ color: '#f59e0b', marginBottom: '0.5rem' }} />
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.currentStreak || 0}</h3>
                <p className="text-muted" style={{ fontSize: '0.75rem' }}>Current Streak</p>
              </div>
              <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                <Clock size={24} style={{ color: 'var(--clr-secondary)', marginBottom: '0.5rem' }} />
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.avgCheckInTime || 'N/A'}</h3>
                <p className="text-muted" style={{ fontSize: '0.75rem' }}>Avg Check-In</p>
              </div>
            </div>
          )}

          <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {/* Active Plan Section */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--clr-primary)', width: '40px', height: '40px' }}>
                  <Zap size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.1rem' }}>My Active Plan</h2>
                  <p className="text-muted" style={{ fontSize: '0.75rem' }}>Current Subscription</p>
                </div>
              </div>

              {profile?.currentPlan ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--clr-primary)' }}>{profile.currentPlan.name}</h3>
                    <span className={`status-badge ${profile.isActivePlan ? 'active' : 'pending'}`}>
                      {profile.isActivePlan ? 'Active' : 'Pending Activation'}
                    </span>
                  </div>
                  
                  <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <p className="text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</p>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{formatDuration(profile.currentPlan.duration)}</p>
                      </div>
                      <div>
                        <p className="text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</p>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>₹{profile.currentPlan.price}</p>
                      </div>
                      <div>
                        <p className="text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Start Date</p>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          {profile.membershipStartDate ? new Date(profile.membershipStartDate).toLocaleDateString('en-IN') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expiry Date</p>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem', color: daysRemaining !== null && daysRemaining <= 5 ? 'var(--clr-danger)' : 'inherit' }}>
                          {profile.membershipExpiryDate ? new Date(profile.membershipExpiryDate).toLocaleDateString('en-IN') : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {profile.currentPlan.features?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {profile.currentPlan.features.map((f: string, i: number) => (
                        <span key={i} style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.6rem', borderRadius: '20px', border: '1px solid var(--clr-glass-border)' }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <AlertTriangle size={32} style={{ color: 'var(--clr-warning)', opacity: 0.5, marginBottom: '0.5rem' }} />
                  <p className="text-muted">No active plan assigned.</p>
                  <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Please contact admin to subscribe.</p>
                </div>
              )}
            </div>

            {/* My Trainer Section */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--clr-secondary)', width: '40px', height: '40px' }}>
                  <UserSquare2 size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.1rem' }}>My Trainer</h2>
                  <p className="text-muted" style={{ fontSize: '0.75rem' }}>Personal Coach</p>
                </div>
              </div>

              {profile?.trainer ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="avatar" style={{ width: '50px', height: '50px', fontSize: '1.25rem' }}>
                      {profile.trainer.name?.charAt(0) || profile.trainer.user?.name?.charAt(0) || 'T'}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{profile.trainer.name || profile.trainer.user?.name || 'Unknown Trainer'}</h3>
                      <p style={{ color: 'var(--clr-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>{profile.trainer.specialty || 'Personal Trainer'}</p>
                    </div>
                  </div>

                  <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Mail size={14} className="text-muted" />
                      <span style={{ fontSize: '0.85rem' }}>{profile.trainer.email || profile.trainer.user?.email || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Phone size={14} className="text-muted" />
                      <span style={{ fontSize: '0.85rem' }}>{profile.trainer.phone || profile.trainer.user?.phone || 'N/A'}</span>
                    </div>
                  </div>

                  <button className="btn btn-secondary w-full" style={{ fontSize: '0.85rem', gap: '0.5rem' }}>
                    <Mail size={16} />
                    Message Trainer
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                  <UserPlus size={32} style={{ color: 'var(--clr-secondary)', opacity: 0.5, marginBottom: '0.5rem' }} />
                  <p className="text-muted">No trainer assigned yet.</p>
                  <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Contact admin to get a personal coach.</p>
                </div>
              )}
            </div>
          </div>

          {(isPendingPayment || (daysRemaining !== null && daysRemaining <= 5)) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {isPendingPayment && (
                <div className="glass-panel" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <AlertTriangle style={{ color: '#fbbf24' }} size={24} />
                    <div>
                      <h4 style={{ color: '#fbbf24', fontSize: '1rem' }}>Payment Pending</h4>
                      <p className="text-muted" style={{ fontSize: '0.85rem' }}>Clear dues to avoid service interruption</p>
                    </div>
                  </div>
                  <button className="btn btn-warning" style={{ fontSize: '0.85rem' }}>Pay</button>
                </div>
              )}
              {daysRemaining !== null && daysRemaining <= 5 && !isPendingPayment && (
                <div className="glass-panel" style={{ background: daysRemaining <= 0 ? 'rgba(244, 63, 94, 0.1)' : 'rgba(139, 92, 246, 0.1)', border: `1px solid ${daysRemaining <= 0 ? 'rgba(244, 63, 94, 0.3)' : 'rgba(139, 92, 246, 0.3)'}`, padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Clock size={24} style={{ color: daysRemaining <= 0 ? 'var(--clr-danger)' : 'var(--clr-primary)' }} />
                    <div>
                      <h4 style={{ color: daysRemaining <= 0 ? '#fb7185' : '#a78bfa', fontSize: '1rem' }}>{daysRemaining <= 0 ? 'Subscription Expired' : 'Expiring Soon'}</h4>
                      <p className="text-muted" style={{ fontSize: '0.85rem' }}>{Math.abs(daysRemaining)} days {daysRemaining <= 0 ? 'overdue' : 'remaining'}</p>
                    </div>
                  </div>
                  <button className="btn btn-primary" style={{ fontSize: '0.85rem' }}>Renew</button>
                </div>
              )}
            </div>
          )}

          <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: 'var(--sp-lg)', height: 'fit-content', minHeight: '300px', background: `linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%), url('https://res.cloudinary.com/dyc33dchn/image/upload/q_auto/f_auto/v1776538385/7d99dccaaae76516dc722f79811cde9b_sr3iqo.jpg')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundBlendMode: 'overlay' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--clr-primary)', width: '40px', height: '40px', flexShrink: 0 }}>
                  <Dumbbell size={20} />
                </div>
                <h2 style={{ fontSize: '1.25rem' }}>My Workout Plan</h2>
              </div>
              {!workout ? <p className="text-muted">No workout assigned yet.</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h3 style={{ marginBottom: '0.5rem', color: 'var(--clr-text-main)' }}>{workout.name}</h3>
                  {workoutDays.map((day: any, i: number) => (
                    <div key={i} className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                      <h4 style={{ color: 'var(--clr-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--clr-glass-border)', paddingBottom: '0.5rem' }}>{day.dayName}</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {(Array.isArray(day?.exercises) ? day.exercises : []).map((ex: any, j: number) => (
                          <div key={j} style={{ padding: '0.75rem', borderBottom: '1px solid var(--clr-glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem', wordBreak: 'break-word' }}>{ex.name}</p>
                              <p className="text-muted" style={{ fontSize: '0.75rem' }}>Rest: {ex.rest}</p>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--clr-primary)' }}>{ex.sets} × {ex.reps}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-panel" style={{ position: 'relative', padding: 'var(--sp-lg)', height: 'fit-content', minHeight: '300px', background: `url('https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=500&h=300&fit=crop')`, backgroundSize: 'cover', backgroundPosition: 'center', color: '#fff', overflow: 'hidden' }}>
              {/* Darker overlay for better readability */}
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 0, borderRadius: 'inherit' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#fff', width: '40px', height: '40px', flexShrink: 0 }}>
                    <Utensils size={20} />
                  </div>
                  <h2 style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 800 }}>My Diet Plan</h2>
                </div>
                {!diet ? <p className="text-muted" style={{ color: '#e5e7eb' }}>No diet assigned yet.</p> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <h3 style={{ color: '#fff', margin: 0 }}>{diet.name}</h3>
                      <span className="status-badge active" style={{ fontSize: '0.8rem', background: 'var(--clr-success)', color: '#fff', fontWeight: 700 }}>{diet.calories} kcal</span>
                    </div>
                    {(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map((meal) => (
                      <div key={meal} className="glass-panel" style={{ padding: '1.25rem', background: '#ffffff', color: '#111827', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                        <h4 style={{ textTransform: 'capitalize', marginBottom: '1rem', color: '#059669', borderBottom: '2px solid #ecfdf5', paddingBottom: '0.5rem', fontWeight: 800, fontSize: '1.1rem' }}>{meal}</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {mealItems(meal).map((item: any, i: number) => (
                            <div key={i} style={{ padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                              <p style={{ fontSize: '0.95rem', wordBreak: 'break-word', color: '#374151', fontWeight: 600 }}>{item.foodName}</p>
                              <p style={{ fontSize: '0.9rem', textAlign: 'right', flexShrink: 0, color: '#6b7280', fontWeight: 500 }}>{item.quantity}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: 'var(--sp-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--clr-warning)', width: '40px', height: '40px' }}>
                <CreditCard size={20} />
              </div>
              <h2 style={{ fontSize: '1.25rem' }}>Payment History</h2>
            </div>
            {payments.length === 0 ? (
              <p className="text-muted">No payment records found.</p>
            ) : (
              <div className="table-container" style={{ marginTop: 0, border: 'none', background: 'transparent' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Plan</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((pay: any) => (
                      <tr key={pay._id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{pay.plan?.name || 'Manual Payment'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>INV-{pay._id.slice(-6).toUpperCase()}</div>
                        </td>
                        <td><span style={{ fontWeight: 700 }}>₹{pay.amount}</span></td>
                        <td>{new Date(pay.date || pay.createdAt).toLocaleDateString('en-IN')}</td>
                        <td>
                          <span className={`status-badge ${pay.status === 'paid' ? 'active' : pay.status === 'pending' ? 'pending' : 'inactive'}`}>
                            {pay.status}
                          </span>
                        </td>
                        <td>
                          <button className="btn-icon" title="View Invoice">
                            <FileText size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="glass-panel" style={{ padding: 'var(--sp-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--clr-secondary)', width: '40px', height: '40px' }}>
                <CalendarCheck size={20} />
              </div>
              <h2 style={{ fontSize: '1.25rem' }}>Attendance History</h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--clr-bg-base)', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--clr-glass-border)' }}>
                <input
                  type="date"
                  value={attendanceDateFilter.start}
                  onChange={(e) => setAttendanceDateFilter(prev => ({ ...prev, start: e.target.value }))}
                  style={{ background: 'transparent', border: 'none', color: 'var(--clr-text-main)', fontSize: '0.8rem', outline: 'none', colorScheme: 'dark' }}
                />
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>to</span>
                <input
                  type="date"
                  value={attendanceDateFilter.end}
                  onChange={(e) => setAttendanceDateFilter(prev => ({ ...prev, end: e.target.value }))}
                  style={{ background: 'transparent', border: 'none', color: 'var(--clr-text-main)', fontSize: '0.8rem', outline: 'none', colorScheme: 'dark' }}
                />
              </div>

              <select
                className="filter-select"
                style={{ background: 'var(--clr-bg-base)', border: '1px solid var(--clr-glass-border)', color: 'var(--clr-text-main)', padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}
                value={attendanceStatusFilter}
                onChange={(e) => setAttendanceStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="present">In Gym</option>
                <option value="completed">Completed</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="half-day">Half Day</option>
              </select>

              <button
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.75rem', gap: '0.5rem', fontSize: '0.8rem' }}
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              >
                <RefreshCw size={14} />
                {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
              </button>

              <button
                className="btn btn-primary"
                style={{ padding: '0.4rem 0.75rem', gap: '0.5rem', fontSize: '0.8rem' }}
                onClick={() => handleExport('csv')}
                disabled={exporting}
              >
                <Download size={14} />
                {exporting ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>
          </div>

          {sortedAttendance.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <CalendarCheck size={48} style={{ color: 'var(--clr-text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
              <p className="text-muted">No attendance records found.</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginTop: '0.5rem' }}>Start by checking in today!</p>
            </div>
          ) : (
            <div className="table-container" style={{ marginTop: 0, border: 'none', background: 'transparent' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAttendance.map((record: any) => {
                    const checkInDate = new Date(record.checkIn);
                    const checkOutDate = record.checkOut ? new Date(record.checkOut) : null;
                    const durationMs = checkOutDate ? checkOutDate.getTime() - checkInDate.getTime() : null;
                    const durationStr = durationMs ? `${Math.floor(durationMs / 60000)} min` : '-';
                    return (
                      <tr key={record._id}>
                        <td style={{ fontWeight: 600 }}>{new Date(record.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td>{checkInDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>{checkOutDate ? checkOutDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                        <td>{durationStr}</td>
                        <td>{getStatusBadge(record.status)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const DEFAULT_WORKOUT_FORM = {
  name: '',
  goal: 'General Fitness',
  difficulty: 'Beginner',
  days: [{ dayName: 'Day 1', exercises: [{ name: '', sets: 3, reps: '12', rest: '60s' }] }]
};

const DEFAULT_DIET_FORM = {
  name: '',
  goal: 'Maintenance',
  calories: 2000,
  meals: {
    breakfast: [{ foodName: '', quantity: '', calories: 0 }],
    lunch: [{ foodName: '', quantity: '', calories: 0 }],
    dinner: [{ foodName: '', quantity: '', calories: 0 }],
    snacks: [{ foodName: '', quantity: '', calories: 0 }]
  }
};

const WorkoutsPage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isTrainer = user?.role === 'trainer';
  const isSuperAdmin = user?.role === 'superadmin';
  const adminBranchCode = user?.branchCode || 'MAIN';

  const [branches, setBranches] = useState<{ _id: string; name: string; branchCode: string; status: string }[]>([]);
  const [selectedBranchCode, setSelectedBranchCode] = useState<string>('');
  const effectiveBranchCode = isSuperAdmin ? selectedBranchCode : adminBranchCode;

  const [activeTab, setActiveTab] = useState<'workouts' | 'diets'>('workouts');
  const [workoutTemplates, setWorkoutTemplates] = useState<any[]>([]);
  const [dietTemplates, setDietTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [isDietModalOpen, setIsDietModalOpen] = useState(false);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [editingDietId, setEditingDietId] = useState<string | null>(null);
  const [selectedCreateBranches, setSelectedCreateBranches] = useState<string[]>([]);

  const [isApplyBranchModalOpen, setIsApplyBranchModalOpen] = useState(false);
  const [selectedTemplateForBranch, setSelectedTemplateForBranch] = useState<{ id: string, type: 'workout' | 'diet', name: string } | null>(null);
  const [selectedApplyBranchCode, setSelectedApplyBranchCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTemplateForAssign, setSelectedTemplateForAssign] = useState<{ id: string, type: 'workout' | 'diet', name: string } | null>(null);

  const [members, setMembers] = useState<any[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const [workoutForm, setWorkoutForm] = useState(DEFAULT_WORKOUT_FORM);
  const [dietForm, setDietForm] = useState(DEFAULT_DIET_FORM);

  useEffect(() => {
    if (isSuperAdmin) {
      getBranches({ limit: 100 }).then(res => {
        const items = res.data?.data?.items || [];
        setBranches(items);
      }).catch(() => {});
    }
  }, [isSuperAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const branchQuery = isSuperAdmin ? (selectedBranchCode || undefined) : undefined;
      const [wRes, dRes] = await Promise.allSettled([
        getWorkoutTemplates(branchQuery),
        getDietTemplates(branchQuery)
      ]);

      if (wRes.status === 'fulfilled') {
        setWorkoutTemplates(wRes.value.data?.data || []);
      } else {
        console.error("Failed to fetch workout templates", wRes.reason);
        setWorkoutTemplates([]);
      }

      if (dRes.status === 'fulfilled') {
        setDietTemplates(dRes.value.data?.data || []);
      } else {
        console.error("Failed to fetch diet templates", dRes.reason);
        setDietTemplates([]);
      }
    } catch (error) {
      console.error("Unexpected error in fetchData", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin || isTrainer) {
      fetchData();
    }
  }, [isAdmin, isTrainer, isSuperAdmin, selectedBranchCode]);

  useEffect(() => {
    if (isAssignModalOpen) {
      getMembers({ search: memberSearch, limit: 10, branchCode: effectiveBranchCode }).then(res => {
        setMembers(res.data.data.items);
      });
    }
  }, [isAssignModalOpen, memberSearch, isSuperAdmin, selectedBranchCode, effectiveBranchCode]);

  const toggleCreateBranch = (code: string, checked: boolean) => {
    setSelectedCreateBranches(prev => checked ? [...prev, code] : prev.filter(c => c !== code));
  };

  const handleOpenCreateWorkout = () => {
    setEditingWorkoutId(null);
    setWorkoutForm(DEFAULT_WORKOUT_FORM);
    setSelectedCreateBranches(selectedBranchCode ? [selectedBranchCode] : []);
    setIsWorkoutModalOpen(true);
  };

  const handleOpenEditWorkout = (t: any) => {
    setEditingWorkoutId(t._id);
    setWorkoutForm({
      name: t.name || '',
      goal: t.goal || 'General Fitness',
      difficulty: t.difficulty || 'Beginner',
      days: t.days?.length ? t.days : DEFAULT_WORKOUT_FORM.days
    });
    setSelectedCreateBranches([]);
    setIsWorkoutModalOpen(true);
  };

  const handleOpenCreateDiet = () => {
    setEditingDietId(null);
    setDietForm(DEFAULT_DIET_FORM);
    setSelectedCreateBranches(selectedBranchCode ? [selectedBranchCode] : []);
    setIsDietModalOpen(true);
  };

  const handleOpenEditDiet = (t: any) => {
    setEditingDietId(t._id);
    setDietForm({
      name: t.name || '',
      goal: t.goal || 'Maintenance',
      calories: t.calories ?? 2000,
      meals: t.meals && t.meals.breakfast ? t.meals : DEFAULT_DIET_FORM.meals
    });
    setSelectedCreateBranches([]);
    setIsDietModalOpen(true);
  };

  const handleCreateWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkoutId && selectedCreateBranches.length === 0) {
      alert("Please select at least one branch.");
      return;
    }
    try {
      const payload = { ...workoutForm, branches: selectedCreateBranches };
      if (editingWorkoutId) {
        await updateWorkoutTemplate(editingWorkoutId, { name: workoutForm.name, goal: workoutForm.goal, difficulty: workoutForm.difficulty, days: workoutForm.days });
      } else {
        await createWorkoutTemplate(payload);
      }
      setIsWorkoutModalOpen(false);
      setEditingWorkoutId(null);
      setWorkoutForm(DEFAULT_WORKOUT_FORM);
      fetchData();
    } catch (error) {
      alert("Failed to save workout template");
    }
  };

  const handleCreateDiet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDietId && selectedCreateBranches.length === 0) {
      alert("Please select at least one branch.");
      return;
    }
    const { errors, meals } = validateDietForm(dietForm);
    if (errors.length) {
      alert(errors.join('\n'));
      return;
    }
    try {
      const payload = { ...dietForm, meals, branches: editingDietId ? undefined : selectedCreateBranches };
      if (editingDietId) {
        await updateDietTemplate(editingDietId, { name: dietForm.name, goal: dietForm.goal, calories: dietForm.calories, meals });
      } else {
        await createDietTemplate(payload);
      }
      setIsDietModalOpen(false);
      setEditingDietId(null);
      setDietForm(DEFAULT_DIET_FORM);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to save diet template");
    }
  };

  const handleAssign = async (memberId: string) => {
    if (!selectedTemplateForAssign) return;
    setIsAssigning(true);
    try {
      if (selectedTemplateForAssign.type === 'workout') {
        await assignWorkoutToMember({ memberId, templateId: selectedTemplateForAssign.id });
      } else {
        await assignDietToMember({ memberId, templateId: selectedTemplateForAssign.id });
      }
      alert("Template assigned successfully!");
      setIsAssignModalOpen(false);
    } catch (error) {
      alert("Failed to assign template");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleOpenApplyBranch = (t: any, type: 'workout' | 'diet') => {
    setSelectedTemplateForBranch({ id: t._id, type, name: t.name });
    setSelectedApplyBranchCode('');
    setIsApplyBranchModalOpen(true);
  };

  const handleApplyToBranch = async () => {
    if (!selectedTemplateForBranch || !selectedApplyBranchCode) return;
    setIsApplying(true);
    try {
      if (selectedTemplateForBranch.type === 'workout') {
        await applyWorkoutTemplateToBranch(selectedTemplateForBranch.id, selectedApplyBranchCode);
      } else {
        await applyDietTemplateToBranch(selectedTemplateForBranch.id, selectedApplyBranchCode);
      }
      setIsApplyBranchModalOpen(false);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to apply template to branch');
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveFromBranch = async (t: any, type: 'workout' | 'diet', branchCode: string) => {
    if (!window.confirm(`Remove "${t.name}" from branch ${branchCode}?`)) return;
    try {
      if (type === 'workout') {
        await removeWorkoutTemplateFromBranch(t._id, branchCode);
      } else {
        await removeDietTemplateFromBranch(t._id, branchCode);
      }
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to remove template from branch');
    }
  };

  const handleDeleteTemplate = async (t: any, type: 'workout' | 'diet') => {
    if (!window.confirm(`Delete the template "${t.name}"? This removes it for ALL branches.`)) return;
    try {
      if (type === 'workout') {
        await deleteWorkoutPlan(t._id);
      } else {
        await deleteDietPlan(t._id);
      }
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete template');
    }
  };

  const addWorkoutDay = () => {
    setWorkoutForm({
      ...workoutForm,
      days: [...workoutForm.days, { dayName: `Day ${workoutForm.days.length + 1}`, exercises: [{ name: '', sets: 3, reps: '12', rest: '60s' }] }]
    });
  };

  const addExercise = (dayIndex: number) => {
    const newDays = [...workoutForm.days];
    newDays[dayIndex].exercises.push({ name: '', sets: 3, reps: '12', rest: '60s' });
    setWorkoutForm({ ...workoutForm, days: newDays });
  };

  const addMealItem = (meal: keyof typeof dietForm.meals) => {
    setDietForm({
      ...dietForm,
      meals: {
        ...dietForm.meals,
        [meal]: [...dietForm.meals[meal], { foodName: '', quantity: '', calories: 0 }]
      }
    });
  };

  const validateDietForm = (form: typeof dietForm) => {
    const errors: string[] = [];
    if (!form.name.trim()) errors.push('Plan name is required.');
    if (!Number.isFinite(Number(form.calories))) errors.push('Calories must be a valid number.');

    const sanitized: { [k: string]: { foodName: string; quantity: string; calories: number }[] } = {};
    let hasAnyMeal = false;
    const labels: { [k: string]: string } = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snacks: 'Snacks' };

    (Object.keys(form.meals) as (keyof typeof form.meals)[]).forEach((meal) => {
      const kept: { foodName: string; quantity: string; calories: number }[] = [];
      form.meals[meal].forEach((item) => {
        const fn = (item.foodName || '').trim();
        const qty = (item.quantity || '').trim();
        if (!fn && !qty && (item.calories === 0 || item.calories === undefined || item.calories === null)) {
          return; // completely empty placeholder row -> drop
        }
        if (!fn && qty) errors.push(`${labels[meal]}: please enter a food name.`);
        if (fn && !qty) errors.push(`${labels[meal]} (${fn}): please enter a quantity.`);
        if (fn && qty && !Number.isFinite(Number(item.calories))) errors.push(`${labels[meal]} (${fn}): calories must be a valid number.`);
        kept.push({ foodName: fn, quantity: qty, calories: Number.isFinite(Number(item.calories)) ? Number(item.calories) : 0 });
      });
      sanitized[meal] = kept;
      if (kept.length) hasAnyMeal = true;
    });

    if (!editingDietId && !hasAnyMeal) errors.push('Please add at least one meal item with food name and quantity.');

    return { errors, meals: sanitized };
  };

  if (!user) {
    return <div className="loading-state"><div className="spinner"></div></div>;
  }

  if (user.role === 'member') {
    return <MemberView />;
  }

  const activeBranches = branches.filter(b => b.status === 'active');

  const renderBranchesApplied = (t: any, type: 'workout' | 'diet') => (
    <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
      <p className="text-muted" style={{ fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
        Applied Branches
      </p>
      {(t.appliedBranches || []).length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {(t.appliedBranches || []).sort().map((bc: string) => (
            <span key={bc} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.75rem',
              padding: '0.2rem 0.6rem',
              borderRadius: '12px',
              background: 'rgba(139, 92, 246, 0.12)',
              color: 'var(--clr-primary)'
            }}>
              <Building2 size={10} /> {bc}
              {isSuperAdmin && (
                <span
                  onClick={(e) => { e.stopPropagation(); handleRemoveFromBranch(t, type, bc); }}
                  title={`Remove from ${bc}`}
                  style={{ cursor: 'pointer', display: 'inline-flex' }}
                >
                  <X size={12} style={{ opacity: 0.7, marginLeft: '0.15rem' }} />
                </span>
              )}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-muted" style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>None</p>
      )}
    </div>
  );

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Workout & Diet Library</h1>
            <p className="text-muted">
              {isSuperAdmin
                ? 'Create reusable templates once, then apply them to any branch.'
                : 'Use the templates Super Admin has applied to your branch.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {activeTab === 'workouts' ? (
              isSuperAdmin && <button className="btn btn-primary" onClick={handleOpenCreateWorkout}>
                <Plus size={18} /> Create Workout
              </button>
            ) : (
              isSuperAdmin && <button className="btn btn-primary" onClick={handleOpenCreateDiet}>
                <Plus size={18} /> Create Diet
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '0.5rem', marginBottom: '2rem', display: 'inline-flex', gap: '0.5rem' }}>
        <button
          className={`btn ${activeTab === 'workouts' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('workouts')}
        >
          <Dumbbell size={18} /> Workouts
        </button>
        <button
          className={`btn ${activeTab === 'diets' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('diets')}
        >
          <Utensils size={18} /> Diet Plans
        </button>
      </div>

      {isSuperAdmin && (
        <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Filter by Branch:</label>
          <select
            className="form-input"
            style={{ maxWidth: '280px' }}
            value={selectedBranchCode}
            onChange={(e) => setSelectedBranchCode(e.target.value)}
          >
            <option value="">All branches</option>
            {branches.map((b) => (
              <option key={b.branchCode} value={b.branchCode}>{b.name} ({b.branchCode})</option>
            ))}
          </select>
        </div>
      )}

      {!isSuperAdmin && (isAdmin || isTrainer) && (
        <div className="glass-panel" style={{ padding: '0.75rem 1rem', marginBottom: '1.5rem', background: 'rgba(139, 92, 246, 0.06)', border: '1px solid rgba(139, 92, 246, 0.2)', fontSize: '0.85rem' }}>
          You can only see and use templates that Super Admin has applied to your branch ({adminBranchCode}).
        </div>
      )}

      {loading ? (
        <div className="loading-state"><div className="spinner"></div></div>
      ) : (
        <div className="grid-cards">
          {activeTab === 'workouts' ? (
            workoutTemplates.length > 0 ? (
              workoutTemplates.map((t) => (
                <div key={t._id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: 'fit-content', minHeight: '280px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'flex-start', gap: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--clr-text-main)', wordBreak: 'break-word' }}>{t.name}</h3>
                    <span className="status-badge active" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', flexShrink: 0 }}>{t.difficulty}</span>
                  </div>
                  <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>Goal: {t.goal}</p>

                  {isSuperAdmin && renderBranchesApplied(t, 'workout')}

                  <div style={{ flex: 1, marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--clr-primary)', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: '600' }}>
                      <Zap size={14} /> {t.days?.length} Days Training
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '8px' }}>
                      {t.days?.map((day: any, idx: number) => (
                        <div key={idx} style={{ borderLeft: '2px solid var(--clr-primary)', paddingLeft: '0.75rem' }}>
                          <p style={{ fontWeight: '700', color: 'var(--clr-text-main)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>{day.dayName}</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            {day.exercises?.map((ex: any, exIdx: number) => (
                              <div key={exIdx} style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                                <span style={{ wordBreak: 'break-word' }}>{ex.name}</span>
                                <span style={{ fontWeight: '600', flexShrink: 0 }}>{ex.sets}×{ex.reps}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--clr-glass-border)' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary flex-1" style={{ fontSize: '0.85rem', padding: '0.5rem' }} onClick={() => {
                        setSelectedTemplateForAssign({ id: t._id, type: 'workout', name: t.name });
                        setIsAssignModalOpen(true);
                      }}>
                        <UserPlus size={16} /> Assign
                      </button>
                      {isSuperAdmin && (
                        <>
                          <button className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }} title="Apply to branch"
                            onClick={() => handleOpenApplyBranch(t, 'workout')}>
                            <Building2 size={16} />
                          </button>
                          <button className="btn btn-icon" style={{ width: '36px', height: '36px' }} title="Edit template"
                            onClick={() => handleOpenEditWorkout(t)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="btn btn-icon danger" style={{ width: '36px', height: '36px' }} title="Delete template"
                            onClick={() => handleDeleteTemplate(t, 'workout')}>
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center' }}>
                <Dumbbell size={48} className="text-muted" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p className="text-muted">
                  {isSuperAdmin
                    ? 'No workout templates found. Create your first one!'
                    : 'No workout templates are available for your branch yet. Ask Super Admin to apply one.'}
                </p>
              </div>
            )
          ) : (
            dietTemplates.length > 0 ? (
              dietTemplates.map((t) => (
                <div key={t._id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: 'fit-content', minHeight: '280px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'flex-start', gap: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--clr-text-main)', wordBreak: 'break-word' }}>{t.name}</h3>
                    <span className="status-badge active" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', flexShrink: 0 }}>{t.goal}</span>
                  </div>
                  <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>Target: {t.calories} kcal</p>

                  {isSuperAdmin && renderBranchesApplied(t, 'diet')}

                  <div style={{ flex: 1, marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--clr-success)', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: '600' }}>
                      <Utensils size={14} /> Meal Breakdown
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '8px' }}>
                      {(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map((meal) => (
                        t.meals?.[meal]?.length > 0 && (
                          <div key={meal} style={{ borderLeft: '2px solid var(--clr-success)', paddingLeft: '0.75rem' }}>
                            <p style={{ fontWeight: '700', color: 'var(--clr-text-main)', fontSize: '0.8rem', marginBottom: '0.25rem', textTransform: 'capitalize' }}>{meal}</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              {t.meals[meal].map((item: any, itemIdx: number) => (
                                <div key={itemIdx} style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                                  <span style={{ wordBreak: 'break-word' }}>{item.foodName}</span>
                                  <span style={{ flexShrink: 0 }}>{item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--clr-glass-border)' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary flex-1" style={{ fontSize: '0.85rem', padding: '0.5rem' }} onClick={() => {
                        setSelectedTemplateForAssign({ id: t._id, type: 'diet', name: t.name });
                        setIsAssignModalOpen(true);
                      }}>
                        <UserPlus size={16} /> Assign
                      </button>
                      {isSuperAdmin && (
                        <>
                          <button className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }} title="Apply to branch"
                            onClick={() => handleOpenApplyBranch(t, 'diet')}>
                            <Building2 size={16} />
                          </button>
                          <button className="btn btn-icon" style={{ width: '36px', height: '36px' }} title="Edit template"
                            onClick={() => handleOpenEditDiet(t)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="btn btn-icon danger" style={{ width: '36px', height: '36px' }} title="Delete template"
                            onClick={() => handleDeleteTemplate(t, 'diet')}>
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center' }}>
                <Utensils size={48} className="text-muted" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p className="text-muted">
                  {isSuperAdmin
                    ? 'No diet plans found. Create your first one!'
                    : 'No diet plans are available for your branch yet. Ask Super Admin to apply one.'}
                </p>
              </div>
            )
          )}
        </div>
      )}

      <Modal isOpen={isWorkoutModalOpen} onClose={() => setIsWorkoutModalOpen(false)} title={editingWorkoutId ? 'Edit Workout Template' : 'Create Workout Template'}>
        <form onSubmit={handleCreateWorkout} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ flex: 1 }}>
            <div className="form-group">
              <label className="form-label">Plan Name</label>
              <input className="form-input" required value={workoutForm.name} onChange={e => setWorkoutForm({...workoutForm, name: e.target.value})} placeholder="e.g. 5-Day Muscle Builder" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Goal</label>
                <select className="form-input" value={workoutForm.goal} onChange={e => setWorkoutForm({...workoutForm, goal: e.target.value})}>
                  <option>Fat Loss</option>
                  <option>Muscle Gain</option>
                  <option>Strength</option>
                  <option>General Fitness</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Difficulty</label>
                <select className="form-input" value={workoutForm.difficulty} onChange={e => setWorkoutForm({...workoutForm, difficulty: e.target.value})}>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
            </div>

            {!editingWorkoutId && (
              <div className="form-group">
                <label className="form-label">Apply to branches</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                  {activeBranches.map((b) => (
                    <label key={b.branchCode} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input
                        type="checkbox"
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        checked={selectedCreateBranches.includes(b.branchCode)}
                        onChange={(e) => toggleCreateBranch(b.branchCode, e.target.checked)}
                      />
                      {b.name} ({b.branchCode})
                    </label>
                  ))}
                  {activeBranches.length === 0 && (
                    <p className="text-muted" style={{ fontSize: '0.8rem' }}>No branches available.</p>
                  )}
                </div>
              </div>
            )}

            <div style={{ paddingRight: '0.5rem' }}>
              {workoutForm.days.map((day, dIdx) => (
                <div key={dIdx} className="glass-panel" style={{ padding: '1rem', marginBottom: '1rem' }}>
                  <input
                    className="form-input"
                    style={{ fontWeight: 700, marginBottom: '1rem', background: 'transparent', border: 'none', borderBottom: '1px solid var(--clr-glass-border)', borderRadius: 0 }}
                    value={day.dayName}
                    onChange={e => {
                      const newDays = [...workoutForm.days];
                      newDays[dIdx].dayName = e.target.value;
                      setWorkoutForm({...workoutForm, days: newDays});
                    }}
                  />
                  {day.exercises.map((ex, eIdx) => (
                    <div key={eIdx} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px dashed var(--clr-glass-border)', paddingBottom: '0.5rem' }}>
                      <div className="col-span-full md:col-span-2">
                        <input className="form-input" placeholder="Exercise" value={ex.name} onChange={e => {
                          const newDays = [...workoutForm.days];
                          newDays[dIdx].exercises[eIdx].name = e.target.value;
                          setWorkoutForm({...workoutForm, days: newDays});
                        }} />
                      </div>
                      <input className="form-input" placeholder="Sets" type="number" value={ex.sets} onChange={e => {
                        const newDays = [...workoutForm.days];
                        newDays[dIdx].exercises[eIdx].sets = Number(e.target.value);
                        setWorkoutForm({...workoutForm, days: newDays});
                      }} />
                      <input className="form-input" placeholder="Reps" value={ex.reps} onChange={e => {
                        const newDays = [...workoutForm.days];
                        newDays[dIdx].exercises[eIdx].reps = e.target.value;
                        setWorkoutForm({...workoutForm, days: newDays});
                      }} />
                      <input className="form-input" placeholder="Rest" value={ex.rest} onChange={e => {
                        const newDays = [...workoutForm.days];
                        newDays[dIdx].exercises[eIdx].rest = e.target.value;
                        setWorkoutForm({...workoutForm, days: newDays});
                      }} />
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary w-full" style={{ fontSize: '0.8rem', padding: '0.4rem' }} onClick={() => addExercise(dIdx)}>+ Add Exercise</button>
                </div>
              ))}
            </div>
            <button type="button" className="btn btn-secondary w-full mb-4" onClick={addWorkoutDay}>+ Add Day</button>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--clr-glass-border)', position: 'sticky', bottom: 0, background: 'var(--clr-bg-sidebar)', zIndex: 10 }}>
            <button className="btn btn-primary w-full" type="submit">{editingWorkoutId ? 'Save Changes' : 'Save Template'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDietModalOpen} onClose={() => setIsDietModalOpen(false)} title={editingDietId ? 'Edit Diet Template' : 'Create Diet Template'}>
        <form onSubmit={handleCreateDiet} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ flex: 1 }}>
            <div className="form-group">
              <label className="form-label">Plan Name</label>
              <input className="form-input" required value={dietForm.name} onChange={e => setDietForm({...dietForm, name: e.target.value})} placeholder="e.g. High Protein Cutting" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Goal</label>
                <select className="form-input" value={dietForm.goal} onChange={e => setDietForm({...dietForm, goal: e.target.value})}>
                  <option>Weight Loss</option>
                  <option>Muscle Gain</option>
                  <option>Maintenance</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Calories</label>
                <input className="form-input" type="number" value={dietForm.calories} onChange={e => setDietForm({...dietForm, calories: Number(e.target.value)})} />
              </div>
            </div>

            {!editingDietId && (
              <div className="form-group">
                <label className="form-label">Apply to branches</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                  {activeBranches.map((b) => (
                    <label key={b.branchCode} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input
                        type="checkbox"
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        checked={selectedCreateBranches.includes(b.branchCode)}
                        onChange={(e) => toggleCreateBranch(b.branchCode, e.target.checked)}
                      />
                      {b.name} ({b.branchCode})
                    </label>
                  ))}
                  {activeBranches.length === 0 && (
                    <p className="text-muted" style={{ fontSize: '0.8rem' }}>No branches available.</p>
                  )}
                </div>
              </div>
            )}

            <div style={{ paddingRight: '0.5rem' }}>
              {(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map((meal) => (
                <div key={meal} className="glass-panel" style={{ padding: '1rem', marginBottom: '1rem' }}>
                  <h4 style={{ textTransform: 'capitalize', marginBottom: '1rem' }}>{meal}</h4>
                  {dietForm.meals[meal].map((item, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px dashed var(--clr-glass-border)', paddingBottom: '0.5rem' }}>
                      <div className="col-span-full md:col-span-2">
                        <input className="form-input" placeholder="Food Name" value={item.foodName} onChange={e => {
                          const newMeals = {...dietForm.meals};
                          newMeals[meal][idx].foodName = e.target.value;
                          setDietForm({...dietForm, meals: newMeals});
                        }} />
                      </div>
                      <input className="form-input" placeholder="Qty" value={item.quantity} onChange={e => {
                        const newMeals = {...dietForm.meals};
                        newMeals[meal][idx].quantity = e.target.value;
                        setDietForm({...dietForm, meals: newMeals});
                      }} />
                      <input className="form-input" placeholder="Kcal" type="number" value={item.calories} onChange={e => {
                        const newMeals = {...dietForm.meals};
                        newMeals[meal][idx].calories = Number(e.target.value);
                        setDietForm({...dietForm, meals: newMeals});
                      }} />
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary w-full" style={{ fontSize: '0.8rem', padding: '0.4rem' }} onClick={() => addMealItem(meal)}>+ Add Item</button>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--clr-glass-border)', position: 'sticky', bottom: 0, background: 'var(--clr-bg-sidebar)', zIndex: 10 }}>
            <button className="btn btn-primary w-full" type="submit">{editingDietId ? 'Save Changes' : 'Save Template'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isApplyBranchModalOpen} onClose={() => setIsApplyBranchModalOpen(false)} title={`Apply "${selectedTemplateForBranch?.name}" to Branch`}>
        <div className="form-group">
          <label className="form-label">Select Branch</label>
          <select
            className="form-input"
            value={selectedApplyBranchCode}
            onChange={e => setSelectedApplyBranchCode(e.target.value)}
          >
            <option value="">Select a branch</option>
            {activeBranches.map(b => (
              <option key={b._id} value={b.branchCode}>
                {b.name} ({b.branchCode})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsApplyBranchModalOpen(false)}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={handleApplyToBranch}
            disabled={!selectedApplyBranchCode || isApplying}
          >
            {isApplying ? 'Applying...' : 'Apply'}
          </button>
        </div>
      </Modal>

      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title={`Assign ${selectedTemplateForAssign?.name}`}>
        <div className="form-group">
          <label className="form-label">Search Member</label>
          <div className="search-bar">
            <Search size={18} />
            <input placeholder="Member name or email..." value={memberSearch} onChange={e => setMemberSearch(e.target.value)} />
          </div>
        </div>
        <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '1rem' }}>
          {members.map(m => (
            <div key={m._id} className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', cursor: 'pointer' }} onClick={() => handleAssign(m._id)}>
              <div>
                <p style={{ fontWeight: 600 }}>{m.user?.name}</p>
                <p className="text-muted" style={{ fontSize: '0.8rem' }}>{m.user?.email}</p>
              </div>
              <button className="btn-icon" style={{ background: 'var(--clr-primary)', color: 'white' }} disabled={isAssigning}>
                <Plus size={16} />
              </button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default WorkoutsPage;