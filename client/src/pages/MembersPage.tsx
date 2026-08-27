import React, { useEffect, useState } from 'react';
import { Users, Search, Plus, Filter, Edit2, Trash2, Shield, Calendar, CreditCard, Zap, Building2, UserX, UserCheck, UserSquare2 } from 'lucide-react';
import { getMembers, createMember, deleteMember, assignPlan, renewPlan, upgradePlan, cancelPlan, freezePlan, resumePlan, approveMember, updateMember } from '../features/members/members.api';
import { getPlans } from '../features/plans/plans.api';
import { getTrainers } from '../features/trainers/trainers.api';
import { recordPayment } from '../features/payments/payments.api';
import { useDebounce } from '../hooks/useDebounce';
import { useAuthStore } from '../store/auth.store';
import { useBranchStore } from '../store/branch.store';
import Modal from '../components/Modal';

const MembersPage: React.FC = () => {
  const { user } = useAuthStore();
  const { branches, selectedBranch: globalBranch, setSelectedBranch } = useBranchStore();
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin' || isSuperAdmin;
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
  const [filterBranch, setFilterBranch] = useState<string>(globalBranch);
  const debouncedSearch = useDebounce(searchQuery, 500);

  const defaultBranch = isSuperAdmin 
    ? (filterBranch !== 'ALL' ? filterBranch : (branches[0]?.branchCode || 'MAIN'))
    : (user?.branchCode || 'MAIN');

  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    password: 'Password123',
    planId: '',
    trainerId: '',
    branchCode: defaultBranch
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    trainerId: '',
    branchCode: 'MAIN'
  });

  const [subFormData, setSubFormData] = useState({
    planId: '',
    amount: 0,
    note: '',
    recordPayment: true
  });

  // Sync filterBranch with globalBranch changes
  useEffect(() => {
    setFilterBranch(globalBranch);
  }, [globalBranch]);

  const fetchMembersList = async (search = '', status = 'all', branch = filterBranch) => {
    setLoading(true);
    try {
      const params: any = { search, limit: 100 };
      if (status !== 'all') params.status = status;
      if (isSuperAdmin && branch && branch !== 'ALL') {
        params.branchCode = branch;
      }
      const res = await getMembers(params);
      setMembers(res.data?.data?.items || []);
    } catch (error) {
      console.error('Failed to fetch members', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlansList = async (branch = filterBranch) => {
    try {
      const params: any = {};
      if (isSuperAdmin && branch && branch !== 'ALL') {
        params.branchCode = branch;
      }
      const res = await getPlans(params);
      const planData = res.data?.data;
      setPlans(Array.isArray(planData) ? planData : (planData?.items || []));
    } catch (error) {
      console.error('Failed to fetch plans', error);
      setPlans([]);
    }
  };

  const fetchTrainersList = async (branch = filterBranch) => {
    try {
      const params: any = {};
      if (isSuperAdmin && branch && branch !== 'ALL') {
        params.branchCode = branch;
      }
      const res = await getTrainers(params);
      const trainerData = res.data?.data;
      setTrainers(Array.isArray(trainerData) ? trainerData : (trainerData?.items || []));
    } catch (error) {
      console.error('Failed to fetch trainers', error);
    }
  };

  useEffect(() => {
    fetchMembersList(debouncedSearch, filterStatus, filterBranch);
    fetchPlansList(filterBranch);
    fetchTrainersList(filterBranch);
  }, [debouncedSearch, filterStatus, filterBranch]);

  const handleBranchChange = (newBranch: string) => {
    setFilterBranch(newBranch);
    if (isSuperAdmin) setSelectedBranch(newBranch);
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        branchCode: isSuperAdmin ? formData.branchCode : (user?.branchCode || 'MAIN')
      };
      await createMember(payload);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', phone: '', password: 'Password123', planId: '', trainerId: '', branchCode: defaultBranch });
      fetchMembersList(debouncedSearch, filterStatus, filterBranch);
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
      trainerId: member.trainer?._id || '',
      branchCode: member.branchCode || member.user?.branchCode || 'MAIN'
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMember(selectedMember._id, editFormData);
      setIsEditModalOpen(false);
      fetchMembersList(debouncedSearch, filterStatus, filterBranch);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Update failed');
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this member and all associated data?')) return;
    try {
      await deleteMember(id);
      fetchMembersList(debouncedSearch, filterStatus, filterBranch);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete member');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
    const actionName = newStatus === 'inactive' ? 'deactivate' : 'reactivate';
    if (!window.confirm(`Are you sure you want to ${actionName} this member?`)) return;
    try {
      await updateMember(id, { status: newStatus });
      fetchMembersList(debouncedSearch, filterStatus, filterBranch);
    } catch (error: any) {
      alert(error.response?.data?.message || `Failed to ${actionName} member`);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveMember(id);
      fetchMembersList(debouncedSearch, filterStatus, filterBranch);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Approval failed');
    }
  };

  const handleOpenSubscription = (member: any) => {
    setSelectedMember(member);
    const plan = plans.find(p => p._id === member.currentPlan?._id) || plans[0];
    setSubFormData({
      planId: plan?._id || '',
      amount: plan?.price || 0,
      note: '',
      recordPayment: true
    });
    setIsSubModalOpen(true);
  };

  const handleSubscriptionAction = async (action: 'assign' | 'renew' | 'upgrade' | 'freeze' | 'resume' | 'cancel') => {
    if (!selectedMember) return;
    try {
      if (!subFormData.planId && ['assign', 'renew', 'upgrade'].includes(action)) {
        alert('Please select a plan first');
        return;
      }
      if (action === 'assign') await assignPlan(selectedMember._id, { planId: subFormData.planId });
      else if (action === 'renew') await renewPlan(selectedMember._id, { planId: subFormData.planId });
      else if (action === 'upgrade') await upgradePlan(selectedMember._id, { planId: subFormData.planId });
      else if (action === 'freeze') await freezePlan(selectedMember._id);
      else if (action === 'resume') await resumePlan(selectedMember._id);
      else if (action === 'cancel') await cancelPlan(selectedMember._id);

      if (subFormData.recordPayment && subFormData.amount > 0 && ['assign', 'renew', 'upgrade'].includes(action)) {
        await recordPayment({
          member: selectedMember._id,
          plan: subFormData.planId,
          amount: subFormData.amount,
          note: subFormData.note,
          status: 'paid'
        });
      }
      setIsSubModalOpen(false);
      fetchMembersList(debouncedSearch, filterStatus, filterBranch);
    } catch (error: any) {
      alert(error.response?.data?.message || `Action ${action} failed`);
    }
  };

  return (
    <div>
      <div className="page-header flex-responsive" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>Members Directory</h1>
          <p className="text-muted">Manage gym memberships, profiles, and attendance credentials.</p>
        </div>
        <div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => {
              setFormData({ name: '', email: '', phone: '', password: 'Password123', planId: '', trainerId: '', branchCode: defaultBranch });
              setIsModalOpen(true);
            }}>
              <Plus size={18} /> Add Member
            </button>
          )}
        </div>
      </div>

      <div className="flex-responsive" style={{ marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="flex-responsive" style={{ gap: '0.75rem', justifyContent: 'flex-start', width: '100%', flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: '1 1 200px', minWidth: '150px', background: 'var(--clr-bg-base)', padding: '0.4rem 1rem' }}>
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
              style={{ background: 'transparent', border: 'none', color: 'var(--clr-text-main)', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all" style={{ background: '#1e1b4b', color: '#fff' }}>Filter: All Statuses</option>
              <option value="active" style={{ background: '#1e1b4b', color: '#fff' }}>Active</option>
              <option value="pending" style={{ background: '#1e1b4b', color: '#fff' }}>Pending Approval</option>
              <option value="expired" style={{ background: '#1e1b4b', color: '#fff' }}>Expired</option>
              <option value="frozen" style={{ background: '#1e1b4b', color: '#fff' }}>Frozen</option>
              <option value="cancelled" style={{ background: '#1e1b4b', color: '#fff' }}>Cancelled</option>
              <option value="inactive" style={{ background: '#1e1b4b', color: '#fff' }}>Inactive</option>
            </select>
          </div>

          {isSuperAdmin && (
            <div className="filter-container" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--clr-bg-base)', padding: '0.4rem 1rem', borderRadius: '12px', border: '1px solid var(--clr-glass-border)', cursor: 'pointer' }}>
              <Building2 size={16} style={{ color: 'var(--clr-primary)' }} />
              <select 
                className="filter-select" 
                style={{ background: 'transparent', border: 'none', color: 'var(--clr-text-main)', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                value={filterBranch}
                onChange={(e) => handleBranchChange(e.target.value)}
              >
                <option value="ALL" style={{ background: '#1e1b4b', color: '#fff' }}>Branch: All Branches</option>
                {branches.map(b => (
                  <option key={b._id} value={b.branchCode} style={{ background: '#1e1b4b', color: '#fff' }}>
                    {b.name} ({b.branchCode})
                  </option>
                ))}
              </select>
            </div>
          )}
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

            {isSuperAdmin && (
              <div className="form-group">
                <label className="form-label">Branch Assignment</label>
                <select 
                  className="form-input" 
                  value={formData.branchCode} 
                  onChange={e => setFormData({...formData, branchCode: e.target.value})}
                  required
                >
                  {branches.map(b => (
                    <option key={b._id} value={b.branchCode}>
                      {b.name} ({b.branchCode})
                    </option>
                  ))}
                </select>
              </div>
            )}

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

            {isSuperAdmin && (
              <div className="form-group">
                <label className="form-label">Branch</label>
                <select 
                  className="form-input"
                  value={editFormData.branchCode} 
                  onChange={e => setEditFormData({ ...editFormData, branchCode: e.target.value })}
                >
                  {branches.map(b => (
                    <option key={b._id} value={b.branchCode}>
                      {b.name} ({b.branchCode})
                    </option>
                  ))}
                </select>
              </div>
            )}

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
                <p>Branch: <strong style={{ color: 'var(--clr-primary)' }}>{selectedMember.branchCode || 'MAIN'}</strong></p>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <button className="btn btn-primary" onClick={() => handleSubscriptionAction('assign')}>Assign</button>
                <button className="btn btn-secondary" onClick={() => handleSubscriptionAction('renew')}>Renew</button>
                <button className="btn btn-warning" onClick={() => handleSubscriptionAction('upgrade')}>Upgrade</button>
              </div>
              <p className="text-muted" style={{ fontSize: '0.72rem', marginBottom: '1.5rem' }}>
                Assign/Upgrade start a new term from today. Renew continues from the current expiry while the membership is still active.
              </p>
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
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>ID: {member.secretCode}</span>
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.25rem', 
                  fontSize: '0.75rem', 
                  padding: '0.15rem 0.5rem', 
                  borderRadius: '12px', 
                  background: 'rgba(139, 92, 246, 0.12)', 
                  color: 'var(--clr-primary)' 
                }}>
                  <Building2 size={12} /> {member.branchCode || 'MAIN'}
                </span>
              </div>
              
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
