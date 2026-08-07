import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
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
                    }
                    else if (updatedUser.status === "inactive") {
                        logout();
                        navigate("/account-inactive");
                    }
                }
            }
            catch (error) {
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
                            background: 'rgba(245, 158, 11, 0.1)',
                            color: '#f59e0b',
                            marginBottom: '2rem'
                        }, children: _jsx(Clock, { size: 40 }) }), _jsx("h1", { style: { fontSize: '2rem', fontWeight: '800', marginBottom: '1rem' }, children: "Approval Pending" }), _jsxs("p", { className: "text-muted", style: { fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2rem' }, children: ["Hello ", _jsx("strong", { children: user?.name }), "! Your account request has been sent to the administrator. Please wait for approval before you can access the dashboard."] }), _jsx("div", { style: {
                            background: 'rgba(255, 255, 255, 0.05)',
                            padding: '1.5rem',
                            borderRadius: '16px',
                            marginBottom: '2.5rem',
                            border: '1px solid var(--clr-glass-border)'
                        }, children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center', color: 'var(--clr-text-muted)' }, children: [_jsx(Mail, { size: 18 }), _jsxs("span", { children: ["We'll notify you at ", _jsx("strong", { children: user?.email })] })] }) }), _jsxs("button", { onClick: handleLogout, className: "btn btn-secondary w-full", style: { padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }, children: [_jsx(LogOut, { size: 18 }), "Sign Out"] })] })] }));
}
