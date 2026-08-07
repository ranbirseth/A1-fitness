import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../features/auth/auth.api";
import { useAuthStore } from "../store/auth.store";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
const animationStyles = `
  * {
    box-sizing: border-box;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  /* Mobile and Tablet - With Animation and Background Image */
  @media (max-width: 1023px) {
    .login-page {
      background-image: linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.3) 100%), 
                        url('https://m.gettywallpapers.com/iphone/wp-content/uploads/2023/07/Gym-iPhone-Wallpaper-HD.jpg') !important;
      background-size: cover !important;
      background-position: center !important;
      background-attachment: fixed !important;
      background-repeat: no-repeat !important;
      background-color: #2a2a3e !important;
    }

    html .login-page {
      background: linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.3) 100%), 
                  url('https://m.gettywallpapers.com/iphone/wp-content/uploads/2023/07/Gym-iPhone-Wallpaper-HD.jpg') !important;
      background-size: cover !important;
      background-position: center !important;
      background-attachment: fixed !important;
      background-repeat: no-repeat !important;
    }

    .bg-mesh {
      display: none !important;
    }

    .login-left {
      flex: 1 !important;
      padding: 1rem !important;
      width: 100% !important;
    }

    .login-right {
      display: none !important;
    }

    .glass-card {
      background: transparent !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      border: none !important;
      box-shadow: none !important;
      padding: 2rem !important;
    }

    /* Animation for welcome text */
    .login-welcome {
      animation: fadeInUp 1.5s ease-out;
    }

    /* Stagger animation for form groups */
    .login-form-group:nth-child(1) {
      animation: fadeInUp 1.5s ease-out 300ms both;
    }

    .login-form-group:nth-child(2) {
      animation: fadeInUp 1.5s ease-out 450ms both;
    }

    .login-form-group:nth-child(3) {
      animation: fadeInUp 1.5s ease-out 600ms both;
    }

    .login-form-group:nth-child(4) {
      animation: fadeInUp 1.5s ease-out 750ms both;
    }

    /* Animation for checkbox and forgot password */
    .login-form-footer {
      animation: fadeInUp 1.5s ease-out 900ms both;
    }

    /* Animation for login button */
    .login-button {
      animation: fadeInUp 1.5s ease-out 1050ms both;
    }

    /* Animation for signup link */
    .login-footer {
      animation: fadeInUp 1.5s ease-out 1200ms both;
    }
  }

  /* Desktop View - No animation */
  @media (min-width: 1024px) {
    .login-page {
      background: var(--clr-bg-base) !important;
    }
    
    .bg-mesh {
      display: flex !important;
    }
    
    .login-left {
      flex: 0 0 450px !important;
      padding: 0.5rem 0rem 0.5rem 0rem !important;
    }
    
    .login-right {
      flex: 1 !important;
      display: block !important;
    }
    
    .login-card-wrapper {
      animation: none !important;
    }
    .login-form-group {
      animation: none !important;
    }
    .login-button {
      animation: none !important;
    }
    .login-footer {
      animation: none !important;
    }
    
    .glass-card {
      background: transparent !important;
      backdrop-filter: none !important;
      border: none !important;
      box-shadow: none !important;
      padding: 3rem !important;
    }
  }

  /* Mobile specific adjustments */
  @media (max-width: 767px) {
    .glass-card {
      max-width: 100%;
      padding: 1.5rem !important;
    }

    .login-page {
      padding: 0;
    }
  }
`;
export default function LoginPage() {
    const navigate = useNavigate();
    const { setAuth, gymId, setGymId, user } = useAuthStore();
    const [email, setEmail] = useState("admin@gymza.com");
    const [password, setPassword] = useState("Password123");
    const [role, setRole] = useState("member");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
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
    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const { data } = await login({ gymId, email, password, role });
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
            setError(err.response?.data?.message || "Invalid login credentials");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "login-page", style: {
            display: 'flex',
            minHeight: '100vh',
            position: 'relative',
            overflow: 'hidden'
        }, children: [_jsx("style", { children: animationStyles }), _jsxs("div", { className: "bg-mesh", children: [_jsx("div", { className: "blob-1" }), _jsx("div", { className: "blob-2" })] }), _jsx("div", { className: "login-left", style: {
                    flex: '0 0 450px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '0.5rem 0rem 0.5rem 0rem',
                    zIndex: 1
                }, children: _jsxs("div", { className: "glass-card", style: { padding: '3rem' }, children: [_jsxs("div", { className: "login-welcome text-center", style: { marginBottom: '2.5rem' }, children: [_jsx("img", { src: "https://res.cloudinary.com/dyc33dchn/image/upload/q_auto/f_auto/v1776476678/WhatsApp_Image_2026-04-15_at_10.11.03_PM_2_jvuq84.jpg", alt: "RUDRA FITNESS", style: {
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '16px',
                                        marginBottom: '1rem',
                                        objectFit: 'cover'
                                    } }), _jsx("h1", { style: {
                                        fontSize: '2.2rem',
                                        fontWeight: '700',
                                        fontFamily: '"Bebas Neue", sans-serif',
                                        letterSpacing: '0.12em',
                                        background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                        textShadow: '0 4px 8px rgba(139, 92, 246, 0.2)',
                                        margin: '0.5rem 0 0 0',
                                        filter: 'drop-shadow(0 2px 4px rgba(139, 92, 246, 0.15))'
                                    }, children: "RUDRA FITNESS" }), _jsx("p", { className: "text-muted", children: "Sign in to your account" })] }), _jsxs("form", { onSubmit: submit, children: [error && (_jsx("div", { style: {
                                        background: 'rgba(244, 63, 94, 0.1)',
                                        color: 'var(--clr-danger)',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        marginBottom: '1.5rem',
                                        border: '1px solid rgba(244, 63, 94, 0.2)'
                                    }, children: error })), _jsxs("div", { className: "login-form-group form-group", children: [_jsx("label", { className: "form-label", children: "Gym ID" }), _jsx("div", { style: { position: 'relative' }, children: _jsx("input", { className: "form-input", value: gymId, onChange: (e) => setGymId(e.target.value), placeholder: "Enter Gym ID" }) })] }), _jsxs("div", { className: "login-form-group form-group", children: [_jsx("label", { className: "form-label", children: "Email Address" }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx(Mail, { size: 18, style: { position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' } }), _jsx("input", { className: "form-input", style: { paddingLeft: '3rem' }, type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "admin@gymza.com" })] })] }), _jsxs("div", { className: "login-form-group form-group", children: [_jsx("label", { className: "form-label", children: "Sign in as" }), _jsxs("select", { className: "form-input", value: role, onChange: (e) => setRole(e.target.value), children: [_jsx("option", { value: "member", children: "Member" }), _jsx("option", { value: "trainer", children: "Trainer" }), _jsx("option", { value: "admin", children: "Admin" })] })] }), _jsxs("div", { className: "login-form-group form-group", children: [_jsx("label", { className: "form-label", children: "Password" }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx(Lock, { size: 18, style: { position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' } }), _jsx("input", { className: "form-input", style: { paddingLeft: '3rem', paddingRight: '3rem' }, type: showPassword ? "text" : "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), style: { position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }, children: showPassword ? _jsx(EyeOff, { size: 18 }) : _jsx(Eye, { size: 18 }) })] })] }), _jsxs("div", { className: "login-form-footer", style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }, children: [_jsxs("label", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }, children: [_jsx("input", { type: "checkbox", style: { accentColor: 'var(--clr-primary)' } }), _jsx("span", { children: "Remember me" })] }), _jsx(Link, { to: "/forgot-password", style: { fontSize: '0.85rem', color: 'var(--clr-primary)', fontWeight: '600', textDecoration: 'none' }, children: "Forgot Password?" })] }), _jsx("button", { type: "submit", className: "login-button btn btn-primary w-full", style: { padding: '0.875rem' }, disabled: loading, children: loading ? 'Signing In...' : 'Sign In' })] }), _jsx("div", { className: "login-footer text-center", style: { marginTop: '2rem' }, children: _jsxs("p", { className: "text-muted", style: { fontSize: '0.9rem' }, children: ["Don't have an account? ", _jsx(Link, { to: "/signup", style: { color: 'var(--clr-primary)', fontWeight: '600' }, children: "Sign up" })] }) })] }) }), _jsx("div", { className: "login-right", style: { flex: 1, position: 'relative' } })] }));
}
