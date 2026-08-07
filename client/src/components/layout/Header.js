import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { Search, Bell, Moon, Sun, Menu, LogOut, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { Link } from 'react-router-dom';
const Header = ({ theme, toggleTheme, toggleSidebar }) => {
    const { user, logout } = useAuthStore();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    return (_jsxs("header", { className: "top-nav", children: [_jsx("div", { className: "nav-left", children: _jsx("button", { className: "hamburger-btn", onClick: toggleSidebar, "aria-label": "Toggle Menu", children: _jsx(Menu, { size: 24 }) }) }), _jsx("div", { className: "nav-center", children: _jsxs("div", { className: "search-bar", children: [_jsx(Search, { size: 18, className: "text-muted" }), _jsx("input", { type: "text", placeholder: "Search..." })] }) }), _jsx("div", { className: "nav-right", ref: dropdownRef, children: _jsxs("div", { className: "account-wrapper", children: [_jsxs("button", { className: "account-trigger", onClick: () => setIsDropdownOpen(!isDropdownOpen), "aria-label": "Account Settings", children: [_jsx("div", { className: "avatar-sm", children: user?.photo ? (_jsx("img", { src: user.photo, alt: user.name || "User", className: "avatar-img" })) : (user?.name?.charAt(0) || 'U') }), _jsx(Bell, { size: 18, className: "bell-icon" })] }), isDropdownOpen && (_jsxs("div", { className: "account-dropdown glass-panel", children: [_jsxs("div", { className: "dropdown-header", children: [_jsx("p", { className: "user-name", children: user?.name || 'User' }), _jsx("p", { className: "user-role text-muted", children: user?.role || 'Guest' })] }), _jsx("div", { className: "dropdown-divider" }), _jsxs("div", { className: "dropdown-section", children: [_jsx("p", { className: "section-title", children: "Notifications" }), _jsxs("div", { className: "notification-list", children: [_jsxs("div", { className: "notification-item", children: [_jsx("div", { className: "notif-dot" }), _jsx("p", { children: "New member registration: John Doe" })] }), _jsxs("div", { className: "notification-item", children: [_jsx("div", { className: "notif-dot" }), _jsx("p", { children: "Payment received: Invoice #INV-102" })] })] })] }), _jsx("div", { className: "dropdown-divider" }), _jsxs("div", { className: "dropdown-actions", children: [_jsxs("button", { className: "dropdown-item", onClick: toggleTheme, children: [theme === 'dark' ? _jsx(Sun, { size: 18 }) : _jsx(Moon, { size: 18 }), _jsx("span", { children: theme === 'dark' ? 'Light Mode' : 'Dark Mode' })] }), _jsxs(Link, { to: "/profile", className: "dropdown-item", onClick: () => setIsDropdownOpen(false), children: [_jsx(UserIcon, { size: 18 }), _jsx("span", { children: "My Profile" })] }), _jsxs("button", { className: "dropdown-item logout-btn", onClick: logout, children: [_jsx(LogOut, { size: 18 }), _jsx("span", { children: "Logout" })] })] })] }))] }) })] }));
};
export default Header;
