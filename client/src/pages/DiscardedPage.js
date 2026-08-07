import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
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
    return (_jsxs("div", { className: "login-page", style: {
            display: 'flex',
            minHeight: '100vh',
            background: 'var(--clr-bg-base)',
            position: 'relative',
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center'
        }, children: [_jsxs("div", { className: "bg-mesh", children: [_jsx("div", { className: "blob-1" }), _jsx("div", { className: "blob-2" })] }), _jsxs("div", { className: "glass-card", style: {
                    maxWidth: '500px',
                    width: '90%',
                    padding: '3rem',
                    textAlign: 'center',
                    zIndex: 1
                }, children: [_jsx("div", { style: {
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '80px',
                            height: '80px',
                            borderRadius: '24px',
                            background: 'rgba(244, 63, 94, 0.1)',
                            color: 'var(--clr-danger)',
                            marginBottom: '2rem'
                        }, children: _jsx(UserX, { size: 40 }) }), _jsx("h1", { style: { fontSize: '2rem', fontWeight: '800', marginBottom: '1rem' }, children: "Access Revoked" }), _jsxs("p", { className: "text-muted", style: { fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2rem' }, children: ["Your account has been ", _jsx("strong", { children: "Discarded" }), " by the administrator. You no longer have access to the dashboard."] }), _jsx("div", { style: {
                            background: 'rgba(255, 255, 255, 0.05)',
                            padding: '1.5rem',
                            borderRadius: '16px',
                            marginBottom: '2.5rem',
                            border: '1px solid var(--clr-glass-border)'
                        }, children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center', color: 'var(--clr-text-muted)' }, children: [_jsx(Phone, { size: 18 }), _jsx("span", { children: "Please contact the administrator for further information." })] }) }), _jsxs("button", { onClick: handleLogout, className: "btn btn-secondary w-full", style: { padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }, children: [_jsx(LogOut, { size: 18 }), "Back to Login"] })] })] }));
}
