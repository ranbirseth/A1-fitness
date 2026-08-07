import React, { useEffect, useState } from 'react';
import { getPayments, getAdminPayments, getInvoice, markAsPaid, markAsUnpaid } from '../features/payments/payments.api';
import { getMyProfile } from '../features/members/members.api';
import { useAuthStore } from '../store/auth.store';
import { CreditCard, Calendar, Clock, Download, FileText, Printer, AlertTriangle, Check, Search, Filter, MoreVertical, X, TrendingUp, Users, DollarSign } from 'lucide-react';
import Modal from '../components/Modal';

const PaymentsPage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  
  const [payments, setPayments] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, count: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Invoice Modal State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [fetchingInvoice, setFetchingInvoice] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payRes, profRes] = await Promise.all([
        isAdmin ? getAdminPayments() : getPayments(),
        isAdmin ? Promise.resolve({ data: { data: null } }) : getMyProfile()
      ]);
      
      const paymentData = payRes.data?.data;
      const items = Array.isArray(paymentData) ? paymentData : (paymentData?.items || []);
      setPayments(items);
      
      if (isAdmin) {
        const total = items.reduce((acc: number, p: any) => acc + (p.amount || 0), 0);
        const paid = items.filter((p: any) => p.status === 'paid').reduce((acc: number, p: any) => acc + (p.amount || 0), 0);
        const pending = items.filter((p: any) => p.status === 'pending').reduce((acc: number, p: any) => acc + (p.amount || 0), 0);
        setStats({ total, paid, pending, count: items.length });
      } else {
        setProfile(profRes.data?.data);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      if (currentStatus === 'pending') {
        await markAsPaid(id);
      } else {
        await markAsUnpaid(id);
      }
      fetchData(); // Refresh data
    } catch (error) {
      alert("Failed to update payment status");
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = isAdmin 
      ? p.member?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      : p.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleDownloadInvoice = async (id: string) => {
    setFetchingInvoice(true);
    try {
      const res = await getInvoice(id);
      setSelectedInvoice(res.data.data);
      setIsInvoiceModalOpen(true);
    } catch (error) {
      alert("Failed to fetch invoice data");
    } finally {
      setFetchingInvoice(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  // Calculate days until expiry
  const getDaysUntilExpiry = () => {
    if (!profile?.membershipExpiryDate) return null;
    const expiry = new Date(profile.membershipExpiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysUntilExpiry();
  const isExpirySoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
  const isExpired = daysLeft !== null && daysLeft <= 0;

  if (isAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <style>{`
          @media print {
            body * { visibility: hidden; }
            .invoice-printable, .invoice-printable * { visibility: visible; }
            .invoice-printable { position: absolute; left: 0; top: 0; width: 100%; }
            .btn-print { display: none !important; }
          }
          .stats-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 1.5rem;
            display: flex;
            align-items: center;
            gap: 1.25rem;
            transition: all 0.3s ease;
          }
          .stats-card:hover {
            transform: translateY(-4px);
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(139, 92, 246, 0.3);
          }
          .stats-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        `}</style>

        {/* Page Header */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Payment Management</h1>
            <p className="text-muted" style={{ marginTop: '0.5rem' }}>Overview of gym revenue and member billing</p>
          </div>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={18} /> Record New Payment
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          <div className="stats-card">
            <div className="stats-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--clr-primary)' }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>Total Revenue</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0 0 0' }}>₹{stats.total.toLocaleString()}</h3>
            </div>
          </div>
          <div className="stats-card">
            <div className="stats-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--clr-success)' }}>
              <Check size={24} />
            </div>
            <div>
              <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>Received</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0 0 0', color: 'var(--clr-success)' }}>₹{stats.paid.toLocaleString()}</h3>
            </div>
          </div>
          <div className="stats-card">
            <div className="stats-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--clr-warning)' }}>
              <Clock size={24} />
            </div>
            <div>
              <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>Pending</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0 0 0', color: 'var(--clr-warning)' }}>₹{stats.pending.toLocaleString()}</h3>
            </div>
          </div>
          <div className="stats-card">
            <div className="stats-icon" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--clr-info)' }}>
              <Users size={24} />
            </div>
            <div>
              <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>Transactions</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0 0 0' }}>{stats.count}</h3>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="glass-panel" style={{ 
          padding: '1.5rem', 
          display: 'flex', 
          gap: '1.25rem', 
          flexWrap: 'wrap', 
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
            <Search size={20} style={{ 
              position: 'absolute', 
              left: '1.25rem', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: 'var(--clr-primary)',
              opacity: 0.8
            }} />
            <input 
              type="text" 
              placeholder="Search by member name, email or invoice #..." 
              className="form-control"
              style={{ 
                paddingLeft: '3.5rem', 
                paddingRight: '3rem',
                width: '100%',
                height: '52px',
                fontSize: '1rem',
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '14px',
                color: '#fff',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--clr-primary)';
                e.target.style.boxShadow = '0 0 0 4px rgba(139, 92, 246, 0.1)';
                e.target.style.background = 'rgba(0, 0, 0, 0.3)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(139, 92, 246, 0.2)';
                e.target.style.boxShadow = 'none';
                e.target.style.background = 'rgba(0, 0, 0, 0.2)';
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--clr-text-muted)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              background: 'rgba(0, 0, 0, 0.2)',
              padding: '0.5rem 1rem',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              height: '52px'
            }}>
              <Filter size={18} style={{ color: 'var(--clr-primary)' }} />
              <select 
                className="form-control" 
                style={{ 
                  width: '140px', 
                  border: 'none', 
                  background: 'transparent', 
                  padding: 0, 
                  margin: 0,
                  height: 'auto',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#fff'
                }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all" style={{ background: '#1a1b23' }}>All Status</option>
                <option value="paid" style={{ background: '#1a1b23' }}>Paid</option>
                <option value="pending" style={{ background: '#1a1b23' }}>Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '5rem' }}>
              <div className="spinner" style={{ margin: '0 auto' }}></div>
              <p className="text-muted" style={{ marginTop: '1rem' }}>Loading payment data...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem' }}>
              <CreditCard size={64} style={{ color: 'var(--clr-text-muted)', opacity: 0.2, margin: '0 auto 1.5rem' }} />
              <h3 className="text-muted">No payments found</h3>
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>Try adjusting your search or filters</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ padding: '1rem 1.5rem' }}>Member</th>
                    <th style={{ padding: '1rem' }}>Plan</th>
                    <th style={{ padding: '1rem' }}>Amount</th>
                    <th style={{ padding: '1rem' }}>Date</th>
                    <th style={{ padding: '1rem' }}>Method</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                    <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p) => (
                    <tr key={p._id}>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ 
                            width: '36px', height: '36px', borderRadius: '10px', 
                            background: 'rgba(139, 92, 246, 0.1)', color: 'var(--clr-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '0.9rem'
                          }}>
                            {p.member?.user?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p style={{ fontWeight: 600, margin: 0 }}>{p.member?.user?.name || 'Unknown Member'}</p>
                            <p className="text-muted" style={{ fontSize: '0.75rem', margin: 0, fontFamily: 'monospace' }}>{p.invoiceNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ fontSize: '0.9rem' }}>{p.plan?.name || 'Manual'}</span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--clr-primary)' }}>₹{(p.amount || 0).toLocaleString()}</span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                          <Calendar size={14} className="text-muted" />
                          {new Date(p.date || p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ fontSize: '0.85rem', textTransform: 'capitalize', color: 'var(--clr-text-muted)' }}>{p.method || 'cash'}</span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <button 
                          onClick={() => handleToggleStatus(p._id, p.status)}
                          className={`status-badge ${p.status === 'paid' ? 'active' : 'pending'}`}
                          style={{ border: 'none', cursor: 'pointer', transition: 'all 0.2s ease' }}
                        >
                          {p.status}
                        </button>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn-icon" 
                            title="View Invoice"
                            onClick={() => handleDownloadInvoice(p._id)}
                            disabled={fetchingInvoice}
                          >
                            <FileText size={16} />
                          </button>
                          <button className="btn-icon" title="More Options">
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Invoice Modal (Same as member) */}
        <Modal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} title="Payment Invoice">
          {selectedInvoice && (
            <div className="invoice-printable" style={{ padding: '1rem', color: '#1a1a1a', background: 'white', borderRadius: '8px' }}>
              {/* ... (Existing Invoice Content) ... */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '2px solid #eee', paddingBottom: '1rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <img 
                    src="https://res.cloudinary.com/dyc33dchn/image/upload/q_auto/f_auto/v1776476678/WhatsApp_Image_2026-04-15_at_10.11.03_PM_2_jvuq84.jpg" 
                    alt="RUDRA FITNESS" 
                    style={{ width: '50px', height: '50px', borderRadius: '12px', objectFit: 'cover' }}
                  />
                  <div>
                    <h2 style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '0.25rem', fontSize: '1.4rem', fontFamily: '"Bebas Neue", sans-serif', fontWeight: '700', letterSpacing: '0.1em', margin: 0 }}>RUDRA FITNESS</h2>
                    <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>Premium Fitness Center</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h3 style={{ marginBottom: '0.25rem' }}>INVOICE</h3>
                  <p style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{selectedInvoice.invoiceNumber}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#888', marginBottom: '0.5rem' }}>Billed To</h4>
                  <p style={{ fontWeight: 'bold' }}>{selectedInvoice.member?.user?.name}</p>
                  <p style={{ fontSize: '0.85rem' }}>{selectedInvoice.member?.user?.email}</p>
                  <p style={{ fontSize: '0.85rem' }}>{selectedInvoice.member?.user?.phone}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#888', marginBottom: '0.5rem' }}>Payment Details</h4>
                  <p style={{ fontSize: '0.85rem' }}>Date: {new Date(selectedInvoice.date).toLocaleDateString()}</p>
                  <p style={{ fontSize: '0.85rem' }}>Method: <span style={{ textTransform: 'capitalize' }}>{selectedInvoice.method}</span></p>
                  <p style={{ fontSize: '0.85rem' }}>Status: <span style={{ color: selectedInvoice.status === 'paid' ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>{selectedInvoice.status.toUpperCase()}</span></p>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid #eee' }}>Description</th>
                    <th style={{ textAlign: 'right', padding: '12px', borderBottom: '1px solid #eee' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <p style={{ fontWeight: 'bold' }}>{selectedInvoice.plan?.name || 'Membership Plan'}</p>
                      <p style={{ fontSize: '0.75rem', color: '#666' }}>{selectedInvoice.plan?.duration} Days Access</p>
                    </td>
                    <td style={{ textAlign: 'right', padding: '12px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>₹{selectedInvoice.amount.toLocaleString()}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>Total</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--clr-primary)' }}>₹{selectedInvoice.amount.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>

              <div style={{ textAlign: 'center', marginTop: '3rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                <p style={{ fontSize: '0.8rem', color: '#888' }}>Thank you for your business!</p>
                <p style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '0.5rem' }}>This is a computer-generated invoice.</p>
              </div>

              <div className="btn-print" style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                <button className="btn btn-primary flex-1" onClick={handlePrint}>
                  <Printer size={18} /> Print Invoice
                </button>
                <button className="btn btn-secondary flex-1" onClick={handleDownloadPDF}>
                  <Download size={18} /> Download (PDF)
                </button>
                <button className="btn btn-secondary" onClick={() => setIsInvoiceModalOpen(false)}>Close</button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  // Member View (Original)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .invoice-printable, .invoice-printable * { visibility: visible; }
          .invoice-printable { position: absolute; left: 0; top: 0; width: 100%; }
          .btn-print { display: none !important; }
        }
      `}</style>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>My Payments & Billing</h1>
          <p className="text-muted">Manage your subscription and payment history</p>
        </div>
      </div>

      {/* Active Plan Section */}
      {profile?.currentPlan ? (
        <div className="glass-panel" style={{ padding: 0, background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)', border: '1px solid rgba(139, 92, 246, 0.2)', overflow: 'hidden' }}>
          {/* Premium Banner Image */}
          <div style={{ 
            position: 'relative', 
            height: '180px', 
            background: `linear-gradient(135deg, rgba(139, 92, 246, 0.6) 0%, rgba(6, 182, 212, 0.6) 100%), url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=300&fit=crop')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderBottom: '2px solid rgba(139, 92, 246, 0.2)'
          }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', padding: '1.5rem', background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)' }}>
              <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'white', margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>Premium Membership</h2>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>Your exclusive fitness journey</p>
              </div>
            </div>
          </div>

          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(139, 92, 246, 0.15)', borderRadius: '12px', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={24} style={{ color: 'var(--clr-primary)' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '1rem', margin: 0 }}>Plan Details</h2>
                <p className="text-muted" style={{ fontSize: '0.8rem', margin: '0.25rem 0 0 0' }}>Your current subscription</p>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span className="status-badge active">Active</span>
              </div>
            </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, marginBottom: '0.5rem' }}>Plan Name</p>
              <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--clr-primary)', margin: 0 }}>{profile.currentPlan.name}</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, marginBottom: '0.5rem' }}>Start Date</p>
              <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>
                {profile.membershipStartDate ? new Date(profile.membershipStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : 'N/A'}
              </p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, marginBottom: '0.5rem' }}>Expiry Date</p>
              <p style={{ fontWeight: 600, fontSize: '0.95rem', color: isExpired ? 'var(--clr-danger)' : isExpirySoon ? 'var(--clr-warning)' : 'inherit', margin: 0 }}>
                {profile.membershipExpiryDate ? new Date(profile.membershipExpiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : 'N/A'}
              </p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, marginBottom: '0.5rem' }}>Days Left</p>
              <p style={{ fontWeight: 700, fontSize: '1.1rem', color: isExpired ? 'var(--clr-danger)' : isExpirySoon ? 'var(--clr-warning)' : 'var(--clr-success)', margin: 0 }}>
                {daysLeft === null ? 'N/A' : daysLeft <= 0 ? 'Expired' : `${daysLeft} days`}
              </p>
            </div>
          </div>

          {isExpired && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(244, 63, 94, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
              <AlertTriangle size={20} style={{ color: 'var(--clr-danger)', flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 600, color: 'var(--clr-danger)', margin: 0, marginBottom: '0.25rem' }}>Subscription Expired</p>
                <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>Your subscription has expired. Please renew to continue accessing the gym.</p>
              </div>
            </div>
          )}

          {isExpirySoon && !isExpired && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <Clock size={20} style={{ color: 'var(--clr-warning)', flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 600, color: 'var(--clr-warning)', margin: 0, marginBottom: '0.25rem' }}>Expiring Soon</p>
                <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>Your subscription expires in {daysLeft} days. Renew now to avoid interruption.</p>
              </div>
            </div>
          )}
            </div>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <AlertTriangle size={32} style={{ color: 'var(--clr-warning)', margin: '0 auto 0.5rem' }} />
          <p className="text-muted" style={{ marginBottom: '0.35rem' }}>No active plan assigned</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>Please contact the admin to subscribe to a plan.</p>
        </div>
      )}

      {/* Payment History Section */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard size={24} style={{ color: 'var(--clr-success)' }} />
          </div>
          <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Payment History</h2>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <CreditCard size={48} style={{ color: 'var(--clr-text-muted)', opacity: 0.3, margin: '0 auto 1rem' }} />
            <p className="text-muted">No payment records found</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="table-container hide-on-mobile" style={{ margin: 0, border: 'none', background: 'transparent', overflowX: 'auto' }}>
              <table className="data-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '0.75rem 1rem' }}>Invoice #</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Plan</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Amount</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p) => (
                    <tr key={p._id}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: '600', color: 'var(--clr-primary)', fontSize: '0.8rem' }}>
                          {p.invoiceNumber}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className="status-badge active" style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--clr-primary)', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                          {p.plan?.name || 'Manual Payment'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '700' }}>₹{(p.amount || 0).toLocaleString()}</td>
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>{new Date(p.date || p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className={`status-badge ${p.status === 'paid' ? 'active' : 'pending'}`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {p.status === 'paid' ? <Check size={12} /> : <Clock size={12} />}
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <button 
                          className="btn-icon" 
                          style={{ width: '28px', height: '28px' }} 
                          onClick={() => handleDownloadInvoice(p._id)} 
                          title="View Invoice"
                          disabled={fetchingInvoice}
                        >
                          <FileText size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="mobile-cards-container">
              {filteredPayments.map((p) => (
                <div 
                  key={p._id} 
                  className="mobile-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleDownloadInvoice(p._id)}
                >
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Invoice</span>
                    <span className="mobile-card-value" style={{ fontFamily: 'monospace', fontWeight: '600', color: 'var(--clr-primary)' }}>
                      {p.invoiceNumber}
                    </span>
                  </div>
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Plan</span>
                    <span className="mobile-card-value">{p.plan?.name || 'Manual Payment'}</span>
                  </div>
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Amount</span>
                    <span className="mobile-card-value" style={{ fontWeight: '700', color: 'var(--clr-primary)' }}>₹{(p.amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Date</span>
                    <span className="mobile-card-value">{new Date(p.date || p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</span>
                  </div>
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Status</span>
                    <span className={`status-badge ${p.status === 'paid' ? 'active' : 'pending'}`} style={{ fontSize: '0.75rem' }}>
                      {p.status}
                    </span>
                  </div>
                  <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                    <p className="text-muted" style={{ fontSize: '0.7rem', margin: 0 }}>Tap to view invoice</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Invoice Modal */}
      <Modal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} title="Payment Invoice">
        {selectedInvoice && (
          <div className="invoice-printable" style={{ padding: '1rem', color: '#1a1a1a', background: 'white', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '2px solid #eee', paddingBottom: '1rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img 
                  src="https://res.cloudinary.com/dyc33dchn/image/upload/q_auto/f_auto/v1776476678/WhatsApp_Image_2026-04-15_at_10.11.03_PM_2_jvuq84.jpg" 
                  alt="RUDRA FITNESS" 
                  style={{ width: '50px', height: '50px', borderRadius: '12px', objectFit: 'cover' }}
                />
                <div>
                  <h2 style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '0.25rem', fontSize: '1.4rem', fontFamily: '"Bebas Neue", sans-serif', fontWeight: '700', letterSpacing: '0.1em', margin: 0 }}>RUDRA FITNESS</h2>
                  <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>Premium Fitness Center</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h3 style={{ marginBottom: '0.25rem' }}>INVOICE</h3>
                <p style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{selectedInvoice.invoiceNumber}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#888', marginBottom: '0.5rem' }}>Billed To</h4>
                <p style={{ fontWeight: 'bold' }}>{selectedInvoice.member?.user?.name}</p>
                <p style={{ fontSize: '0.85rem' }}>{selectedInvoice.member?.user?.email}</p>
                <p style={{ fontSize: '0.85rem' }}>{selectedInvoice.member?.user?.phone}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#888', marginBottom: '0.5rem' }}>Payment Details</h4>
                <p style={{ fontSize: '0.85rem' }}>Date: {new Date(selectedInvoice.date).toLocaleDateString()}</p>
                <p style={{ fontSize: '0.85rem' }}>Method: <span style={{ textTransform: 'capitalize' }}>{selectedInvoice.method}</span></p>
                <p style={{ fontSize: '0.85rem' }}>Status: <span style={{ color: selectedInvoice.status === 'paid' ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>{selectedInvoice.status.toUpperCase()}</span></p>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid #eee' }}>Description</th>
                  <th style={{ textAlign: 'right', padding: '12px', borderBottom: '1px solid #eee' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    <p style={{ fontWeight: 'bold' }}>{selectedInvoice.plan?.name || 'Membership Plan'}</p>
                    <p style={{ fontSize: '0.75rem', color: '#666' }}>{selectedInvoice.plan?.duration} Days Access</p>
                  </td>
                  <td style={{ textAlign: 'right', padding: '12px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>₹{selectedInvoice.amount.toLocaleString()}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>Total</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--clr-primary)' }}>₹{selectedInvoice.amount.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>

            <div style={{ textAlign: 'center', marginTop: '3rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
              <p style={{ fontSize: '0.8rem', color: '#888' }}>Thank you for your business!</p>
              <p style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '0.5rem' }}>This is a computer-generated invoice.</p>
            </div>

            <div className="btn-print" style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              <button className="btn btn-primary flex-1" onClick={handlePrint}>
                <Printer size={18} /> Print Invoice
              </button>
              <button className="btn btn-secondary flex-1" onClick={handleDownloadPDF}>
                <Download size={18} /> Download (PDF)
              </button>
              <button className="btn btn-secondary" onClick={() => setIsInvoiceModalOpen(false)}>Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PaymentsPage;
