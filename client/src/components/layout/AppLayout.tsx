import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuthStore } from '../../store/auth.store';
import { Navigate, useNavigate } from 'react-router-dom';
import { getMyProfile } from '../../features/members/members.api';

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

  // Background check for status changes (especially for members)
  useEffect(() => {
    if (user?.role === "member") {
      const interval = setInterval(async () => {
        try {
          const { data } = await getMyProfile();
          const updatedStatus = data.data?.status;
          const updatedPaymentStatus = data.data?.paymentStatus;
          if (updatedStatus && (updatedStatus !== user.status || updatedPaymentStatus !== user.paymentStatus)) {
            setUser({ ...user, status: updatedStatus, paymentStatus: updatedPaymentStatus });
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
