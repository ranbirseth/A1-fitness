import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { resetPassword } from "../features/auth/auth.api";
import { Dumbbell, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
export default function ResetPasswordPage() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const submit = async (e) => {
        e.preventDefault();
        setError("");
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }
        setLoading(true);
        try {
            await resetPassword(token, { password });
            setSuccess(true);
        }
        catch (err) {
            setError(err.response?.data?.message || "Something went wrong. The link may have expired.");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "login-page", style: {
            display: 'flex',
            minHeight: '100vh',
            background: 'var(--clr-bg-base)',
            position: 'relative',
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center'
        }, children: [_jsxs("div", { className: "bg-mesh", children: [_jsx("div", { className: "blob-1" }), _jsx("div", { className: "blob-2" })] }), _jsxs("div", { className: "glass-card", style: { maxWidth: '450px', width: '90%', padding: '3rem', zIndex: 1 }, children: [_jsxs("div", { className: "text-center", style: { marginBottom: '2.5rem' }, children: [_jsx("div", { style: {
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '16px',
                                    background: 'var(--clr-accent-gradient)',
                                    marginBottom: '1rem',
                                    color: 'white'
                                }, children: _jsx(Dumbbell, { size: 32 }) }), _jsx("h1", { style: { fontSize: '2rem', fontWeight: '800' }, children: "Reset Password" }), _jsx("p", { className: "text-muted", children: "Enter your new password below" })] }), success ? (_jsxs("div", { className: "text-center", children: [_jsxs("div", { style: {
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    color: 'var(--clr-success)',
                                    padding: '1.5rem',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    marginBottom: '2rem',
                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '1rem'
                                }, children: [_jsx(CheckCircle, { size: 40 }), _jsx("span", { children: "Password reset successfully!" })] }), _jsx(Link, { to: "/login", className: "btn btn-primary w-full", style: { padding: '0.875rem' }, children: "Back to Login" })] })) : (_jsxs("form", { onSubmit: submit, children: [error && (_jsx("div", { style: {
                                    background: 'rgba(244, 63, 94, 0.1)',
                                    color: 'var(--clr-danger)',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    marginBottom: '1.5rem',
                                    border: '1px solid rgba(244, 63, 94, 0.2)'
                                }, children: error })), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "New Password" }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx(Lock, { size: 18, style: { position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' } }), _jsx("input", { className: "form-input", style: { paddingLeft: '3rem', paddingRight: '3rem' }, type: showPassword ? "text" : "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), style: { position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }, children: showPassword ? _jsx(EyeOff, { size: 18 }) : _jsx(Eye, { size: 18 }) })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Confirm New Password" }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx(Lock, { size: 18, style: { position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' } }), _jsx("input", { className: "form-input", style: { paddingLeft: '3rem' }, type: "password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true })] })] }), _jsx("button", { type: "submit", className: "btn btn-primary w-full", style: { padding: '0.875rem' }, disabled: loading, children: loading ? 'Resetting Password...' : 'Reset Password' })] }))] })] }));
}
