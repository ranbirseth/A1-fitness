import React, { FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../features/auth/auth.api";
import { useAuthStore, setRemember } from "../store/auth.store";
import http from "../api/http";
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
                        url('https://res.cloudinary.com/dyc33dchn/image/upload/v1788244567/ChatGPT_Image_Sep_1_2026_12_05_48_PM_qdwhfr.png') !important;
      background-size: cover !important;
      background-position: center !important;
      background-attachment: fixed !important;
      background-repeat: no-repeat !important;
      background-color: #2a2a3e !important;
    }

    html .login-page {
      background: linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.3) 100%), 
                  url('https://res.cloudinary.com/dyc33dchn/image/upload/v1788244567/ChatGPT_Image_Sep_1_2026_12_05_48_PM_qdwhfr.png') !important;
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("member");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRememberState] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user) {
      if (user.role === "member") {
        if (user.status === "pending") {
          navigate("/pending-approval");
        } else if (user.status === "inactive") {
          navigate("/account-inactive");
        } else {
          navigate("/");
        }
      } else {
        navigate("/");
      }
    }
  }, [user, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await login({ gymId, email, password, role });
      const userData = data.data.user;
      setRemember(remember);
      setAuth(userData, data.data.accessToken);
      
      if (userData.role === "member") {
        if (userData.status === "pending") {
          navigate("/pending-approval");
        } else if (userData.status === "inactive") {
          navigate("/account-inactive");
        } else {
          navigate("/");
        }
      } else {
        navigate("/");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid login credentials");
    } finally {
      setLoading(false);
    }
  };

  const devLogin = async (devRole: string) => {
    setError("");
    setLoading(true);
    try {
      const { data } = await http.post("/auth/demo-login", { role: devRole });
      const userData = data.data.user;
      setAuth(userData, data.data.accessToken);
      if (userData.role === "member") {
        if (userData.status === "pending") navigate("/pending-approval");
        else if (userData.status === "inactive") navigate("/account-inactive");
        else navigate("/");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Dev login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>{animationStyles}</style>
      
      <div className="bg-mesh">
        <div className="blob-1"></div>
        <div className="blob-2"></div>
      </div>

      <div className="login-left" style={{ 
        flex: '0 0 450px', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        padding: '0.5rem 0rem 0.5rem 0rem',
        zIndex: 1
      }}>
        <div className="glass-card" style={{ padding: '3rem' }}>
          <div className="login-welcome text-center" style={{ marginBottom: '2.5rem' }}>
            <img 
              src="/logo.svg" 
              alt="A1 FITNESS" 
              style={{ 
                width: '80px',
                height: '80px',
                borderRadius: '16px',
                marginBottom: '1rem',
                objectFit: 'cover'
              }}
            />
            <h1 style={{ 
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
            }}>A1 fitness</h1>
            <p className="text-muted">Sign in to your account</p>
          </div>

          <form onSubmit={submit}>
            {error && (
              <div style={{ 
                background: 'rgba(244, 63, 94, 0.1)', 
                color: 'var(--clr-danger)', 
                padding: '0.75rem', 
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '1.5rem',
                border: '1px solid rgba(244, 63, 94, 0.2)'
              }}>
                {error}
              </div>
            )}

            <div className="login-form-group form-group">
              <label className="form-label">Gym ID</label>
              <div style={{ position: 'relative' }}>
                <input 
                  className="form-input"
                  value={gymId} 
                  onChange={(e) => setGymId(e.target.value)} 
                  placeholder="Enter Gym ID" 
                />
              </div>
            </div>

            <div className="login-form-group form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
                <input 
                  className="form-input"
                  style={{ paddingLeft: '3rem' }}
                  type="email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="Enter your email" 
                />
              </div>
            </div>

            <div className="login-form-group form-group">
              <label className="form-label">Sign in as</label>
              <select 
                className="form-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="member">Member</option>
                <option value="trainer">Trainer</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </div>

            <div className="login-form-group form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
                <input 
                  className="form-input"
                  style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
                  type={showPassword ? "text" : "password"}
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="login-form-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={remember} onChange={(e) => setRememberState(e.target.checked)} style={{ accentColor: 'var(--clr-primary)' }} />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--clr-primary)', fontWeight: '600', textDecoration: 'none' }}>Forgot Password?</Link>
            </div>

            <button 
              type="submit" 
              className="login-button btn btn-primary w-full" 
              style={{ padding: '0.875rem' }}
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="login-footer text-center" style={{ marginTop: '2rem' }}>
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>
              Don't have an account? <Link to="/signup" style={{ color: 'var(--clr-primary)', fontWeight: '600' }}>Sign up</Link>
            </p>
          </div>

          {import.meta.env.DEV && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px dashed rgba(251, 191, 36, 0.4)', borderRadius: '8px', background: 'rgba(251, 191, 36, 0.05)' }}>
              <p style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: '700', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Development Login — Remove before production
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                {(["superadmin", "admin", "trainer", "member"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => devLogin(r)}
                    disabled={loading}
                    style={{
                      padding: '0.45rem 0.5rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                      background: 'rgba(251, 191, 36, 0.08)',
                      color: '#f59e0b',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.5 : 1,
                      textTransform: 'capitalize',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="login-right" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <img
          src="https://res.cloudinary.com/dyc33dchn/image/upload/v1788244567/ChatGPT_Image_Sep_1_2026_12_05_48_PM_qdwhfr.png"
          alt="A1 Fitness trainer coaching a premium workout session"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
        />
      </div>
    </div>
  );
}
