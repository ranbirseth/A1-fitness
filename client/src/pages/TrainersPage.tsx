import React, { useEffect, useState } from 'react';
import { UserSquare2, Star, Users, Plus, Edit2, Trash2, Save, Search, Mail, Shield, Phone, ExternalLink, Calendar, Zap, Building2 } from 'lucide-react';
import { getTrainers, createTrainer, deleteTrainer, updateTrainer } from '../features/trainers/trainers.api';
import { getMembers } from '../features/members/members.api';
import { useDebounce } from '../hooks/useDebounce';
import { useAuthStore } from '../store/auth.store';
import { useBranchStore } from '../store/branch.store';
import Modal from '../components/Modal';

const TrainersPage: React.FC = () => {
  const { user } = useAuthStore();
  const { branches, selectedBranch: globalBranch, setSelectedBranch } = useBranchStore();
  const isSuperAdmin = user?.role === 'superadmin';

  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBranch, setFilterBranch] = useState<string>(globalBranch);
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [selectedTrainer, setSelectedTrainer] = useState<any>(null);
  const [trainerMembers, setTrainerMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const defaultBranch = isSuperAdmin 
    ? (filterBranch !== 'ALL' ? filterBranch : (branches[0]?.branchCode || 'MAIN'))
    : (user?.branchCode || 'MAIN');

  const [formData, setFormData] = useState({ 
    name: '', 
    specialty: '', 
    email: '', 
    phone: '',
    password: 'Password123',
    status: 'active',
    branchCode: defaultBranch
  });

  useEffect(() => {
    setFilterBranch(globalBranch);
  }, [globalBranch]);

  const fetchTrainers = async (branch = filterBranch) => {
    setLoading(true);
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
      setTrainers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMembers = async (trainer: any) => {
    setSelectedTrainer(trainer);
    setIsMemberModalOpen(true);
    setLoadingMembers(true);
    try {
      const res = await getMembers({ trainerId: trainer._id, limit: 100 });
      const memberData = res.data?.data;
      setTrainerMembers(Array.isArray(memberData) ? memberData : (memberData?.items || []));
    } catch (error) {
      console.error('Failed to fetch trainer members', error);
      setTrainerMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    fetchTrainers(filterBranch);
  }, [filterBranch]);

  const handleBranchChange = (newBranch: string) => {
    setFilterBranch(newBranch);
    if (isSuperAdmin) setSelectedBranch(newBranch);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: '', specialty: '', email: '', phone: '', password: 'Password123', status: 'active', branchCode: defaultBranch });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (trainer: any) => {
    setEditingId(trainer._id);
    setFormData({
      name: trainer.user?.name || trainer.name || '',
      email: trainer.user?.email || trainer.email || '',
      phone: trainer.user?.phone || trainer.phone || '',
      specialty: trainer.specialty || '',
      password: '', // Don't show password on edit
      status: trainer.status || 'active',
      branchCode: trainer.branchCode || 'MAIN'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        const payload = { ...formData };
        if (!payload.password) delete (payload as any).password;
        await updateTrainer(editingId, payload);
      } else {
        const payload = {
          ...formData,
          branchCode: isSuperAdmin ? formData.branchCode : (user?.branchCode || 'MAIN')
        };
        await createTrainer(payload);
      }
      setIsModalOpen(false);
      fetchTrainers(filterBranch);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save trainer');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this trainer?')) return;
    try {
      await deleteTrainer(id);
      fetchTrainers(filterBranch);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete trainer');
    }
  };

  const filteredTrainers = trainers.filter(t => {
    const name = t.user?.name || t.name || '';
    const email = t.user?.email || t.email || '';
    const specialty = t.specialty || '';
    const q = debouncedSearch.toLowerCase();
    return name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || specialty.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="page-header flex-responsive" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>Trainers & Coaches</h1>
          <p className="text-muted">Manage fitness coaches, specialties, assigned members, and branch assignments.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          Add Trainer
        </button>
      </div>

      <div className="flex-responsive" style={{ marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="flex-responsive" style={{ gap: '0.75rem', justifyContent: 'flex-start', width: '100%', flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: '1 1 200px', minWidth: '150px', background: 'var(--clr-bg-base)', padding: '0.4rem 1rem' }}>
            <Search size={16} className="text-muted" />
            <input 
              placeholder="Search by name, email, or specialty..." 
              style={{ fontSize: '0.85rem' }} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Trainer Profile" : "Add New Trainer"}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              className="form-input" 
              required 
              placeholder="e.g. Alex Hunter"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              className="form-input" 
              type="email" 
              required 
              placeholder="e.g. alex@gym.com"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input 
              className="form-input" 
              type="tel" 
              placeholder="e.g. +91 98765 43210"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
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
            <label className="form-label">Specialty / Discipline</label>
            <input 
              className="form-input" 
              required 
              placeholder="e.g. Strength & Conditioning, HIIT, Yoga"
              value={formData.specialty}
              onChange={e => setFormData({...formData, specialty: e.target.value})}
            />
          </div>
          {!editingId && (
            <div className="form-group">
              <label className="form-label">Temporary Password</label>
              <input 
                className="form-input" 
                type="password" 
                required 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>
          )}
          {editingId && (
            <div className="form-group">
              <label className="form-label">Status</label>
              <select 
                className="form-input" 
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}
          <div style={{ marginTop: '2rem' }}>
            <button className="btn btn-primary w-full" type="submit" disabled={isSaving}>
              <Save size={18} />
              {isSaving ? 'Saving...' : (editingId ? 'Update Trainer' : 'Create Trainer')}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Assigned Members Modal */}
      <Modal isOpen={isMemberModalOpen} onClose={() => setIsMemberModalOpen(false)} title={`Members Assigned to ${selectedTrainer?.user?.name || selectedTrainer?.name || 'Trainer'}`}>
        <div style={{ padding: '0.5rem 0' }}>
          {loadingMembers ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="spinner"></div>
              <p className="text-muted" style={{ marginTop: '0.5rem' }}>Loading assigned members...</p>
            </div>
          ) : trainerMembers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
              <Users size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
              <p>No members currently assigned to this trainer.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
              {trainerMembers.map((m: any) => (
                <div key={m._id} className="glass-panel" style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', marginBottom: '0.15rem' }}>{m.user?.name}</h4>
                    <p className="text-muted" style={{ fontSize: '0.8rem' }}>{m.user?.email} • ID: {m.secretCode}</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--clr-primary)' }}>Branch: {m.branchCode || 'MAIN'}</span>
                  </div>
                  <span className={`status-badge ${m.status}`}>{m.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {loading ? (
        <div className="loading-state" style={{ padding: '4rem', textAlign: 'center' }}>
          <div className="spinner"></div>
          <p className="text-muted" style={{ marginTop: '1rem' }}>Loading trainers...</p>
        </div>
      ) : (
        <div className="grid-cards">
          {filteredTrainers.map((trainer) => (
            <div key={trainer._id} className="glass-card trainer-card" style={{ padding: 0, position: 'relative', overflow: 'hidden' }}>
              {/* Trainer Banner */}
              <div style={{ 
                position: 'relative', 
                height: '120px', 
                background: `linear-gradient(135deg, rgba(6, 182, 212, 0.6) 0%, rgba(139, 92, 246, 0.6) 100%), url('https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&h=300&fit=crop')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }} />

              <div style={{ padding: '2rem 2rem 1.5rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '1rem', right: '1.25rem', display: 'flex', gap: '0.5rem', zIndex: 10 }}>
                  <button className="btn-icon" onClick={() => handleOpenEdit(trainer)} title="Edit">
                    <Edit2 size={14} />
                  </button>
                  <button className="btn-icon danger" onClick={() => handleDelete(trainer._id)} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
                
                <div className="avatar" style={{ 
                  width: '100px', 
                  height: '100px', 
                  margin: '-60px auto 1.5rem', 
                  fontSize: '2rem',
                  boxShadow: '0 0 20px var(--clr-primary-glow)',
                  border: '3px solid var(--clr-glass-border)',
                  background: 'linear-gradient(135deg, var(--clr-primary), var(--clr-secondary))',
                  position: 'relative',
                  zIndex: 5
                }}>
                  {trainer.user?.name?.charAt(0) || trainer.name?.charAt(0)}
                </div>
              
                <div className="text-center">
                  <h3 style={{ fontSize: '1.35rem', marginBottom: '0.25rem' }}>{trainer.user?.name || trainer.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <span className={`status-badge ${trainer.status || 'active'}`}>
                      {trainer.status || 'active'}
                    </span>
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
                      <Building2 size={12} /> {trainer.branchCode || 'MAIN'}
                    </span>
                  </div>

                  <div className="info-pill" style={{ display: 'inline-block', padding: '0.5rem 1rem', borderRadius: '30px', background: 'rgba(255, 255, 255, 0.05)', marginBottom: '1.5rem' }}>
                    <p className="text-primary" style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                      {trainer.specialty || 'General Fitness'}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>
                      <Mail size={14} />
                      <span>{trainer.user?.email || trainer.email}</span>
                    </div>
                    {(trainer.user?.phone || trainer.phone) && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>
                        <Phone size={14} />
                        <span>{trainer.user?.phone || trainer.phone}</span>
                      </div>
                    )}
                  </div>

                  <button 
                    className="btn btn-secondary w-full"
                    style={{ fontSize: '0.85rem' }}
                    onClick={() => handleViewMembers(trainer)}
                  >
                    <Users size={16} />
                    View Assigned Members
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrainersPage;
