import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signup } from "../features/auth/auth.api";
import { useAuthStore } from "../store/auth.store";
import { Dumbbell, Mail, Lock, User, Phone, Eye, EyeOff } from "lucide-react";
export default function SignupPage() {
    const navigate = useNavigate();
    const { setAuth, user } = useAuthStore();
    const [formData, setFormData] = useState({
        gymId: "MAIN",
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "member"
    });
    React.useEffect(() => {
        if (user) {
            if (user.role === "member") {
                if (user.status === "pending") {
                    navigate("/pending-approval");
                }
                else if (user.status === "inactive") {
                    navigate("/account-inactive");
                }
                else {
                    navigate("/");
                }
            }
            else {
                navigate("/");
            }
        }
    }, [user, navigate]);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const { data } = await signup(formData);
            const userData = data.data.user;
            setAuth(userData, data.data.accessToken);
            if (userData.role === "member") {
                if (userData.status === "pending") {
                    navigate("/pending-approval");
                }
                else if (userData.status === "inactive") {
                    navigate("/account-inactive");
                }
                else {
                    navigate("/");
                }
            }
            else {
                navigate("/");
            }
        }
        catch (err) {
            setError(err.response?.data?.message || "Signup failed. Please try again.");
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
            overflow: 'hidden'
        }, children: [_jsxs("div", { className: "bg-mesh", children: [_jsx("div", { className: "blob-1" }), _jsx("div", { className: "blob-2" })] }), _jsx("div", { className: "login-left", style: {
                    flex: '0 0 450px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '3rem',
                    zIndex: 1
                }, children: _jsxs("div", { className: "glass-card", style: { padding: '2rem' }, children: [_jsxs("div", { className: "text-center", style: { marginBottom: '2rem' }, children: [_jsx("div", { style: {
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '12px',
                                        background: 'var(--clr-accent-gradient)',
                                        marginBottom: '1rem',
                                        color: 'white'
                                    }, children: _jsx(Dumbbell, { size: 28 }) }), _jsx("h1", { style: { fontSize: '1.75rem', fontWeight: '800' }, children: "Create Account" }), _jsx("p", { className: "text-muted", children: "Join the Gymza community" })] }), _jsxs("form", { onSubmit: submit, children: [error && (_jsx("div", { style: {
                                        background: 'rgba(244, 63, 94, 0.1)',
                                        color: 'var(--clr-danger)',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        marginBottom: '1.5rem',
                                        border: '1px solid rgba(244, 63, 94, 0.2)'
                                    }, children: error })), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Gym ID" }), _jsx("input", { name: "gymId", className: "form-input", value: formData.gymId, onChange: handleChange, placeholder: "Enter Gym ID", required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Full Name" }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx(User, { size: 18, style: { position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' } }), _jsx("input", { name: "name", className: "form-input", style: { paddingLeft: '3rem' }, value: formData.name, onChange: handleChange, placeholder: "John Doe", required: true })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Sign up as" }), _jsxs("select", { name: "role", className: "form-input", value: formData.role, onChange: handleChange, required: true, children: [_jsx("option", { value: "member", children: "Member" }), _jsx("option", { value: "trainer", children: "Trainer" }), _jsx("option", { value: "admin", children: "Admin" })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Email Address" }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx(Mail, { size: 18, style: { position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' } }), _jsx("input", { name: "email", className: "form-input", style: { paddingLeft: '3rem' }, type: "email", value: formData.email, onChange: handleChange, placeholder: "john@example.com", required: true })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Phone Number" }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx(Phone, { size: 18, style: { position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' } }), _jsx("input", { name: "phone", className: "form-input", style: { paddingLeft: '3rem' }, value: formData.phone, onChange: handleChange, placeholder: "1234567890" })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Password" }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx(Lock, { size: 18, style: { position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' } }), _jsx("input", { name: "password", className: "form-input", style: { paddingLeft: '3rem', paddingRight: '3rem' }, type: showPassword ? "text" : "password", value: formData.password, onChange: handleChange, placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), style: { position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }, children: showPassword ? _jsx(EyeOff, { size: 18 }) : _jsx(Eye, { size: 18 }) })] })] }), _jsx("button", { type: "submit", className: "btn btn-primary w-full", style: { padding: '0.875rem', marginTop: '1rem' }, disabled: loading, children: loading ? 'Creating Account...' : 'Sign Up' })] }), _jsx("div", { className: "text-center", style: { marginTop: '1.5rem' }, children: _jsxs("p", { className: "text-muted", style: { fontSize: '0.9rem' }, children: ["Already have an account? ", _jsx(Link, { to: "/login", style: { color: 'var(--clr-primary)', fontWeight: '600' }, children: "Sign in" })] }) })] }) }), _jsx("div", { className: "login-right", style: { flex: 1, position: 'relative' } })] }));
}
