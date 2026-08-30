import React, { useEffect, useState } from 'react';
import { Check, X, Plus, Trash2, Edit2, Save, IndianRupee, Clock, Zap, Search, UserPlus, Building2 } from 'lucide-react';
import { getPlans, createPlan, updatePlan, deletePlan, applyPlanToBranch, removePlanFromBranch } from '../features/plans/plans.api';
import { getMembers, assignPlan } from '../features/members/members.api';
import { recordPayment } from '../features/payments/payments.api';
import { useDebounce } from '../hooks/useDebounce';
import { useAuthStore } from '../store/auth.store';
import { useBranchStore } from '../store/branch.store';
import Modal from '../components/Modal';

const PlansPage: React.FC = () => {
  const { user } = useAuthStore();
  const { branches, fetchBranches } = useBranchStore();
  const isSuperAdmin = user?.role === 'superadmin';

  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', price: 0, duration: 30, features: [] as string[] });
  const [featureInput, setFeatureInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedPlanForAssign, setSelectedPlanForAssign] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const debouncedMemberSearch = useDebounce(memberSearchQuery, 500);
  const [isAssigning, setIsAssigning] = useState(false);
  const [recordAssignPayment, setRecordAssignPayment] = useState(true);

  const [isApplyBranchModalOpen, setIsApplyBranchModalOpen] = useState(false);
  const [selectedPlanForBranch, setSelectedPlanForBranch] = useState<any>(null);
  const [selectedBranchCode, setSelectedBranchCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await getPlans();
      const planData = res.data?.data;
      setPlans(Array.isArray(planData) ? planData : (planData?.items || []));
    } catch (error) {
      console.error('Failed to fetch plans', error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    if (isSuperAdmin) fetchBranches();
  }, []);

  useEffect(() => {
    if (isAssignModalOpen) {
      const fetchMembers = async () => {
        try {
          const res = await getMembers({ search: debouncedMemberSearch, limit: 10 });
          setMembers(res.data?.data?.items || []);
        } catch (error) {
          console.error('Failed to fetch members', error);
        }
      };
      fetchMembers();
    }
  }, [debouncedMemberSearch, isAssignModalOpen]);

  const handleOpenAssignModal = (plan: any) => {
    setSelectedPlanForAssign(plan);
    setIsAssignModalOpen(true);
    setMemberSearchQuery('');
  };

  const handleAssignToMember = async (memberId: string) => {
    if (!selectedPlanForAssign) return;
    setIsAssigning(true);
    try {
      await assignPlan(memberId, { planId: selectedPlanForAssign._id });
      
      if (recordAssignPayment) {
        await recordPayment({
          member: memberId,
          plan: selectedPlanForAssign._id,
          amount: selectedPlanForAssign.price,
          method: 'cash',
          status: 'paid',
          note: `Assigned plan ${selectedPlanForAssign.name} from Plans section.`
        });
      }
      
      alert('Plan assigned successfully!');
      setIsAssignModalOpen(false);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to assign plan');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleOpenApplyBranch = (plan: any) => {
    setSelectedPlanForBranch(plan);
    setSelectedBranchCode('');
    setIsApplyBranchModalOpen(true);
  };

  const handleApplyToBranch = async () => {
    if (!selectedPlanForBranch || !selectedBranchCode) return;
    setIsApplying(true);
    try {
      await applyPlanToBranch(selectedPlanForBranch._id, selectedBranchCode);
      setIsApplyBranchModalOpen(false);
      fetchPlans();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to apply plan to branch');
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveFromBranch = async (planId: string, branchCode: string) => {
    if (!window.confirm(`Remove this plan from branch ${branchCode}?`)) return;
    try {
      await removePlanFromBranch(planId, branchCode);
      fetchPlans();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to remove plan from branch');
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: '', price: 0, duration: 30, features: [] });
    setFeatureInput('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: any) => {
    setEditingId(plan._id);
    setFormData({
      name: plan.name,
      price: plan.price,
      duration: plan.duration,
      features: [...(plan.features || [])]
    });
    setFeatureInput('');
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || formData.price <= 0) {
      alert('Please provide a plan name and a valid price.');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        price: formData.price,
        duration: formData.duration,
        features: formData.features.filter(f => f.trim())
      };
      if (editingId) {
        await updatePlan(editingId, payload);
      } else {
        await createPlan(payload);
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save plan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (plan: any) => {
    if (!window.confirm(`Delete the plan "${plan.name}"?`)) return;
    try {
      await deletePlan(plan._id);
      fetchPlans();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete plan');
    }
  };

  const addFeature = () => {
    if (!featureInput.trim()) return;
    setFormData(prev => ({ ...prev, features: [...prev.features, featureInput.trim()] }));
    setFeatureInput('');
  };

  const removeFeature = (idx: number) => {
    setFormData(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== idx) }));
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '3rem' }}>
        <div>
          <h1>Membership Plans</h1>
          <p className="text-muted">
            {isSuperAdmin
              ? 'Create and manage the global plan catalog, then apply plans to branches.'
              : 'Plans available for your branch can be assigned to members.'}
          </p>
        </div>
        {isSuperAdmin && (
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} /> Add New Plan
          </button>
        )}
      </div>

      {isSuperAdmin && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Plan' : 'Add New Plan'}>
          <div className="form-group">
            <label className="form-label">Plan Name</label>
            <input
              className="form-input"
              placeholder="e.g. Premium Monthly"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Price (₹)</label>
              <div style={{ position: 'relative' }}>
                <IndianRupee size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  style={{ paddingLeft: '36px' }}
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Duration (days)</label>
              <div style={{ position: 'relative' }}>
                <Clock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
                <input
                  className="form-input"
                  type="number"
                  min={1}
                  style={{ paddingLeft: '36px' }}
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Features</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                className="form-input"
                placeholder="Add a feature"
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
              />
              <button type="button" className="btn btn-secondary" onClick={addFeature}>
                <Plus size={16} />
              </button>
            </div>
            {(formData.features || []).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                {formData.features.map((feature, idx) => (
                  <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(139, 92, 246, 0.12)', color: 'var(--clr-primary)', padding: '0.3rem 0.7rem', borderRadius: '20px', fontSize: '0.85rem' }}>
                    {feature}
                    <span
                      role="button"
                      onClick={() => removeFeature(idx)}
                      style={{ cursor: 'pointer', display: 'inline-flex' }}
                      title="Remove feature"
                    >
                      <X size={14} />
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={isSaving}>
              <Save size={16} /> {isSaving ? 'Saving...' : (editingId ? 'Save Changes' : 'Create Plan')}
            </button>
          </div>
        </Modal>
      )}

      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title={`Assign ${selectedPlanForAssign?.name} to Member`}>
        <div className="form-group">
          <label className="form-label">Search Member</label>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
            <input 
              className="form-input" 
              style={{ paddingLeft: '40px' }}
              placeholder="Type member name or email..."
              value={memberSearchQuery}
              onChange={(e) => setMemberSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
          <input 
            type="checkbox" 
            id="recordAssignPayment" 
            checked={recordAssignPayment} 
            onChange={(e) => setRecordAssignPayment(e.target.checked)} 
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <label htmlFor="recordAssignPayment" style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}>
            Mark as Paid immediately (Cash) - Recommended to avoid Access Restricted page
          </label>
        </div>

        <div style={{ marginTop: '1.5rem', maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {members.length > 0 ? (
            members.map((member) => (
              <div 
                key={member._id} 
                className="glass-panel" 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => handleAssignToMember(member._id)}
              >
                <div>
                  <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{member.user?.name || member.name}</p>
                  <p className="text-muted" style={{ fontSize: '0.8rem' }}>{member.user?.email || member.email}</p>
                </div>
                <button className="btn-icon" style={{ background: 'var(--clr-primary)', color: 'white' }} disabled={isAssigning}>
                  <UserPlus size={16} />
                </button>
              </div>
            ))
          ) : (
            <p className="text-center text-muted" style={{ padding: '2rem' }}>
              {memberSearchQuery ? 'No members found matching your search.' : 'Search for a member to assign this plan.'}
            </p>
          )}
        </div>
      </Modal>

      <Modal isOpen={isApplyBranchModalOpen} onClose={() => setIsApplyBranchModalOpen(false)} title={`Apply "${selectedPlanForBranch?.name}" to Branch`}>
        <div className="form-group">
          <label className="form-label">Select Branch</label>
          <select 
            className="form-input" 
            value={selectedBranchCode} 
            onChange={e => setSelectedBranchCode(e.target.value)}
          >
            <option value="">Select a branch</option>
            {branches.filter(b => b.status === 'active').map(b => (
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
            disabled={!selectedBranchCode || isApplying}
          >
            {isApplying ? 'Applying...' : 'Apply'}
          </button>
        </div>
      </Modal>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <div className="spinner"></div>
          <p className="text-muted" style={{ marginTop: '1rem' }}>Loading plans...</p>
        </div>
      ) : (
        <div className="grid-cards">
          {plans.map((plan) => (
            <div key={plan._id} className="glass-card" style={{ 
              padding: '2.5rem',
              position: 'relative',
              textAlign: 'center'
            }}>
              <div style={{ 
                display: 'inline-flex', 
                padding: '0.75rem', 
                borderRadius: '16px', 
                background: 'rgba(var(--clr-primary-rgb), 0.1)', 
                color: 'var(--clr-primary)',
                marginBottom: '1.5rem'
              }}>
                <Zap size={24} fill="currentColor" />
              </div>

              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{plan.name}</h3>
              <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Valid for {plan.duration} days
              </p>

              <div style={{ marginBottom: '2rem' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--clr-primary)' }}>
                  ₹{plan.price.toLocaleString()}
                </span>
              </div>

              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem', minHeight: '150px' }}>
                {(plan.features || []).map((feature: string, idx: number) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={12} className="text-success" />
                    </div>
                    <span style={{ fontSize: '0.9rem' }}>{feature}</span>
                  </div>
                ))}
                {(!plan.features || plan.features.length === 0) && (
                  <p className="text-muted" style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>No specific features listed</p>
                )}
              </div>

              {isSuperAdmin && (
                <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                  <p className="text-muted" style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                    Applied Branches
                  </p>
                  {(plan.appliedBranches || []).length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {plan.appliedBranches.map((bc: string) => (
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
                          <span
                            onClick={(e) => { e.stopPropagation(); handleRemoveFromBranch(plan._id, bc); }}
                            title={`Remove from ${bc}`}
                            style={{ cursor: 'pointer', display: 'inline-flex' }}
                          >
                            <X size={12} style={{ opacity: 0.7, marginLeft: '0.15rem' }} />
                          </span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted" style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>None</p>
                  )}
                </div>
              )}

              {isSuperAdmin && (
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn-icon"
                    title="Edit plan"
                    onClick={() => handleOpenEdit(plan)}
                    style={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', boxShadow: 'none' }}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className="btn-icon"
                    title="Delete plan"
                    onClick={() => handleDelete(plan)}
                    style={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', boxShadow: 'none' }}
                  >
                    <Trash2 size={16} className="text-danger" />
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {isSuperAdmin && (
                  <button 
                    className="btn btn-secondary w-full" 
                    style={{ justifyContent: 'center' }}
                    onClick={() => handleOpenApplyBranch(plan)}
                  >
                    <Building2 size={16} /> Apply to Branch
                  </button>
                )}
                <button 
                  className="btn btn-secondary w-full" 
                  style={{ justifyContent: 'center' }}
                  onClick={() => handleOpenAssignModal(plan)}
                >
                  Assign to Member
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && plans.length === 0 && (
        <div className="glass-panel text-center" style={{ padding: '5rem' }}>
          <Zap size={48} className="text-muted" style={{ marginBottom: '1.5rem', opacity: 0.3 }} />
          <h3>No plans created yet</h3>
          <p className="text-muted" style={{ marginBottom: '2rem' }}>
            {isSuperAdmin 
              ? 'No plans are available yet. They must be added before they can be applied to branches.'
              : 'No plans are currently available for your branch. Ask the superadmin to apply plans.'}
          </p>
          {isSuperAdmin && (
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              <Plus size={16} /> Add First Plan
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PlansPage;
