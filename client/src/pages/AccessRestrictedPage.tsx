import React, { useEffect } from "react";
import { useAuthStore } from "../store/auth.store";
import { Lock, LogOut, CreditCard, CalendarX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getMyProfile } from "../features/members/members.api";

export default function AccessRestrictedPage() {
  const { user, logout, setUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // If they are active, send them to dashboard
    if (user.status === "active") {
      navigate("/");
      return;
    }

    // If they were set back to pending or inactive, redirect to those pages
    if (user.status === "pending") {
      navigate("/pending-approval");
      return;
    }
    if (user.status === "inactive") {
      navigate("/account-inactive");
      return;
    }

    // Poll for status/payment changes every 5 seconds
    const interval = setInterval(async () => {
      try {
        const { data } = await getMyProfile();
        const updatedUser = data.data;
        if (updatedUser) {
          const isNowActive = updatedUser.status === "active";
          if (isNowActive) {
            setUser({ ...user, status: updatedUser.status, paymentStatus: updatedUser.paymentStatus });
            navigate("/");
          }
        }
      } catch (error) {
        console.error("Polling restricted status error:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user, navigate, setUser]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isExpired = user?.status === "expired";

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
          {isExpired ? <CalendarX size={40} /> : <Lock size={40} />}
        </div>
        
        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1rem' }}>
          {isExpired ? "Membership Expired" : "Access Restricted"}
        </h1>
        
        <p className="text-muted" style={{ fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
          Hello <strong>{user?.name}</strong>! {isExpired 
            ? "Your gym membership has expired. Please renew your plan to continue using the gym facilities." 
            : user?.status === "frozen" 
              ? "Your account has been frozen. Please contact the administrator to reactivate your membership."
              : user?.status === "cancelled"
                ? "Your membership has been cancelled. Please contact the gym to restart your plan."
                : "Access to the dashboard is currently restricted. Please contact the administrator for more details."}
        </p>

        <div style={{ 
          background: 'rgba(255, 255, 255, 0.05)', 
          padding: '1.5rem', 
          borderRadius: '16px',
          marginBottom: '2.5rem',
          border: '1px solid var(--clr-glass-border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center', color: 'var(--clr-text-muted)' }}>
            <CreditCard size={18} />
            <span>Please contact the <strong>Gym Admin</strong> to {isExpired ? "renew" : "make payment"}</span>
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
