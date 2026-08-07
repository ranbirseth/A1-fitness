import React, { useEffect } from "react";
import { useAuthStore } from "../store/auth.store";
import { Clock, LogOut, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getMyProfile } from "../features/members/members.api";

export default function PendingApprovalPage() {
  const { user, logout, setUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // If they are already active, redirect them out of here
    if (user.status === "active") {
      navigate("/");
      return;
    }

    // Poll for status changes every 5 seconds
    const interval = setInterval(async () => {
      try {
        const { data } = await getMyProfile();
        const updatedUser = data.data;
        if (updatedUser) {
          if (updatedUser.status === "active") {
            setUser({ ...user, status: "active", paymentStatus: updatedUser.paymentStatus });
            navigate("/");
          } else if (updatedUser.status === "inactive") {
            logout();
            navigate("/account-inactive");
          }
        }
      } catch (error: any) {
        // If 403, it means account was likely discarded
        if (error.response?.status === 403) {
          logout();
          navigate("/account-inactive");
        }
        console.error("Polling status error:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user, navigate, setUser]);

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
          background: 'rgba(245, 158, 11, 0.1)',
          color: '#f59e0b',
          marginBottom: '2rem'
        }}>
          <Clock size={40} />
        </div>
        
        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1rem' }}>
          Approval Pending
        </h1>
        
        <p className="text-muted" style={{ fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
          Hello <strong>{user?.name}</strong>! Your account request has been sent to the administrator. 
          Please wait for approval before you can access the dashboard.
        </p>

        <div style={{ 
          background: 'rgba(255, 255, 255, 0.05)', 
          padding: '1.5rem', 
          borderRadius: '16px',
          marginBottom: '2.5rem',
          border: '1px solid var(--clr-glass-border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center', color: 'var(--clr-text-muted)' }}>
            <Mail size={18} />
            <span>We'll notify you at <strong>{user?.email}</strong></span>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="btn btn-secondary w-full" 
          style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
