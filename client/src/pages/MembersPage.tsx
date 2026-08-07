import React, { useEffect, useState } from 'react';
import { Users, Search, Plus, Filter, MoreVertical, Edit2, Trash2, Shield, Calendar, CreditCard, ChevronRight, Zap, RefreshCw, AlertCircle, Snowflake, PlayCircle, UserX, UserCheck, UserSquare2 } from 'lucide-react';
import { getMembers, createMember, deleteMember, assignPlan, renewPlan, cancelPlan, freezePlan, resumePlan, approveMember, updateMember } from '../features/members/members.api';
import { getPlans } from '../features/plans/plans.api';
import { getTrainers } from '../features/trainers/trainers.api';
import { recordPayment } from '../features/payments/payments.api';
import { useDebounce } from '../hooks/useDebounce';
import { useAuthStore } from '../store/auth.store';
import Modal from '../components/Modal';

const MembersPage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isTrainer = user?.role === 'trainer';

  const [members, setMembers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    password: 'Password123',
    planId: '',
    trainerId: '',
    branchCode: 'MAIN'
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    trainerId: ''
  });
  const [subFormData, setSubFormData] = useState({
    planId: '',
    amount: 0,
    note: '',
    recordPayment: true
  });

  const fetchMembers = async (search = '', status = 'all') => {
    setLoading(true);
    try {
      const params: any = { search, limit: 100 };
      if (status !== 'all') params.status = status;
      const res = await getMembers(params);
      setMembers(res.data?.data?.items || []);
    } catch (error) {
      console.error('Failed to fetch members', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await getPlans();
      const planData = res.data?.data;
      setPlans(Array.isArray(planData) ? planData : (planData?.items || []));
    } catch (error) {
      console.error('Failed to fetch plans', error);
      setPlans([]);
    }
  };

  const fetchTrainers = async () => {
    try {
      const res = await getTrainers();
      const trainerData = res.data?.data;
      setTrainers(Array.isArray(trainerData) ? trainerData : (trainerData?.items || []));
    } catch (error) {
      console.error('Failed to fetch trainers', error);
    }
  };

  useEffect(() => {
    fetchMembers(debouncedSearch, filterStatus);
    fetchPlans();
    fetchTrainers();
  }, [debouncedSearch, filterStatus]);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMember(formData);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', phone: '', password: 'Password123', planId: '', trainerId: '', branchCode: 'MAIN' });
      fetchMembers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create member');
    }
  };

  const handleEditClick = (member: any) => {
    setSelectedMember(member);
    setEditFormData({
      name: member.user?.name || '',
      email: member.user?.email || '',
      phone: member.user?.phone || '',
      trainerId: member.trainer?._id || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMember(selectedMember._id, editFormData);
      setIsEditModalOpen(false);
      fetchMembers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Update failed');
    }
  };

  const handleOpenSubscription = (member: any) => {
    setSelectedMember(member);
    setSubFormData({
      planId: member.currentPlan?._id || '',
      amount: member.currentPlan?.price || 0,
      note: '',
      recordPayment: true
    });
    setIsSubModalOpen(true);
  };

  const handleSubscriptionAction = async (action: 'assign' | 'renew' | 'cancel' | 'freeze' | 'resume') => {
    if (!selectedMember) return;
    try {
      if (action === 'cancel') {
        if (window.confirm('Are you sure you want to cancel this subscription?')) {
          await cancelPlan(selectedMember._id);
        } else return;
      } else if (action === 'freeze') {
        if (window.confirm('Freeze this plan? Membership will be paused.')) {
          await freezePlan(selectedMember._id);
        } else return;
      } else if (action === 'resume') {
        await resumePlan(selectedMember._id);
      } else {
        // Assign or Renew
        if (action === 'assign') {
          await assignPlan(selectedMember._id, { planId: subFormData.planId });
        } else {
          await renewPlan(selectedMember._id, { planId: subFormData.planId });
        }

        // Record payment (Paid or Pending)
        await recordPayment({
          member: selectedMember._id,
          plan: subFormData.planId,
          amount: subFormData.amount,
          method: 'cash',
          status: subFormData.recordPayment ? 'paid' : 'pending',
          note: subFormData.note
        });
      }
      setIsSubModalOpen(false);
      fetchMembers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Action failed');
    }
  };

  const handleApprove = async (id: string) => {
    if (!window.confirm('Approve this member? They will be moved to active status.')) return;
    try {
      await approveMember(id);
      fetchMembers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Approval failed');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const isDeactivating = currentStatus !== 'inactive';
    const newStatus = isDeactivating ? 'inactive' : 'active';
    
    let reason = '';
    if (isDeactivating) {
      const input = window.prompt(
        'Are you sure you want to deactivate this member? They will lose all access immediately.\n\nPlease enter a reason for deactivation:',
        'Administrative deactivation'
      );
      if (input === null) return; // Cancelled
      reason = input.trim() || 'Administrative deactivation';
    } else {
      if (!window.confirm('Reactivate this member?')) return;
    }

    try {
      await updateMember(id, { status: newStatus, reason });
      fetchMembers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Status update failed');
    }
  };

  const handleDiscard = async (id: string) => {
    if (!window.confirm('Discard this membership request? The member will be notified.')) return;
    try {
      await updateMember(id, { status: 'inactive' });
      fetchMembers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Discard failed');
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY delete this member and ALL their associated data (payments, attendance, progress)? This action cannot be undone.')) return;
    try {
      await deleteMember(id);
      fetchMembers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Deletion failed');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-success bg-success-light';
      case 'expired': return 'text-danger bg-danger-light';
      case 'pending': return 'text-warning bg-warning-light';
      case 'cancelled': return 'text-muted bg-glass';
      default: return 'text-muted bg-glass';
    }
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div className="flex-responsive" style={{ gap: '1.5rem' }}>
          <div>
            <h1>Members Management</h1>
            <p className="text-muted">Manage member subscriptions, plans, and offline payments.</p>
          </div>
          {(isAdmin || isTrainer) && (
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={18} />
              Add Member
            </button>
          )}
        </div>
      </div>

      <div className="flex-responsive" style={{ marginBottom: '2rem', gap: '1rem' }}>
        <div className="flex-responsive" style={{ gap: '0.75rem', justifyContent: 'flex-start', width: '100%', maxWidth: '500px' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: '150px', background: 'var(--clr-bg-base)', padding: '0.4rem 1rem' }}>
            <Search size={16} className="text-muted" />
            <input 
              placeholder="Search members..." 
              style={{ fontSize: '0.85rem' }} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-container" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--clr-bg-base)', padding: '0.4rem 1rem', borderRadius: '12px', border: '1px solid var(--clr-glass-border)', cursor: 'pointer' }}>
            <Filter size={16} className="text-muted" />
            <select 
              className="filter-select" 
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'var(--clr-text-main)', 
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer',
                paddingRight: '1rem'
              }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Filter: All Members</option>
              <option value="active">Filter: Active</option>
              <option value="pending">Filter: Pending Approval</option>
              <option value="expired">Filter: Expired</option>
              <option value="frozen">Filter: Frozen</option>
              <option value="cancelled">Filter: Cancelled</option>
              <option value="inactive">Filter: Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Member">
        <form onSubmit={handleCreateMember} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ flex: 1 }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-input" type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Initial Plan (Optional)</label>
              <select className="form-input" value={formData.planId} onChange={e => setFormData({...formData, planId: e.target.value})}>
                <option value="">Select a plan</option>
                {plans.map(p => <option key={p._id} value={p._id}>{p.name} - ₹{p.price}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Assign Trainer (Optional)</label>
              <select 
                className="form-input"
                value={formData.trainerId} 
                onChange={e => setFormData({ ...formData, trainerId: e.target.value })}
              >
                <option value="">No Trainer</option>
                {trainers.map(t => (
                  <option key={t._id} value={t._id}>{t.user?.name || t.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--clr-glass-border)', position: 'sticky', bottom: 0, background: 'var(--clr-bg-sidebar)', zIndex: 10 }}>
            <button className="btn btn-primary w-full" type="submit">Create Member</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Member Profile">
        <form onSubmit={handleUpdateMember} className="form-container">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-input"
                value={editFormData.name} 
                onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input 
                type="email" 
                className="form-input"
                value={editFormData.email} 
                onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input 
                type="text" 
                className="form-input"
                value={editFormData.phone} 
                onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Change Trainer</label>
              <select 
                className="form-input"
                value={editFormData.trainerId} 
                onChange={e => setEditFormData({ ...editFormData, trainerId: e.target.value })}
              >
                <option value="">No Trainer</option>
                {trainers.map(t => (
                  <option key={t._id} value={t._id}>{t.user?.name || t.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              Save Changes
            </button>
            <button type="button" className="btn btn-secondary w-full" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isSubModalOpen} onClose={() => setIsSubModalOpen(false)} title="Subscription Management">
        {selectedMember && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1 }}>
              <div className="glass-panel" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                <p>Member: <strong>{selectedMember.user?.name}</strong></p>
                <p>Status: <span className={`status-badge ${selectedMember.status}`}>{selectedMember.status}</span></p>
                <p>Payment: <span className={`status-badge ${selectedMember.paymentStatus === 'paid' ? 'active' : 'pending'}`}>{selectedMember.paymentStatus}</span></p>
              </div>

              <div className="form-group">
                <label className="form-label">Select Plan</label>
                <select className="form-input" value={subFormData.planId} onChange={e => {
                  const plan = plans.find(p => p._id === e.target.value);
                  setSubFormData({...subFormData, planId: e.target.value, amount: plan?.price || 0});
                }}>
                  <option value="">Select a plan</option>
                  {plans.map(p => <option key={p._id} value={p._id}>{p.name} - ₹{p.price} ({p.duration} days)</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Amount (₹)</label>
                  <input className="form-input" type="number" value={subFormData.amount} onChange={e => setSubFormData({...subFormData, amount: Number(e.target.value)})} />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={subFormData.recordPayment} 
                      onChange={e => setSubFormData({...subFormData, recordPayment: e.target.checked})} 
                    />
                    <span style={{ fontSize: '0.85rem' }}>Mark as Paid</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Note (Optional)</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '80px' }}
                  value={subFormData.note} 
                  onChange={e => setSubFormData({...subFormData, note: e.target.value})}
                  placeholder="Payment or subscription note..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <button className="btn btn-primary" onClick={() => handleSubscriptionAction('assign')}>Assign</button>
                <button className="btn btn-secondary" onClick={() => handleSubscriptionAction('renew')}>Renew</button>
              </div>
            </div>

            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--clr-glass-border)', position: 'sticky', bottom: 0, background: 'var(--clr-bg-sidebar)', zIndex: 10, display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-warning flex-1" onClick={() => handleSubscriptionAction('freeze')}>Freeze</button>
              <button className="btn btn-success flex-1" onClick={() => handleSubscriptionAction('resume')}>Resume</button>
              <button className="btn btn-danger flex-1" onClick={() => handleSubscriptionAction('cancel')}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>

      {loading ? (
        <div className="loading-state"><div className="spinner"></div></div>
      ) : (
        <div className="grid-cards">
          {members.map((member) => (
            <div key={member._id} className="glass-card member-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div className="avatar">{member.user?.name?.charAt(0)}</div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`status-badge ${member.status}`}>{member.status}</span>
                  <div className={`text-muted`} style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>
                    Payment: <span style={{ color: member.paymentStatus === 'paid' ? 'var(--clr-success)' : 'var(--clr-warning)' }}>{member.paymentStatus}</span>
                  </div>
                </div>
              </div>
              
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{member.user?.name}</h3>
              <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>{member.user?.email}</p>
              <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>ID: {member.secretCode}</p>
              
              <div className="glass-panel" style={{ padding: '0.75rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Zap size={14} className="text-primary" />
                  <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{member.currentPlan?.name || 'No Plan'}</span>
                </div>
                {member.trainer && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <UserSquare2 size={14} style={{ color: 'var(--clr-secondary)' }} />
                    <span style={{ fontSize: '0.85rem' }}>Trainer: {member.trainer.user?.name || member.trainer.name}</span>
                  </div>
                )}
                {member.membershipExpiryDate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }} className="text-muted">
                    <Calendar size={12} />
                    <span>Expires: {new Date(member.membershipExpiryDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {member.status === 'pending' ? (
                  <>
                    <button className="btn btn-primary flex-1" onClick={() => handleApprove(member._id)} style={{ fontSize: '0.85rem', padding: '0.5rem' }}>
                      <Shield size={14} /> Approve
                    </button>
                  </>
                ) : (
                  <button className="btn btn-secondary flex-1" onClick={() => handleOpenSubscription(member)} style={{ fontSize: '0.85rem', padding: '0.5rem' }}>
                    <CreditCard size={14} /> Subscription
                  </button>
                )}
                {(isAdmin || isTrainer) && (
                  <>
                    <button className="btn-icon" onClick={() => handleEditClick(member)} title="Edit Profile">
                      <Edit2 size={14} />
                    </button>
                    <button 
                      className={`btn-icon ${member.status === 'inactive' ? 'success' : 'warning'}`} 
                      onClick={() => handleToggleStatus(member._id, member.status)} 
                      title={member.status === 'inactive' ? 'Reactivate Member' : 'Deactivate Member'}
                      style={{ 
                        background: member.status === 'inactive' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        color: member.status === 'inactive' ? 'var(--clr-success)' : 'var(--clr-warning)',
                        border: member.status === 'inactive' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)'
                      }}
                    >
                      {member.status === 'inactive' ? <UserCheck size={14} /> : <UserX size={14} />}
                    </button>
                    <button className="btn-icon" onClick={() => handleDeleteMember(member._id)} style={{ color: 'var(--clr-danger)' }} title="Delete Member Permanently">
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MembersPage;
