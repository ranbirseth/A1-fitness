import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { forgotPassword } from "../features/auth/auth.api";
import { useAuthStore } from "../store/auth.store";
import { Dumbbell, Mail, ArrowLeft } from "lucide-react";
export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const { gymId, setGymId } = useAuthStore();
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);
        try {
            await forgotPassword({ gymId, email });
            setMessage("If your email is registered, you will receive a reset link shortly.");
        }
        catch (err) {
            setError(err.response?.data?.message || "Something went wrong. Please try again.");
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
                                }, children: _jsx(Dumbbell, { size: 32 }) }), _jsx("h1", { style: { fontSize: '2rem', fontWeight: '800' }, children: "Forgot Password" }), _jsx("p", { className: "text-muted", children: "Enter your email to reset your password" })] }), message ? (_jsxs("div", { className: "text-center", children: [_jsx("div", { style: {
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    color: 'var(--clr-success)',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    fontSize: '0.95rem',
                                    marginBottom: '2rem',
                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                    lineHeight: '1.5'
                                }, children: message }), _jsxs(Link, { to: "/login", className: "btn btn-secondary w-full", style: { padding: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }, children: [_jsx(ArrowLeft, { size: 18 }), " Back to Login"] })] })) : (_jsxs("form", { onSubmit: submit, children: [error && (_jsx("div", { style: {
                                    background: 'rgba(244, 63, 94, 0.1)',
                                    color: 'var(--clr-danger)',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    marginBottom: '1.5rem',
                                    border: '1px solid rgba(244, 63, 94, 0.2)'
                                }, children: error })), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Gym ID" }), _jsx("input", { className: "form-input", value: gymId, onChange: (e) => setGymId(e.target.value), placeholder: "Enter Gym ID", required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Email Address" }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx(Mail, { size: 18, style: { position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' } }), _jsx("input", { className: "form-input", style: { paddingLeft: '3rem' }, type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "your@email.com", required: true })] })] }), _jsx("button", { type: "submit", className: "btn btn-primary w-full", style: { padding: '0.875rem', marginBottom: '1.5rem' }, disabled: loading, children: loading ? 'Sending Reset Link...' : 'Send Reset Link' }), _jsxs(Link, { to: "/login", className: "text-muted", style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '600', textDecoration: 'none' }, children: [_jsx(ArrowLeft, { size: 16 }), " Back to Login"] })] }))] })] }));
}
