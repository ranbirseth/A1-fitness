import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, UserSquare2, CreditCard, CalendarCheck, Settings, LogOut, Dumbbell, ClipboardList, X } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { logout as logoutApi } from '../../features/auth/auth.api';
const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const onLogout = async () => {
        try {
            await logoutApi();
        }
        catch (error) {
            console.error('Logout failed', error);
        }
        logout();
        navigate('/login');
    };
    const navItems = [
        { name: 'Dashboard', path: '/', icon: _jsx(LayoutDashboard, { size: 20 }), roles: ['admin', 'trainer'] },
        { name: 'Members', path: '/members', icon: _jsx(Users, { size: 20 }), roles: ['admin', 'trainer'] },
        { name: 'Trainers', path: '/trainers', icon: _jsx(UserSquare2, { size: 20 }), roles: ['admin'] },
        { name: 'Plans', path: '/plans', icon: _jsx(ClipboardList, { size: 20 }), roles: ['admin'] },
        { name: 'Attendance', path: '/attendance', icon: _jsx(CalendarCheck, { size: 20 }), roles: ['admin', 'trainer'] },
        { name: 'My Attendance', path: '/my-attendance', icon: _jsx(CalendarCheck, { size: 20 }), roles: ['member'] },
        { name: 'Workouts & Diet', path: '/workouts', icon: _jsx(Dumbbell, { size: 20 }), roles: ['admin', 'trainer', 'member'] },
        { name: 'Payments', path: '/payments', icon: _jsx(CreditCard, { size: 20 }), roles: ['admin', 'member'] },
    ];
    const filteredNavItems = navItems.filter(item => !item.roles || (user && item.roles.includes(user.role)));
    return (_jsxs("aside", { className: `sidebar ${isOpen ? 'open' : ''}`, children: [_jsxs("div", { className: "sidebar-header", children: [_jsxs("div", { className: "sidebar-logo", children: [_jsx("img", { src: "https://res.cloudinary.com/dyc33dchn/image/upload/q_auto/f_auto/v1776476678/WhatsApp_Image_2026-04-15_at_10.11.03_PM_2_jvuq84.jpg", alt: "RUDRA FITNESS", style: {
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '8px',
                                    objectFit: 'cover'
                                } }), _jsx("span", { className: "text-gradient", style: {
                                    letterSpacing: '0.08em',
                                    fontSize: '1.1rem',
                                    fontFamily: '"Bebas Neue", sans-serif',
                                    fontWeight: '700',
                                    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text'
                                }, children: "RUDRA" })] }), _jsx("button", { className: "sidebar-close-btn", onClick: onClose, children: _jsx(X, { size: 24 }) })] }), _jsx("nav", { className: "sidebar-nav", children: filteredNavItems.map((item) => (_jsxs(NavLink, { to: item.path, className: ({ isActive }) => `nav-item ${isActive ? 'active' : ''}`, onClick: onClose, children: [item.icon, _jsx("span", { children: item.name })] }, item.path))) }), _jsxs("div", { className: "sidebar-footer", children: [_jsxs(NavLink, { to: "/settings", className: ({ isActive }) => `nav-item ${isActive ? 'active' : ''}`, onClick: onClose, children: [_jsx(Settings, { size: 20 }), _jsx("span", { children: "Settings" })] }), _jsxs("button", { onClick: onLogout, className: "nav-item", style: { width: '100%', textAlign: 'left' }, children: [_jsx(LogOut, { size: 20 }), _jsx("span", { children: "Logout" })] })] })] }));
};
export default Sidebar;
