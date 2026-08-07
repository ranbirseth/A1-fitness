import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Moon, Sun, Menu, X, ChevronDown, LogOut, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { Link } from 'react-router-dom';

interface HeaderProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, toggleSidebar }) => {
  const { user, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      {/* Right: Account Icon & Dropdown */}
      <div className="nav-right" ref={dropdownRef}>
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
                <p className="user-role text-muted">{user?.role || 'Guest'}</p>
              </div>
              
              <div className="dropdown-divider"></div>
              
              <div className="dropdown-section">
                <p className="section-title">Notifications</p>
                <div className="notification-list">
                  <div className="notification-item">
                    <div className="notif-dot"></div>
                    <p>New member registration: John Doe</p>
                  </div>
                  <div className="notification-item">
                    <div className="notif-dot"></div>
                    <p>Payment received: Invoice #INV-102</p>
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
