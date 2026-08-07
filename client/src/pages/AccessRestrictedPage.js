import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
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
            }
            catch (error) {
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
                        }, children: isExpired ? _jsx(CalendarX, { size: 40 }) : _jsx(Lock, { size: 40 }) }), _jsx("h1", { style: { fontSize: '2rem', fontWeight: '800', marginBottom: '1rem' }, children: isExpired ? "Membership Expired" : "Access Restricted" }), _jsxs("p", { className: "text-muted", style: { fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2rem' }, children: ["Hello ", _jsx("strong", { children: user?.name }), "! ", isExpired
                                ? "Your gym membership has expired. Please renew your plan to continue using the gym facilities."
                                : user?.status === "frozen"
                                    ? "Your account has been frozen. Please contact the administrator to reactivate your membership."
                                    : user?.status === "cancelled"
                                        ? "Your membership has been cancelled. Please contact the gym to restart your plan."
                                        : "Access to the dashboard is currently restricted. Please contact the administrator for more details."] }), _jsx("div", { style: {
                            background: 'rgba(255, 255, 255, 0.05)',
                            padding: '1.5rem',
                            borderRadius: '16px',
                            marginBottom: '2.5rem',
                            border: '1px solid var(--clr-glass-border)'
                        }, children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center', color: 'var(--clr-text-muted)' }, children: [_jsx(CreditCard, { size: 18 }), _jsxs("span", { children: ["Please contact the ", _jsx("strong", { children: "Gym Admin" }), " to ", isExpired ? "renew" : "make payment"] })] }) }), _jsxs("button", { onClick: handleLogout, className: "btn btn-secondary w-full", style: { padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }, children: [_jsx(LogOut, { size: 18 }), "Sign Out"] })] })] }));
}
