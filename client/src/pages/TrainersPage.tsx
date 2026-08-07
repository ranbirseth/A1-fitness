import React, { useEffect, useState } from 'react';
import { UserSquare2, Star, Users, Plus, Edit2, Trash2, Save, Search, Mail, Shield, Phone, ExternalLink, Calendar, Zap } from 'lucide-react';
import { getTrainers, createTrainer, deleteTrainer, updateTrainer } from '../features/trainers/trainers.api';
import { getMembers } from '../features/members/members.api';
import { useDebounce } from '../hooks/useDebounce';
import Modal from '../components/Modal';

const TrainersPage: React.FC = () => {
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [selectedTrainer, setSelectedTrainer] = useState<any>(null);
  const [trainerMembers, setTrainerMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [formData, setFormData] = useState({ 
    name: '', 
    specialty: '', 
    email: '', 
    phone: '',
    password: 'Password123',
    status: 'active'
  });

  const fetchTrainers = async () => {
    setLoading(true);
    try {
      const res = await getTrainers();
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
    fetchTrainers();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: '', specialty: '', email: '', phone: '', password: 'Password123', status: 'active' });
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
      status: trainer.status || 'active'
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
        await createTrainer(formData);
      }
      setIsModalOpen(false);
      fetchTrainers();
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
      fetchTrainers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete trainer');
    }
  };

  const filteredTrainers = trainers.filter(trainer => {
    const name = (trainer.user?.name || trainer.name || '').toLowerCase();
    const email = (trainer.user?.email || trainer.email || '').toLowerCase();
    const specialty = (trainer.specialty || '').toLowerCase();
    const q = debouncedSearch.toLowerCase();
    return name.includes(q) || email.includes(q) || specialty.includes(q);
  });

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>Trainers Management</h1>
            <p className="text-muted">Manage gym trainers, their specialties, and access.</p>
          </div>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} />
            Add Trainer
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <div className="search-bar" style={{ maxWidth: '450px', background: 'var(--clr-bg-base)' }}>
          <Search size={18} className="text-muted" />
          <input 
            placeholder="Search by name, email, or specialty..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Trainer" : "Add New Trainer"}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              className="form-input" 
              required 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. Karan Johar"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              className="form-input" 
              type="email" 
              required 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              placeholder="karan@example.com"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input 
              className="form-input" 
              type="tel" 
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              placeholder="e.g. +91 9876543210"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Specialty</label>
            <input 
              className="form-input" 
              required 
              value={formData.specialty}
              onChange={e => setFormData({...formData, specialty: e.target.value})}
              placeholder="e.g. Weightlifting"
            />
          </div>
          {!editingId && (
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                className="form-input" 
                type="password"
                required 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
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

      {loading ? (
        <div className="loading-state" style={{ padding: '4rem', textAlign: 'center' }}>
          <div className="spinner"></div>
          <p className="text-muted" style={{ marginTop: '1rem' }}>Loading trainers...</p>
        </div>
      ) : (
        <div className="grid-cards">
          {filteredTrainers.map((trainer) => (
            <div key={trainer._id} className="glass-card trainer-card" style={{ padding: 0, position: 'relative', overflow: 'hidden' }}>
              {/* Trainer Banner Image */}
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <span className={`status-badge ${trainer.status || 'active'}`}>
                    {trainer.status || 'active'}
                  </span>
                  <span className="text-muted" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Shield size={12} /> Trainer
                  </span>
                </div>

                <div className="info-pill" style={{ display: 'inline-block', padding: '0.5rem 1rem', borderRadius: '30px', background: 'rgba(255, 255, 255, 0.05)', marginBottom: '1.5rem' }}>
                  <p className="text-primary" style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                    {trainer.specialty}
                  </p>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: '2.5rem', 
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  marginBottom: '1.5rem',
                  border: '1px solid var(--clr-glass-border)'
                }}>
                  <div>
                    <p className="stat-value" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center' }}>
                      {trainer.rating || 0} <Star size={14} fill="currentColor" />
                    </p>
                    <p className="text-muted" style={{ fontSize: '0.75rem' }}>Rating</p>
                  </div>
                  <div style={{ width: '1px', background: 'var(--clr-glass-border)' }}></div>
                  <div>
                    <p className="stat-value" style={{ fontSize: '1.1rem' }}>{trainer.studentsCount || 0}</p>
                    <p className="text-muted" style={{ fontSize: '0.75rem' }}>Students</p>
                  </div>
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
                  style={{ justifyContent: 'center' }}
                  onClick={() => handleViewMembers(trainer)}
                >
                  <Users size={16} />
                  View Members
                </button>
              </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal 
        isOpen={isMemberModalOpen} 
        onClose={() => setIsMemberModalOpen(false)} 
        title={`Members assigned to ${selectedTrainer?.user?.name || selectedTrainer?.name || 'Trainer'}`}
      >
        {loadingMembers ? (
          <div className="loading-state" style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="spinner"></div>
            <p className="text-muted" style={{ marginTop: '1rem' }}>Fetching members...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '60vh', overflowY: 'auto', padding: '0.5rem' }}>
            {trainerMembers.length === 0 ? (
              <div className="text-center" style={{ padding: '2rem' }}>
                <p className="text-muted">No members assigned to this trainer yet.</p>
              </div>
            ) : (
              trainerMembers.map((member) => (
                <div key={member._id} className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="avatar" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                    {member.user?.name?.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '600', fontSize: '0.95rem' }}>{member.user?.name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                      <span className={`status-badge ${member.status}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>
                        {member.status}
                      </span>
                      <span className="text-muted" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Zap size={10} className="text-primary" />
                        {member.currentPlan?.name || 'No Plan'}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Joined</p>
                    <p style={{ fontSize: '0.8rem' }}>{new Date(member.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--clr-glass-border)', paddingTop: '1rem' }}>
          <button className="btn btn-secondary w-full" onClick={() => setIsMemberModalOpen(false)}>
            Close
          </button>
        </div>
      </Modal>
      
      {!loading && filteredTrainers.length === 0 && (
        <div className="glass-panel text-center" style={{ padding: '4rem' }}>
          <UserSquare2 size={48} className="text-muted" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No trainers found</h3>
          <p className="text-muted">Try adjusting your search query or add a new trainer.</p>
        </div>
      )}
    </div>
  );
};

export default TrainersPage;
