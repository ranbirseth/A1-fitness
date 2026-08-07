import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Save, User, Mail, Phone, Lock, Image, MapPin, PhoneCall } from "lucide-react";
import { getMyProfile, updateProfile } from "../features/users/users.api";
import { useAuthStore } from "../store/auth.store";
import { useNavigate } from "react-router-dom";
const emptyForm = {
    name: "",
    email: "",
    phone: "",
    password: "",
    photo: "",
    address: "",
    emergencyContact: ""
};
const SettingsPage = () => {
    const { setUser } = useAuthStore();
    const navigate = useNavigate();
    const [form, setForm] = useState(emptyForm);
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
            }
            catch (error) {
                toast.error(error?.response?.data?.message || "Failed to load profile");
            }
            finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);
    const validateForm = () => {
        if (!form.name.trim())
            return "Name is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
            return "Valid email is required";
        if (!/^\d{10}$/.test(form.phone))
            return "Phone number must be exactly 10 digits";
        if (form.password && form.password.length < 6)
            return "Password must be at least 6 characters";
        return null;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationError = validateForm();
        if (validationError)
            return toast.error(validationError);
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
        }
        catch (error) {
            toast.error(error?.response?.data?.message || "Failed to update profile");
        }
        finally {
            setSaving(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "glass-panel", style: { padding: "2rem" }, children: _jsx("div", { className: "loading-state", children: _jsx("div", { className: "spinner" }) }) }));
    }
    return (_jsxs("div", { children: [_jsxs("div", { className: "page-header", style: { marginBottom: "2rem" }, children: [_jsx("h1", { children: "Settings" }), _jsx("p", { className: "text-muted", children: "Manage your profile and security information." })] }), _jsx("div", { className: "glass-panel", style: { padding: "2rem", maxWidth: "900px" }, children: _jsxs("form", { onSubmit: handleSubmit, children: [_jsx("div", { style: { display: "flex", justifyContent: "center", marginBottom: "1.5rem" }, children: _jsx("div", { style: {
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
                                }, children: form.photo ? (_jsx("img", { src: form.photo, alt: form.name || "User", style: { width: "100%", height: "100%", objectFit: "cover" } })) : ((form.name?.charAt(0) || "U").toUpperCase()) }) }), _jsxs("div", { className: "grid-cards", style: { gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Full Name" }), _jsxs("div", { style: { position: "relative" }, children: [_jsx(User, { size: 16, style: { position: "absolute", left: "12px", top: "12px", color: "var(--clr-text-muted)" } }), _jsx("input", { className: "form-input", style: { paddingLeft: "2.3rem" }, value: form.name, onChange: (e) => setForm((s) => ({ ...s, name: e.target.value })) })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Email" }), _jsxs("div", { style: { position: "relative" }, children: [_jsx(Mail, { size: 16, style: { position: "absolute", left: "12px", top: "12px", color: "var(--clr-text-muted)" } }), _jsx("input", { className: "form-input", style: { paddingLeft: "2.3rem" }, type: "email", value: form.email, onChange: (e) => setForm((s) => ({ ...s, email: e.target.value })) })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Phone Number" }), _jsxs("div", { style: { position: "relative" }, children: [_jsx(Phone, { size: 16, style: { position: "absolute", left: "12px", top: "12px", color: "var(--clr-text-muted)" } }), _jsx("input", { className: "form-input", style: { paddingLeft: "2.3rem" }, value: form.phone, onChange: (e) => setForm((s) => ({ ...s, phone: e.target.value })) })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "New Password (optional)" }), _jsxs("div", { style: { position: "relative" }, children: [_jsx(Lock, { size: 16, style: { position: "absolute", left: "12px", top: "12px", color: "var(--clr-text-muted)" } }), _jsx("input", { className: "form-input", style: { paddingLeft: "2.3rem" }, type: "password", value: form.password, onChange: (e) => setForm((s) => ({ ...s, password: e.target.value })) })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Profile Photo URL (optional)" }), _jsxs("div", { style: { position: "relative" }, children: [_jsx(Image, { size: 16, style: { position: "absolute", left: "12px", top: "12px", color: "var(--clr-text-muted)" } }), _jsx("input", { className: "form-input", style: { paddingLeft: "2.3rem" }, value: form.photo, onChange: (e) => setForm((s) => ({ ...s, photo: e.target.value })) })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Emergency Contact (optional)" }), _jsxs("div", { style: { position: "relative" }, children: [_jsx(PhoneCall, { size: 16, style: { position: "absolute", left: "12px", top: "12px", color: "var(--clr-text-muted)" } }), _jsx("input", { className: "form-input", style: { paddingLeft: "2.3rem" }, value: form.emergencyContact, onChange: (e) => setForm((s) => ({ ...s, emergencyContact: e.target.value })) })] })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Address (optional)" }), _jsxs("div", { style: { position: "relative" }, children: [_jsx(MapPin, { size: 16, style: { position: "absolute", left: "12px", top: "12px", color: "var(--clr-text-muted)" } }), _jsx("textarea", { className: "form-input", style: { paddingLeft: "2.3rem", minHeight: "100px", resize: "vertical" }, value: form.address, onChange: (e) => setForm((s) => ({ ...s, address: e.target.value })) })] })] }), _jsx("div", { style: { display: "flex", justifyContent: "flex-end" }, children: _jsxs("button", { className: "btn btn-primary", type: "submit", disabled: saving, children: [_jsx(Save, { size: 16 }), saving ? "Saving..." : "Save Changes"] }) })] }) })] }));
};
export default SettingsPage;
