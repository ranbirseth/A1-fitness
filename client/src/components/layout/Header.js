import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { Search, Bell, Moon, Sun, Menu, LogOut, User as UserIcon, Building2 } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useBranchStore } from '../../store/branch.store';
import { Link } from 'react-router-dom';
const Header = ({ theme, toggleTheme, toggleSidebar }) => {
    const { user, logout } = useAuthStore();
    const { branches, selectedBranch, setSelectedBranch, fetchBranches } = useBranchStore();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    useEffect(() => {
        if (user && (user.role === 'superadmin' || user.role === 'admin' || user.role === 'trainer')) {
            fetchBranches();
        }
    }, [user]);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const isSuperAdmin = user?.role === 'superadmin';
    const assignedBranch = user?.branchCode || 'MAIN';
    const branchName = branches.find(b => b.branchCode === (isSuperAdmin ? selectedBranch : assignedBranch))?.name || (isSuperAdmin && selectedBranch === 'ALL' ? 'All Branches' : assignedBranch);
    return (_jsxs("header", { className: "top-nav", children: [_jsx("div", { className: "nav-left", children: _jsx("button", { className: "hamburger-btn", onClick: toggleSidebar, "aria-label": "Toggle Menu", children: _jsx(Menu, { size: 24 }) }) }), _jsx("div", { className: "nav-center", children: _jsxs("div", { className: "search-bar", children: [_jsx(Search, { size: 18, className: "text-muted" }), _jsx("input", { type: "text", placeholder: "Search..." })] }) }), _jsxs("div", { className: "nav-right", style: { display: 'flex', alignItems: 'center', gap: '1rem' }, ref: dropdownRef, children: [user && user.role !== 'member' && (_jsxs("div", { className: "header-branch-pill", style: { display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-glass-card, rgba(255,255,255,0.06))', padding: '0.35rem 0.75rem', borderRadius: '20px', border: '1px solid var(--border-glass, rgba(255,255,255,0.1))', fontSize: '0.85rem' }, children: [_jsx(Building2, { size: 15, style: { color: 'var(--clr-primary, #8b5cf6)' } }), isSuperAdmin ? (_jsxs("select", { value: selectedBranch, onChange: (e) => setSelectedBranch(e.target.value), style: {
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'inherit',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    outline: 'none',
                                    cursor: 'pointer'
                                }, title: "Global Branch Context", children: [_jsx("option", { value: "ALL", style: { background: '#1e1b4b', color: '#fff' }, children: "All Branches" }), branches.map(b => (_jsxs("option", { value: b.branchCode, style: { background: '#1e1b4b', color: '#fff' }, children: [b.name, " (", b.branchCode, ")"] }, b._id)))] })) : (_jsx("span", { style: { fontWeight: 600 }, children: branchName }))] })), _jsxs("div", { className: "account-wrapper", children: [_jsxs("button", { className: "account-trigger", onClick: () => setIsDropdownOpen(!isDropdownOpen), "aria-label": "Account Settings", children: [_jsx("div", { className: "avatar-sm", children: user?.photo ? (_jsx("img", { src: user.photo, alt: user.name || "User", className: "avatar-img" })) : (user?.name?.charAt(0) || 'U') }), _jsx(Bell, { size: 18, className: "bell-icon" })] }), isDropdownOpen && (_jsxs("div", { className: "account-dropdown glass-panel", children: [_jsxs("div", { className: "dropdown-header", children: [_jsx("p", { className: "user-name", children: user?.name || 'User' }), _jsxs("p", { className: "user-role text-muted", children: [user?.role || 'Guest', " ", user?.branchCode ? `• ${user.branchCode}` : ''] })] }), _jsx("div", { className: "dropdown-divider" }), _jsxs("div", { className: "dropdown-section", children: [_jsx("p", { className: "section-title", children: "Notifications" }), _jsx("div", { className: "notification-list", children: _jsxs("div", { className: "notification-item", children: [_jsx("div", { className: "notif-dot" }), _jsx("p", { children: "System active across authorized branches" })] }) })] }), _jsx("div", { className: "dropdown-divider" }), _jsxs("div", { className: "dropdown-actions", children: [_jsxs("button", { className: "dropdown-item", onClick: toggleTheme, children: [theme === 'dark' ? _jsx(Sun, { size: 18 }) : _jsx(Moon, { size: 18 }), _jsx("span", { children: theme === 'dark' ? 'Light Mode' : 'Dark Mode' })] }), _jsxs(Link, { to: "/profile", className: "dropdown-item", onClick: () => setIsDropdownOpen(false), children: [_jsx(UserIcon, { size: 18 }), _jsx("span", { children: "My Profile" })] }), _jsxs("button", { className: "dropdown-item logout-btn", onClick: logout, children: [_jsx(LogOut, { size: 18 }), _jsx("span", { children: "Logout" })] })] })] }))] })] })] }));
};
export default Header;
