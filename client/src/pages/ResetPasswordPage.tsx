import React, { FormEvent, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { resetPassword } from "../features/auth/auth.api";
import { Dumbbell, Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token!, { password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong. The link may have expired.");
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
          <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Reset Password</h1>
          <p className="text-muted">Enter your new password below</p>
        </div>

        {success ? (
          <div className="text-center">
            <div style={{ 
              background: 'rgba(16, 185, 129, 0.1)', 
              color: 'var(--clr-success)', 
              padding: '1.5rem', 
              borderRadius: '12px',
              fontSize: '1rem',
              marginBottom: '2rem',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <CheckCircle size={40} />
              <span>Password reset successfully!</span>
            </div>
            <Link to="/login" className="btn btn-primary w-full" style={{ padding: '0.875rem' }}>
              Back to Login
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
              <label className="form-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
                <input 
                  className="form-input"
                  style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
                  type={showPassword ? "text" : "password"}
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
                <input 
                  className="form-input"
                  style={{ paddingLeft: '3rem' }}
                  type="password"
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="••••••••" 
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary w-full" 
              style={{ padding: '0.875rem' }}
              disabled={loading}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
