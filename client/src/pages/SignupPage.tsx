import React, { FormEvent, useState } from "react";
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
    role: "member" as const
  });

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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submit = async (e: FormEvent) => {
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
        } else if (userData.status === "inactive") {
          navigate("/account-inactive");
        } else {
          navigate("/");
        }
      } else {
        navigate("/");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      background: 'var(--clr-bg-base)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div className="bg-mesh">
        <div className="blob-1"></div>
        <div className="blob-2"></div>
      </div>

      <div className="login-left" style={{ 
        flex: '0 0 450px', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        padding: '3rem',
        zIndex: 1
      }}>
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div className="text-center" style={{ marginBottom: '2rem' }}>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              background: 'var(--clr-accent-gradient)',
              marginBottom: '1rem',
              color: 'white'
            }}>
              <Dumbbell size={28} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Create Account</h1>
            <p className="text-muted">Join the Gymza community</p>
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

            <div className="form-group">
              <label className="form-label">Gym ID</label>
              <input 
                name="gymId"
                className="form-input"
                value={formData.gymId} 
                onChange={handleChange} 
                placeholder="Enter Gym ID" 
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
                <input 
                  name="name"
                  className="form-input"
                  style={{ paddingLeft: '3rem' }}
                  value={formData.name} 
                  onChange={handleChange} 
                  placeholder="John Doe" 
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Sign up as</label>
              <select 
                name="role"
                className="form-input"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="member">Member</option>
                <option value="trainer">Trainer</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
                <input 
                  name="email"
                  className="form-input"
                  style={{ paddingLeft: '3rem' }}
                  type="email"
                  value={formData.email} 
                  onChange={handleChange} 
                  placeholder="john@example.com" 
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
                <input 
                  name="phone"
                  className="form-input"
                  style={{ paddingLeft: '3rem' }}
                  value={formData.phone} 
                  onChange={handleChange} 
                  placeholder="1234567890" 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
                <input 
                  name="password"
                  className="form-input"
                  style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
                  type={showPassword ? "text" : "password"}
                  value={formData.password} 
                  onChange={handleChange} 
                  placeholder="••••••••" 
                  required
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

            <button 
              type="submit" 
              className="btn btn-primary w-full" 
              style={{ padding: '0.875rem', marginTop: '1rem' }}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className="text-center" style={{ marginTop: '1.5rem' }}>
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>
              Already have an account? <Link to="/login" style={{ color: 'var(--clr-primary)', fontWeight: '600' }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>

      <div className="login-right" style={{ flex: 1, position: 'relative' }}>
        {/* Right side decoration */}
      </div>
    </div>
  );
}
