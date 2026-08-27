import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Moon, Sun, Menu, ChevronDown, LogOut, User as UserIcon, Building2 } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useBranchStore } from '../../store/branch.store';
import { Link } from 'react-router-dom';

interface HeaderProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, toggleSidebar }) => {
  const { user, logout } = useAuthStore();
  const { branches, selectedBranch, setSelectedBranch, fetchBranches } = useBranchStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && (user.role === 'superadmin' || user.role === 'admin' || user.role === 'trainer')) {
      fetchBranches();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSuperAdmin = user?.role === 'superadmin';
  const assignedBranch = user?.branchCode || 'MAIN';
  const branchName = branches.find(b => b.branchCode === (isSuperAdmin ? selectedBranch : assignedBranch))?.name || (isSuperAdmin && selectedBranch === 'ALL' ? 'All Branches' : assignedBranch);

  return (
    <header className="top-nav">
      {/* Left: Hamburger Menu */}
      <div className="nav-left">
        <button className="hamburger-btn" onClick={toggleSidebar} aria-label="Toggle Menu">
          <Menu size={24} />
        </button>
      </div>

      {/* Center: Permanent Search Bar */}
      <div className="nav-center">
        <div className="search-bar">
          <Search size={18} className="text-muted" />
          <input type="text" placeholder="Search..." />
        </div>
      </div>

      {/* Right: Branch Selector & Account Icon */}
      <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} ref={dropdownRef}>
        {user && user.role !== 'member' && (
          <div className="header-branch-pill" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-glass-card, rgba(255,255,255,0.06))', padding: '0.35rem 0.75rem', borderRadius: '20px', border: '1px solid var(--border-glass, rgba(255,255,255,0.1))', fontSize: '0.85rem' }}>
            <Building2 size={15} style={{ color: 'var(--clr-primary, #8b5cf6)' }} />
            {isSuperAdmin ? (
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
                title="Global Branch Context"
              >
                <option value="ALL" style={{ background: '#1e1b4b', color: '#fff' }}>All Branches</option>
                {branches.map(b => (
                  <option key={b._id} value={b.branchCode} style={{ background: '#1e1b4b', color: '#fff' }}>
                    {b.name} ({b.branchCode})
                  </option>
                ))}
              </select>
            ) : (
              <span style={{ fontWeight: 600 }}>{branchName}</span>
            )}
          </div>
        )}

        <div className="account-wrapper">
          <button 
            className="account-trigger" 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-label="Account Settings"
          >
            <div className="avatar-sm">
              {user?.photo ? (
                <img src={user.photo} alt={user.name || "User"} className="avatar-img" />
              ) : (
                user?.name?.charAt(0) || 'U'
              )}
            </div>
            <Bell size={18} className="bell-icon" />
          </button>

          {isDropdownOpen && (
            <div className="account-dropdown glass-panel">
              <div className="dropdown-header">
                <p className="user-name">{user?.name || 'User'}</p>
                <p className="user-role text-muted">{user?.role || 'Guest'} {user?.branchCode ? `• ${user.branchCode}` : ''}</p>
              </div>
              
              <div className="dropdown-divider"></div>
              
              <div className="dropdown-section">
                <p className="section-title">Notifications</p>
                <div className="notification-list">
                  <div className="notification-item">
                    <div className="notif-dot"></div>
                    <p>System active across authorized branches</p>
                  </div>
                </div>
              </div>

              <div className="dropdown-divider"></div>

              <div className="dropdown-actions">
                <button className="dropdown-item" onClick={toggleTheme}>
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                  <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                <Link to="/profile" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                  <UserIcon size={18} />
                  <span>My Profile</span>
                </Link>
                <button className="dropdown-item logout-btn" onClick={logout}>
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
