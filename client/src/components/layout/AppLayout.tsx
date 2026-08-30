import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuthStore } from '../../store/auth.store';
import { Navigate, useNavigate } from 'react-router-dom';
import { getMyProfile as getMyMemberProfile } from '../../features/members/members.api';
import { getMyProfile as getMyUserProfile } from '../../features/users/users.api';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'dark' | 'light'>(
    (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // One-time session sync on mount so a branch rename (or any profile change)
  // survives a hard refresh - the persisted auth store is refreshed from the DB.
  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    const sync = async () => {
      try {
        if (user.role === "member") {
          const { data } = await getMyMemberProfile();
          const m = data.data;
          if (!cancelled && m) {
            setUser({
              ...user,
              name: m.user?.name || user.name,
              email: m.user?.email || user.email,
              phone: m.user?.phone || user.phone,
              photo: m.user?.photo || user.photo,
              branchCode: m.branchCode || user.branchCode || "MAIN",
              status: m.status ?? user.status,
              paymentStatus: m.paymentStatus ?? user.paymentStatus,
            });
          }
        } else {
          const { data } = await getMyUserProfile();
          if (!cancelled && data.data) {
            setUser({ ...user, ...data.data, paymentStatus: data.data.paymentStatus ?? user.paymentStatus });
          }
        }
      } catch (error) {
        console.error("Session sync error:", error);
      }
    };
    sync();
    return () => {
      cancelled = true;
    };
  }, []);

  // Background check for status changes (especially for members)
  useEffect(() => {
    if (user?.role === "member") {
      const interval = setInterval(async () => {
        try {
          const { data } = await getMyMemberProfile();
          const updatedStatus = data.data?.status;
          const updatedPaymentStatus = data.data?.paymentStatus;
          const updatedBranchCode = data.data?.branchCode;
          if (updatedStatus && (updatedStatus !== user.status || updatedPaymentStatus !== user.paymentStatus || (updatedBranchCode && updatedBranchCode !== user.branchCode))) {
            setUser({ ...user, status: updatedStatus, paymentStatus: updatedPaymentStatus, branchCode: updatedBranchCode || user.branchCode });
            if (updatedStatus === "inactive") {
              navigate("/account-inactive");
            } else if (updatedStatus === "pending") {
              navigate("/pending-approval");
            } else if (updatedStatus === "expired" || updatedStatus === "frozen") {
              navigate("/access-restricted");
            }
          }
        } catch (error) {
          console.error("Background status check error:", error);
        }
      }, 5000); 
      return () => clearInterval(interval);
    }
  }, [user, setUser, navigate]);

  // Additional layer of security for members
  if (user?.role === "member") {
    if (user.status === "pending") {
      return <Navigate to="/pending-approval" replace />;
    }
    if (user.status === "inactive") {
      return <Navigate to="/account-inactive" replace />;
    }
    if (user.status === "expired" || user.status === "frozen") {
      return <Navigate to="/access-restricted" replace />;
    }
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <div className={`app-layout ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="bg-mesh">
        <div className="blob-1"></div>
        <div className="blob-2"></div>
        <div className="blob-3"></div>
      </div>

      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="main-wrapper">
        <Header 
          theme={theme} 
          toggleTheme={toggleTheme} 
          toggleSidebar={toggleSidebar}
        />
        <div className="main-content" style={{ padding: '2rem' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
