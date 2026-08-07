import React, { FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { forgotPassword } from "../features/auth/auth.api";
import { useAuthStore } from "../store/auth.store";
import { Dumbbell, Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { gymId, setGymId } = useAuthStore();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await forgotPassword({ gymId, email });
      setMessage("If your email is registered, you will receive a reset link shortly.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      background: 'var(--clr-bg-base)',
      position: 'relative',
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div className="bg-mesh">
        <div className="blob-1"></div>
        <div className="blob-2"></div>
      </div>

      <div className="glass-card" style={{ maxWidth: '450px', width: '90%', padding: '3rem', zIndex: 1 }}>
        <div className="text-center" style={{ marginBottom: '2.5rem' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            background: 'var(--clr-accent-gradient)',
            marginBottom: '1rem',
            color: 'white'
          }}>
            <Dumbbell size={32} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Forgot Password</h1>
          <p className="text-muted">Enter your email to reset your password</p>
        </div>

        {message ? (
          <div className="text-center">
            <div style={{ 
              background: 'rgba(16, 185, 129, 0.1)', 
              color: 'var(--clr-success)', 
              padding: '1rem', 
              borderRadius: '12px',
              fontSize: '0.95rem',
              marginBottom: '2rem',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              lineHeight: '1.5'
            }}>
              {message}
            </div>
            <Link to="/login" className="btn btn-secondary w-full" style={{ padding: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <ArrowLeft size={18} /> Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={submit}>
            {error && (
              <div style={{ 
                background: 'rgba(244, 63, 94, 0.1)', 
                color: 'var(--clr-danger)', 
                padding: '0.75rem', 
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '1.5rem',
                border: '1px solid rgba(244, 63, 94, 0.2)'
              }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Gym ID</label>
              <input 
                className="form-input"
                value={gymId} 
                onChange={(e) => setGymId(e.target.value)} 
                placeholder="Enter Gym ID" 
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
                <input 
                  className="form-input"
                  style={{ paddingLeft: '3rem' }}
                  type="email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="your@email.com" 
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary w-full" 
              style={{ padding: '0.875rem', marginBottom: '1.5rem' }}
              disabled={loading}
            >
              {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
            </button>

            <Link to="/login" className="text-muted" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '600', textDecoration: 'none' }}>
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
