import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Save, User, Mail, Phone, Lock, Image, MapPin, PhoneCall } from "lucide-react";
import { getMyProfile, updateProfile } from "../features/users/users.api";
import { useAuthStore } from "../store/auth.store";
import { useNavigate } from "react-router-dom";

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  password: string;
  photo: string;
  address: string;
  emergencyContact: string;
};

const emptyForm: ProfileForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  photo: "",
  address: "",
  emergencyContact: ""
};

const SettingsPage: React.FC = () => {
  const { setUser } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getMyProfile();
        const profile = res.data?.data || {};
        setForm({
          name: profile.name || "",
          email: profile.email || "",
          phone: profile.phone || "",
          password: "",
          photo: profile.photo || "",
          address: profile.address || "",
          emergencyContact: profile.emergencyContact || ""
        });
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const validateForm = () => {
    if (!form.name.trim()) return "Name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Valid email is required";
    if (!/^\d{10}$/.test(form.phone)) return "Phone number must be exactly 10 digits";
    if (form.password && form.password.length < 6) return "Password must be at least 6 characters";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) return toast.error(validationError);

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password || undefined,
        photo: form.photo || "",
        address: form.address || "",
        emergencyContact: form.emergencyContact || ""
      };
      const res = await updateProfile(payload);
      const updatedUser = res.data?.data;
      setUser(updatedUser);
      setForm((prev) => ({ ...prev, password: "" }));
      toast.success("Profile updated successfully");
      navigate("/");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: "2rem" }}>
        <div className="loading-state">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: "2rem" }}>
        <h1>Settings</h1>
        <p className="text-muted">Manage your profile and security information.</p>
      </div>

      <div className="glass-panel" style={{ padding: "2rem", maxWidth: "900px" }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
            <div
              style={{
                width: "92px",
                height: "92px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid var(--clr-glass-border)",
                background: "var(--clr-accent-gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: "1.5rem"
              }}
            >
              {form.photo ? (
                <img src={form.photo} alt={form.name || "User"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                (form.name?.charAt(0) || "U").toUpperCase()
              )}
            </div>
          </div>

          <div className="grid-cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: "relative" }}>
                <User size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--clr-text-muted)" }} />
                <input className="form-input" style={{ paddingLeft: "2.3rem" }} value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--clr-text-muted)" }} />
                <input className="form-input" style={{ paddingLeft: "2.3rem" }} type="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div style={{ position: "relative" }}>
                <Phone size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--clr-text-muted)" }} />
                <input className="form-input" style={{ paddingLeft: "2.3rem" }} value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">New Password (optional)</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--clr-text-muted)" }} />
                <input className="form-input" style={{ paddingLeft: "2.3rem" }} type="password" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Profile Photo URL (optional)</label>
              <div style={{ position: "relative" }}>
                <Image size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--clr-text-muted)" }} />
                <input className="form-input" style={{ paddingLeft: "2.3rem" }} value={form.photo} onChange={(e) => setForm((s) => ({ ...s, photo: e.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Emergency Contact (optional)</label>
              <div style={{ position: "relative" }}>
                <PhoneCall size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--clr-text-muted)" }} />
                <input className="form-input" style={{ paddingLeft: "2.3rem" }} value={form.emergencyContact} onChange={(e) => setForm((s) => ({ ...s, emergencyContact: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Address (optional)</label>
            <div style={{ position: "relative" }}>
              <MapPin size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--clr-text-muted)" }} />
              <textarea className="form-input" style={{ paddingLeft: "2.3rem", minHeight: "100px", resize: "vertical" }} value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              <Save size={16} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
