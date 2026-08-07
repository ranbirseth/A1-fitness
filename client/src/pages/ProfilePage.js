import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { getMyProfile, updateMyProfile } from "../features/members/members.api";
import { User, Mail, Phone, Camera, Save } from "lucide-react";
export default function ProfilePage() {
    const [form, setForm] = useState({ name: "", email: "", phone: "", photo: "" });
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        getMyProfile()
            .then((res) => {
            const u = res.data?.data?.user || {};
            setForm({
                name: u.name || "",
                email: u.email || "",
                phone: u.phone || "",
                photo: u.photo || ""
            });
        })
            .catch(() => null);
    }, []);
    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateMyProfile(form);
            alert('Profile updated successfully!');
        }
        catch (error) {
            console.error('Update failed', error);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { style: { maxWidth: '800px', margin: '0 auto' }, children: [_jsxs("div", { className: "page-header", style: { marginBottom: '2rem' }, children: [_jsx("h1", { children: "My Profile" }), _jsx("p", { className: "text-muted", children: "Manage your personal information and preferences." })] }), _jsx("div", { className: "glass-panel", style: { padding: '2.5rem' }, children: _jsxs("form", { onSubmit: submit, children: [_jsx("div", { style: { display: 'flex', justifyContent: 'center', marginBottom: '3rem', position: 'relative' }, children: _jsxs("div", { style: {
                                    width: '120px',
                                    height: '120px',
                                    borderRadius: '50%',
                                    background: 'var(--clr-accent-gradient)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '3rem',
                                    fontWeight: '700',
                                    color: 'white',
                                    position: 'relative',
                                    boxShadow: '0 0 20px var(--clr-primary-glow)'
                                }, children: [form.photo ? (_jsx("img", { src: form.photo, alt: "Profile", style: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' } })) : (form.name.charAt(0) || 'U'), _jsx("button", { type: "button", className: "btn-icon", style: {
                                            position: 'absolute',
                                            bottom: '0',
                                            right: '0',
                                            background: 'var(--clr-bg-card)',
                                            borderRadius: '50%',
                                            width: '36px',
                                            height: '36px'
                                        }, children: _jsx(Camera, { size: 18 }) })] }) }), _jsxs("div", { className: "grid-cards", style: { gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Full Name" }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx(User, { size: 18, style: { position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' } }), _jsx("input", { className: "form-input", style: { paddingLeft: '3rem' }, value: form.name, onChange: (e) => setForm((f) => ({ ...f, name: e.target.value })), placeholder: "Your Name" })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Email Address" }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx(Mail, { size: 18, style: { position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' } }), _jsx("input", { className: "form-input", style: { paddingLeft: '3rem' }, type: "email", value: form.email, onChange: (e) => setForm((f) => ({ ...f, email: e.target.value })), placeholder: "email@example.com", disabled: true })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Phone Number" }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx(Phone, { size: 18, style: { position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' } }), _jsx("input", { className: "form-input", style: { paddingLeft: '3rem' }, value: form.phone, onChange: (e) => setForm((f) => ({ ...f, phone: e.target.value })), placeholder: "+91 0000000000" })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Profile Photo URL" }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx(Camera, { size: 18, style: { position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' } }), _jsx("input", { className: "form-input", style: { paddingLeft: '3rem' }, value: form.photo, onChange: (e) => setForm((f) => ({ ...f, photo: e.target.value })), placeholder: "https://image-url.com" })] })] })] }), _jsx("div", { style: { marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end' }, children: _jsxs("button", { type: "submit", className: "btn btn-primary", disabled: loading, style: { padding: '0.8rem 2.5rem' }, children: [_jsx(Save, { size: 18 }), loading ? 'Saving...' : 'Save Changes'] }) })] }) })] }));
}
