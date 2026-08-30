import React, { useEffect, useState } from 'react';
import { getAttendance, manualCheckIn } from '../features/attendance/attendance.api';
import { getMembers } from '../features/members/members.api';
import { getBranches } from '../features/branches/branches.api';
import { useAuthStore } from '../store/auth.store';
import { Calendar, Plus, Clock, CheckCircle2, XCircle, Save, Search, UserCheck, QrCode, Download, LogOut } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import Modal from '../components/Modal';
import { format } from 'date-fns';

type BranchOption = { _id: string; name: string; branchCode: string; status: string };

const AttendancePage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === 'superadmin';
  const adminBranchCode = user?.branchCode || 'MAIN';

  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [selectedBranchCode, setSelectedBranchCode] = useState<string>('');

  const [attendance, setAttendance] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [formData, setFormData] = useState({ memberId: '' });

  const effectiveBranchCode = isSuperAdmin ? selectedBranchCode : adminBranchCode;

  const qrUrl = `${window.location.origin}/mark-attendance`;
  const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}`;

  useEffect(() => {
    if (isSuperAdmin) {
      getBranches({ limit: 100 }).then(res => {
        const items: BranchOption[] = res.data?.data?.items || [];
        setBranches(items);
        if (items.length > 0 && !selectedBranchCode) {
          const firstActive = items.find(b => b.status === 'active');
          setSelectedBranchCode(firstActive ? firstActive.branchCode : items[0].branchCode);
        }
      }).catch(() => {});
    }
  }, [isSuperAdmin]);

  const fetchAttendance = () => {
    if (isSuperAdmin && !selectedBranchCode) {
      setAttendance([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const params: Record<string, string> = { date: dateFilter };
    if (effectiveBranchCode) params.branchCode = effectiveBranchCode;
    if (debouncedSearch) params.search = debouncedSearch;
    getAttendance(params)
      .then((res) => {
        const data = res.data?.data;
        setAttendance(Array.isArray(data) ? data : (data?.items || []));
      })
      .catch(() => setAttendance([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAttendance();
  }, [debouncedSearch, dateFilter, effectiveBranchCode]);

  useEffect(() => {
    if (isSuperAdmin && !selectedBranchCode) {
      setMembers([]);
      return;
    }
    const params: { limit: number; branchCode?: string } = { limit: 100 };
    if (effectiveBranchCode) params.branchCode = effectiveBranchCode;
    getMembers(params).then(res => {
      const data = res.data?.data;
      setMembers(Array.isArray(data) ? data : (data?.items || []));
    }).catch(() => setMembers([]));
  }, [effectiveBranchCode, isSuperAdmin, selectedBranchCode]);

  const handleManualAction = async (memberId: string, action: 'check-in' | 'check-out') => {
    setIsSaving(true);
    try {
      const payload: Record<string, string> = { memberId, action };
      if (isSuperAdmin && selectedBranchCode) payload.branchCode = selectedBranchCode;
      await manualCheckIn(payload as { memberId: string; action: 'check-in' | 'check-out' });
      fetchAttendance();
    } catch (error: any) {
      alert(error.response?.data?.message || `Failed to ${action}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.memberId) return alert('Please select a member');
    await handleManualAction(formData.memberId, 'check-in');
    setIsModalOpen(false);
    setFormData({ memberId: '' });
  };

  const stats = {
    present: attendance.filter(a => a.status === 'present' || a.status === 'completed').length,
    completed: attendance.filter(a => a.status === 'completed').length,
    total: attendance.length
  };

  const showBranchSelector = isSuperAdmin;
  const showNoBranchMessage = isSuperAdmin && !selectedBranchCode;

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '2rem', position: 'relative', overflow: 'hidden', borderRadius: '16px' }}>
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          background: `linear-gradient(135deg, rgba(6, 182, 212, 0.7) 0%, rgba(245, 158, 11, 0.7) 100%), url('https://images.unsplash.com/photo-1517836357463-d25ddfcbf042?w=800&h=400&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div className="flex-responsive" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
            <div>
              <h1 style={{ color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>Attendance Tracking</h1>
              <p className="text-muted" style={{ color: 'rgba(255,255,255,0.9)' }}>
                {showBranchSelector
                  ? (selectedBranchCode ? `Branch: ${branches.find(b => b.branchCode === selectedBranchCode)?.name || selectedBranchCode}` : 'Select a branch to view attendance')
                  : `Branch: ${branches.find(b => b.branchCode === adminBranchCode)?.name || adminBranchCode}`
                }
              </p>
            </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => setIsQRModalOpen(true)}>
              <QrCode size={18} />
              View QR Code
            </button>
            <button className="btn btn-secondary" onClick={() => window.open('/mark-attendance', '_blank')}>
              <UserCheck size={18} />
              Open QR Page
            </button>
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} disabled={showNoBranchMessage}>
              <Plus size={18} />
              Mark Attendance
            </button>
          </div>
          </div>
        </div>
      </div>

      {showBranchSelector && (
        <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <label style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Branch:</label>
            <select
              className="form-input"
              style={{ minWidth: '200px', flex: 1, maxWidth: '300px' }}
              value={selectedBranchCode}
              onChange={e => setSelectedBranchCode(e.target.value)}
            >
              <option value="">-- Select Branch --</option>
              {branches.filter(b => b.status === 'active').map(b => (
                <option key={b.branchCode} value={b.branchCode}>{b.name} ({b.branchCode})</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Mark Member Attendance">
        <form onSubmit={handleMarkAttendance}>
          <div className="form-group">
            <label className="form-label">Select Member</label>
            <select 
              className="form-input" 
              required 
              value={formData.memberId}
              onChange={e => setFormData({...formData, memberId: e.target.value})}
            >
              <option value="">-- Select Member --</option>
              {members.map(m => (
                <option key={m._id} value={m._id}>{m.user?.name || m.name || 'Unknown'}</option>
              ))}
            </select>
          </div>
          <div style={{ marginTop: '2rem' }}>
            <button className="btn btn-primary w-full" type="submit" disabled={isSaving}>
              <Save size={18} />
              {isSaving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </form>
      </Modal>

      {/* QR Code Modal */}
      <Modal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} title="Attendance QR Code">
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
            Display this QR code at your gym entrance. Members can scan it to mark their attendance.
          </p>
          <div className="glass-panel" style={{ 
            display: 'inline-block', 
            padding: '1.5rem', 
            background: 'white', 
            borderRadius: '1rem',
            marginBottom: '1.5rem'
          }}>
            <img 
              src={qrImage} 
              alt="Attendance QR" 
              style={{ width: '250px', height: '250px', display: 'block' }} 
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.85rem', wordBreak: 'break-all' }} className="text-primary">
              {qrUrl}
            </p>
            <button 
              className="btn btn-primary" 
              style={{ justifyContent: 'center' }}
              onClick={() => window.open(qrImage, '_blank')}
            >
              <Download size={18} />
              Download / Print QR
            </button>
          </div>
        </div>
      </Modal>

      {showNoBranchMessage ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <p className="text-muted" style={{ fontSize: '1.1rem' }}>Please select a branch above to view attendance.</p>
        </div>
      ) : (
        <>
          <div className="grid-stats">
            <div 
              className="stat-card checkin-bg-card"
              style={{
                backgroundImage: `url('https://res.cloudinary.com/dyc33dchn/image/upload/q_auto/f_auto/v1776523432/ChatGPT_Image_Apr_18_2026_08_12_31_PM_xpfcf7.png')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="stat-info">
                <h3 style={{ color: 'white' }}>Total Check-ins</h3>
                <p className="stat-value" style={{ color: 'white' }}>{stats.total}</p>
                <p className="stat-trend trend-up" style={{ color: '#4ade80' }}>{stats.present} Currently Present</p>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.3)', color: 'var(--clr-success)' }}>
                <CheckCircle2 size={24} />
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-info">
                <h3>Workouts Completed</h3>
                <p className="stat-value">{stats.completed}</p>
                <p className="text-muted">Members checked-out</p>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--clr-secondary)' }}>
                <UserCheck size={24} />
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-info">
                <h3>Active Today</h3>
                <p className="stat-value">{stats.present}</p>
                <p className="text-muted">Members in gym</p>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--clr-warning)' }}>
                <Clock size={24} />
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '2rem' }}>
            <div className="flex-responsive" style={{ marginBottom: '1.5rem', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem' }}>Attendance Log</h3>
              <div className="flex-responsive" style={{ gap: '0.75rem', justifyContent: 'flex-end', width: '100%', maxWidth: '500px' }}>
                <div className="search-bar" style={{ flex: 1, minWidth: '150px', background: 'var(--clr-bg-base)', padding: '0.4rem 0.75rem' }}>
                  <Search size={16} className="text-muted" />
                  <input 
                    placeholder="Search member..." 
                    style={{ fontSize: '0.85rem' }}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <input 
                  type="date" 
                  className="form-input" 
                  style={{ width: 'auto', flexShrink: 0, padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="table-container hide-on-mobile" style={{ margin: 0, borderRadius: '12px', border: '1px solid var(--clr-glass-border)', overflowX: 'auto' }}>
              <table className="data-table" style={{ fontSize: '0.9rem', width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Member Name</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Check-in</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Check-out</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center" style={{ padding: '3rem' }}>
                        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                        Loading log...
                      </td>
                    </tr>
                  ) : attendance.length > 0 ? (
                    attendance.map((entry) => (
                      <tr key={entry._id} style={{ borderBottom: '1px solid var(--clr-glass-border)' }}>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.75rem', flexShrink: 0 }}>
                              {(entry.member?.user?.name || 'U').charAt(0)}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontWeight: '600', marginBottom: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {entry.member?.user?.name || 'Unknown'}
                              </p>
                              <p className="text-muted" style={{ fontSize: '0.7rem', marginBottom: 0 }}>
                                ID: {entry.member?.secretCode}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>{entry.checkIn ? format(new Date(entry.checkIn), 'hh:mm a') : '-'}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{entry.checkOut ? format(new Date(entry.checkOut), 'hh:mm a') : '-'}</td>
                        <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>{entry.date}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className={`status-badge ${entry.status === 'completed' ? 'active' : 'pending'}`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                            {entry.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          {(entry.status === 'present' || entry.status === 'late') && !entry.checkOut && (
                            <button 
                              className="btn btn-secondary btn-icon" 
                              title="Check Out"
                              onClick={() => handleManualAction(entry.member._id, 'check-out')}
                              disabled={isSaving}
                            >
                              <LogOut size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center" style={{ padding: '3rem' }}>
                        <p className="text-muted">No attendance found for this selection.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="mobile-cards-container">
              {loading ? (
                <div className="text-center" style={{ padding: '2rem' }}>
                  <div className="spinner" style={{ margin: '0 auto' }}></div>
                </div>
              ) : attendance.length > 0 ? (
                attendance.map((entry) => (
                  <div key={entry._id} className="mobile-card">
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Member</span>
                      <div className="mobile-card-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end', minWidth: 0 }}>
                        <div className="avatar" style={{ width: '24px', height: '24px', fontSize: '0.65rem', flexShrink: 0 }}>
                          {(entry.member?.user?.name || 'U').charAt(0)}
                        </div>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.member?.user?.name || 'Unknown'}</span>
                      </div>
                    </div>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Check-in</span>
                      <span className="mobile-card-value">{entry.checkIn ? format(new Date(entry.checkIn), 'hh:mm a') : '-'}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Check-out</span>
                      <span className="mobile-card-value">{entry.checkOut ? format(new Date(entry.checkOut), 'hh:mm a') : '-'}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Date</span>
                      <span className="mobile-card-value">{entry.date}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Status</span>
                      <div className="mobile-card-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <span className={`status-badge ${entry.status === 'completed' ? 'active' : 'pending'}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
                          {entry.status}
                        </span>
                        {(entry.status === 'present' || entry.status === 'late') && !entry.checkOut && (
                          <button 
                            className="btn btn-secondary btn-icon" 
                            style={{ width: '28px', height: '28px' }}
                            title="Check Out"
                            onClick={() => handleManualAction(entry.member._id, 'check-out')}
                            disabled={isSaving}
                          >
                            <LogOut size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted" style={{ padding: '2rem' }}>No attendance found.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AttendancePage;
