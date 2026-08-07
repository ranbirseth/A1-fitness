import React, { useEffect } from "react";
import { useAuthStore } from "../store/auth.store";
import { UserX, LogOut, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DiscardedPage() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Logout immediately on mount
    logout();
  }, [logout]);

  const handleLogout = () => {
    logout();
    navigate("/login");
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

      <div className="glass-card" style={{ 
        maxWidth: '500px', 
        width: '90%', 
        padding: '3rem', 
        textAlign: 'center',
        zIndex: 1
      }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: '80px',
          height: '80px',
          borderRadius: '24px',
          background: 'rgba(244, 63, 94, 0.1)',
          color: 'var(--clr-danger)',
          marginBottom: '2rem'
        }}>
          <UserX size={40} />
        </div>
        
        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1rem' }}>
          Access Revoked
        </h1>
        
        <p className="text-muted" style={{ fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
          Your account has been <strong>Discarded</strong> by the administrator. 
          You no longer have access to the dashboard.
        </p>

        <div style={{ 
          background: 'rgba(255, 255, 255, 0.05)', 
          padding: '1.5rem', 
          borderRadius: '16px',
          marginBottom: '2.5rem',
          border: '1px solid var(--clr-glass-border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center', color: 'var(--clr-text-muted)' }}>
            <Phone size={18} />
            <span>Please contact the administrator for further information.</span>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="btn btn-secondary w-full" 
          style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <LogOut size={18} />
          Back to Login
        </button>
      </div>
    </div>
  );
}
