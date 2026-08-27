import React, { useEffect, useState } from 'react';
import { Shield, Plus, Edit2, Trash2, Save, Search, Mail, Phone, Building2 } from 'lucide-react';
import { getAdmins, createAdmin, deleteAdmin, updateAdmin } from '../features/admins/admins.api';
import { useDebounce } from '../hooks/useDebounce';
import { useAuthStore } from '../store/auth.store';
import { useBranchStore } from '../store/branch.store';
import Modal from '../components/Modal';

const AdminsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { branches } = useBranchStore();

  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 400);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'Password123',
    status: 'active',
    branchCode: branches[0]?.branchCode || 'MAIN'
  });

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      const res = await getAdmins(params);
      const adminData = res.data?.data;
      setAdmins(Array.isArray(adminData) ? adminData : (adminData?.items || []));
    } catch (error) {
      console.error('Failed to fetch admins', error);
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchAdmins(), 300);
    return () => clearTimeout(timer);
  }, [debouncedSearch]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: '', email: '', phone: '', password: 'Password123', status: 'active', branchCode: branches[0]?.branchCode || 'MAIN' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (admin: any) => {
    setEditingId(admin._id);
    setFormData({
      name: admin.name || '',
      email: admin.email || '',
      phone: admin.phone || '',
      password: '',
      status: admin.status || 'active',
      branchCode: admin.branchCode || 'MAIN'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        const payload: any = { ...formData };
        if (!payload.password) delete payload.password;
        await updateAdmin(editingId, payload);
      } else {
        await createAdmin(formData);
      }
      setIsModalOpen(false);
      fetchAdmins();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save admin');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    try {
      await deleteAdmin(id);
      fetchAdmins();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete admin');
    }
  };

  const filteredAdmins = admins.filter(a => {
    const name = a.name || '';
    const email = a.email || '';
    const q = debouncedSearch.toLowerCase();
    return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="page-header flex-responsive" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>Branch Admins</h1>
          <p className="text-muted">Manage branch administrator accounts and their branch assignments.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          Add Admin
        </button>
      </div>

      <div className="flex-responsive" style={{ marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: '1 1 200px', minWidth: '150px', background: 'var(--clr-bg-base)', padding: '0.4rem 1rem' }}>
          <Search size={16} className="text-muted" />
          <input
            placeholder="Search by name or email..."
            style={{ fontSize: '0.85rem' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Admin" : "Add New Admin"}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="form-input"
              required
              placeholder="e.g. John Smith"
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
              placeholder="e.g. john@example.com"
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
          <div className="form-group">
            <label className="form-label">Assigned Branch</label>
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
              {isSaving ? 'Saving...' : (editingId ? 'Update Admin' : 'Create Admin')}
            </button>
          </div>
        </form>
      </Modal>

      {loading ? (
        <div className="loading-state" style={{ padding: '4rem', textAlign: 'center' }}>
          <div className="spinner"></div>
          <p className="text-muted" style={{ marginTop: '1rem' }}>Loading admins...</p>
        </div>
      ) : (
        <div className="grid-cards">
          {filteredAdmins.map((admin) => (
            <div key={admin._id} className="glass-card trainer-card" style={{ padding: 0, position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'relative',
                height: '120px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.6) 0%, rgba(236, 72, 153, 0.6) 100%)',
              }} />

              <div style={{ padding: '2rem 2rem 1.5rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '1rem', right: '1.25rem', display: 'flex', gap: '0.5rem', zIndex: 10 }}>
                  <button className="btn-icon" onClick={() => handleOpenEdit(admin)} title="Edit">
                    <Edit2 size={14} />
                  </button>
                  <button className="btn-icon danger" onClick={() => handleDelete(admin._id)} title="Delete">
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
                  {admin.name?.charAt(0)}
                </div>

                <div className="text-center">
                  <h3 style={{ fontSize: '1.35rem', marginBottom: '0.25rem' }}>{admin.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <span className={`status-badge ${admin.status || 'active'}`}>
                      {admin.status || 'active'}
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
                      <Building2 size={12} /> {admin.branchCode || 'MAIN'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>
                      <Mail size={14} />
                      <span>{admin.email}</span>
                    </div>
                    {admin.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>
                        <Phone size={14} />
                        <span>{admin.phone}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--clr-text-muted)', fontSize: '0.8rem' }}>
                    <Shield size={14} />
                    <span>Branch Administrator</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminsPage;
