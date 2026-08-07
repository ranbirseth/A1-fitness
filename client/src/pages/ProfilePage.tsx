import React, { FormEvent, useEffect, useState } from "react";
import { getMyProfile, updateMyProfile } from "../features/members/members.api";
import { User, Mail, Phone, Camera, Save } from "lucide-react";

export default function ProfilePage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", photo: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getMyProfile()
      .then((res) => {
        const u = res.data?.data?.user || {};
        setForm({ 
          name: u.name || "", 
          email: u.email || "", 
          phone: u.phone || "", 
          photo: u.photo || "" 
        });
      })
      .catch(() => null);
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateMyProfile(form);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Update failed', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1>My Profile</h1>
        <p className="text-muted">Manage your personal information and preferences.</p>
      </div>

      <div className="glass-panel" style={{ padding: '2.5rem' }}>
        <form onSubmit={submit}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem', position: 'relative' }}>
            <div style={{ 
              width: '120px', 
              height: '120px', 
              borderRadius: '50%', 
              background: 'var(--clr-accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
              fontWeight: '700',
              color: 'white',
              position: 'relative',
              boxShadow: '0 0 20px var(--clr-primary-glow)'
            }}>
              {form.photo ? (
                <img src={form.photo} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                form.name.charAt(0) || 'U'
              )}
              <button 
                type="button"
                className="btn-icon" 
                style={{ 
                  position: 'absolute', 
                  bottom: '0', 
                  right: '0', 
                  background: 'var(--clr-bg-card)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px'
                }}
              >
                <Camera size={18} />
              </button>
            </div>
          </div>

          <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
                <input 
                  className="form-input"
                  style={{ paddingLeft: '3rem' }}
                  value={form.name} 
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} 
                  placeholder="Your Name" 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
                <input 
                  className="form-input"
                  style={{ paddingLeft: '3rem' }}
                  type="email"
                  value={form.email} 
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} 
                  placeholder="email@example.com" 
                  disabled
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
                <input 
                  className="form-input"
                  style={{ paddingLeft: '3rem' }}
                  value={form.phone} 
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} 
                  placeholder="+91 0000000000" 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Profile Photo URL</label>
              <div style={{ position: 'relative' }}>
                <Camera size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
                <input 
                  className="form-input"
                  style={{ paddingLeft: '3rem' }}
                  value={form.photo} 
                  onChange={(e) => setForm((f) => ({ ...f, photo: e.target.value }))} 
                  placeholder="https://image-url.com" 
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0.8rem 2.5rem' }}>
              <Save size={18} />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
