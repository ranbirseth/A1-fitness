import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Shield, Plus, Edit2, Trash2, Save, Search, Mail, Phone, Building2 } from 'lucide-react';
import { getAdmins, createAdmin, deleteAdmin, updateAdmin } from '../features/admins/admins.api';
import { useDebounce } from '../hooks/useDebounce';
import { useAuthStore } from '../store/auth.store';
import { useBranchStore } from '../store/branch.store';
import Modal from '../components/Modal';
const AdminsPage = () => {
    const { user } = useAuthStore();
    const { branches } = useBranchStore();
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 400);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: 'Password123',
        status: 'active',
        branchCode: branches[0]?.branchCode || 'MAIN'
    });
    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const params = {};
            if (searchQuery)
                params.search = searchQuery;
            const res = await getAdmins(params);
            const adminData = res.data?.data;
            setAdmins(Array.isArray(adminData) ? adminData : (adminData?.items || []));
        }
        catch (error) {
            console.error('Failed to fetch admins', error);
            setAdmins([]);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchAdmins();
    }, []);
    useEffect(() => {
        const timer = setTimeout(() => fetchAdmins(), 300);
        return () => clearTimeout(timer);
    }, [debouncedSearch]);
    const handleOpenAdd = () => {
        setEditingId(null);
        setFormData({ name: '', email: '', phone: '', password: 'Password123', status: 'active', branchCode: branches[0]?.branchCode || 'MAIN' });
        setIsModalOpen(true);
    };
    const handleOpenEdit = (admin) => {
        setEditingId(admin._id);
        setFormData({
            name: admin.name || '',
            email: admin.email || '',
            phone: admin.phone || '',
            password: '',
            status: admin.status || 'active',
            branchCode: admin.branchCode || 'MAIN'
        });
        setIsModalOpen(true);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingId) {
                const payload = { ...formData };
                if (!payload.password)
                    delete payload.password;
                await updateAdmin(editingId, payload);
            }
            else {
                await createAdmin(formData);
            }
            setIsModalOpen(false);
            fetchAdmins();
        }
        catch (error) {
            alert(error.response?.data?.message || 'Failed to save admin');
        }
        finally {
            setIsSaving(false);
        }
    };
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this admin?'))
            return;
        try {
            await deleteAdmin(id);
            fetchAdmins();
        }
        catch (error) {
            alert(error.response?.data?.message || 'Failed to delete admin');
        }
    };
    const filteredAdmins = admins.filter(a => {
        const name = a.name || '';
        const email = a.email || '';
        const q = debouncedSearch.toLowerCase();
        return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
    });
    return (_jsxs("div", { children: [_jsxs("div", { className: "page-header flex-responsive", style: { marginBottom: '2rem' }, children: [_jsxs("div", { children: [_jsx("h1", { children: "Branch Admins" }), _jsx("p", { className: "text-muted", children: "Manage branch administrator accounts and their branch assignments." })] }), _jsxs("button", { className: "btn btn-primary", onClick: handleOpenAdd, children: [_jsx(Plus, { size: 18 }), "Add Admin"] })] }), _jsx("div", { className: "flex-responsive", style: { marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }, children: _jsxs("div", { className: "search-bar", style: { flex: '1 1 200px', minWidth: '150px', background: 'var(--clr-bg-base)', padding: '0.4rem 1rem' }, children: [_jsx(Search, { size: 16, className: "text-muted" }), _jsx("input", { placeholder: "Search by name or email...", style: { fontSize: '0.85rem' }, value: searchQuery, onChange: (e) => setSearchQuery(e.target.value) })] }) }), _jsx(Modal, { isOpen: isModalOpen, onClose: () => setIsModalOpen(false), title: editingId ? "Edit Admin" : "Add New Admin", children: _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Full Name" }), _jsx("input", { className: "form-input", required: true, placeholder: "e.g. John Smith", value: formData.name, onChange: e => setFormData({ ...formData, name: e.target.value }) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Email Address" }), _jsx("input", { className: "form-input", type: "email", required: true, placeholder: "e.g. john@example.com", value: formData.email, onChange: e => setFormData({ ...formData, email: e.target.value }) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Phone Number" }), _jsx("input", { className: "form-input", type: "tel", placeholder: "e.g. +91 98765 43210", value: formData.phone, onChange: e => setFormData({ ...formData, phone: e.target.value }) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Assigned Branch" }), _jsx("select", { className: "form-input", value: formData.branchCode, onChange: e => setFormData({ ...formData, branchCode: e.target.value }), required: true, children: branches.map(b => (_jsxs("option", { value: b.branchCode, children: [b.name, " (", b.branchCode, ")"] }, b._id))) })] }), !editingId && (_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Temporary Password" }), _jsx("input", { className: "form-input", type: "password", required: true, value: formData.password, onChange: e => setFormData({ ...formData, password: e.target.value }) })] })), editingId && (_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Status" }), _jsxs("select", { className: "form-input", value: formData.status, onChange: e => setFormData({ ...formData, status: e.target.value }), children: [_jsx("option", { value: "active", children: "Active" }), _jsx("option", { value: "inactive", children: "Inactive" })] })] })), _jsx("div", { style: { marginTop: '2rem' }, children: _jsxs("button", { className: "btn btn-primary w-full", type: "submit", disabled: isSaving, children: [_jsx(Save, { size: 18 }), isSaving ? 'Saving...' : (editingId ? 'Update Admin' : 'Create Admin')] }) })] }) }), loading ? (_jsxs("div", { className: "loading-state", style: { padding: '4rem', textAlign: 'center' }, children: [_jsx("div", { className: "spinner" }), _jsx("p", { className: "text-muted", style: { marginTop: '1rem' }, children: "Loading admins..." })] })) : (_jsx("div", { className: "grid-cards", children: filteredAdmins.map((admin) => (_jsxs("div", { className: "glass-card trainer-card", style: { padding: 0, position: 'relative', overflow: 'hidden' }, children: [_jsx("div", { style: {
                                position: 'relative',
                                height: '120px',
                                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.6) 0%, rgba(236, 72, 153, 0.6) 100%)',
                            } }), _jsxs("div", { style: { padding: '2rem 2rem 1.5rem', position: 'relative' }, children: [_jsxs("div", { style: { position: 'absolute', top: '1rem', right: '1.25rem', display: 'flex', gap: '0.5rem', zIndex: 10 }, children: [_jsx("button", { className: "btn-icon", onClick: () => handleOpenEdit(admin), title: "Edit", children: _jsx(Edit2, { size: 14 }) }), _jsx("button", { className: "btn-icon danger", onClick: () => handleDelete(admin._id), title: "Delete", children: _jsx(Trash2, { size: 14 }) })] }), _jsx("div", { className: "avatar", style: {
                                        width: '100px',
                                        height: '100px',
                                        margin: '-60px auto 1.5rem',
                                        fontSize: '2rem',
                                        boxShadow: '0 0 20px var(--clr-primary-glow)',
                                        border: '3px solid var(--clr-glass-border)',
                                        background: 'linear-gradient(135deg, var(--clr-primary), var(--clr-secondary))',
                                        position: 'relative',
                                        zIndex: 5
                                    }, children: admin.name?.charAt(0) }), _jsxs("div", { className: "text-center", children: [_jsx("h3", { style: { fontSize: '1.35rem', marginBottom: '0.25rem' }, children: admin.name }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }, children: [_jsx("span", { className: `status-badge ${admin.status || 'active'}`, children: admin.status || 'active' }), _jsxs("span", { style: {
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem',
                                                        fontSize: '0.75rem',
                                                        padding: '0.15rem 0.5rem',
                                                        borderRadius: '12px',
                                                        background: 'rgba(139, 92, 246, 0.12)',
                                                        color: 'var(--clr-primary)'
                                                    }, children: [_jsx(Building2, { size: 12 }), " ", admin.branchCode || 'MAIN'] })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.5rem' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--clr-text-muted)', fontSize: '0.85rem' }, children: [_jsx(Mail, { size: 14 }), _jsx("span", { children: admin.email })] }), admin.phone && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--clr-text-muted)', fontSize: '0.85rem' }, children: [_jsx(Phone, { size: 14 }), _jsx("span", { children: admin.phone })] }))] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--clr-text-muted)', fontSize: '0.8rem' }, children: [_jsx(Shield, { size: 14 }), _jsx("span", { children: "Branch Administrator" })] })] })] })] }, admin._id))) }))] }));
};
export default AdminsPage;
