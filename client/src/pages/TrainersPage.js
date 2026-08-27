import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Users, Plus, Edit2, Trash2, Save, Search, Mail, Phone, Building2 } from 'lucide-react';
import { getTrainers, createTrainer, deleteTrainer, updateTrainer } from '../features/trainers/trainers.api';
import { getMembers } from '../features/members/members.api';
import { useDebounce } from '../hooks/useDebounce';
import { useAuthStore } from '../store/auth.store';
import { useBranchStore } from '../store/branch.store';
import Modal from '../components/Modal';
const TrainersPage = () => {
    const { user } = useAuthStore();
    const { branches, selectedBranch: globalBranch, setSelectedBranch } = useBranchStore();
    const isSuperAdmin = user?.role === 'superadmin';
    const [trainers, setTrainers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterBranch, setFilterBranch] = useState(globalBranch);
    const debouncedSearch = useDebounce(searchQuery, 400);
    const [selectedTrainer, setSelectedTrainer] = useState(null);
    const [trainerMembers, setTrainerMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const defaultBranch = isSuperAdmin
        ? (filterBranch !== 'ALL' ? filterBranch : (branches[0]?.branchCode || 'MAIN'))
        : (user?.branchCode || 'MAIN');
    const [formData, setFormData] = useState({
        name: '',
        specialty: '',
        email: '',
        phone: '',
        password: 'Password123',
        status: 'active',
        branchCode: defaultBranch
    });
    useEffect(() => {
        setFilterBranch(globalBranch);
    }, [globalBranch]);
    const fetchTrainers = async (branch = filterBranch) => {
        setLoading(true);
        try {
            const params = {};
            if (isSuperAdmin && branch && branch !== 'ALL') {
                params.branchCode = branch;
            }
            const res = await getTrainers(params);
            const trainerData = res.data?.data;
            setTrainers(Array.isArray(trainerData) ? trainerData : (trainerData?.items || []));
        }
        catch (error) {
            console.error('Failed to fetch trainers', error);
            setTrainers([]);
        }
        finally {
            setLoading(false);
        }
    };
    const handleViewMembers = async (trainer) => {
        setSelectedTrainer(trainer);
        setIsMemberModalOpen(true);
        setLoadingMembers(true);
        try {
            const res = await getMembers({ trainerId: trainer._id, limit: 100 });
            const memberData = res.data?.data;
            setTrainerMembers(Array.isArray(memberData) ? memberData : (memberData?.items || []));
        }
        catch (error) {
            console.error('Failed to fetch trainer members', error);
            setTrainerMembers([]);
        }
        finally {
            setLoadingMembers(false);
        }
    };
    useEffect(() => {
        fetchTrainers(filterBranch);
    }, [filterBranch]);
    const handleBranchChange = (newBranch) => {
        setFilterBranch(newBranch);
        if (isSuperAdmin)
            setSelectedBranch(newBranch);
    };
    const handleOpenAdd = () => {
        setEditingId(null);
        setFormData({ name: '', specialty: '', email: '', phone: '', password: 'Password123', status: 'active', branchCode: defaultBranch });
        setIsModalOpen(true);
    };
    const handleOpenEdit = (trainer) => {
        setEditingId(trainer._id);
        setFormData({
            name: trainer.user?.name || trainer.name || '',
            email: trainer.user?.email || trainer.email || '',
            phone: trainer.user?.phone || trainer.phone || '',
            specialty: trainer.specialty || '',
            password: '', // Don't show password on edit
            status: trainer.status || 'active',
            branchCode: trainer.branchCode || 'MAIN'
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
                await updateTrainer(editingId, payload);
            }
            else {
                const payload = {
                    ...formData,
                    branchCode: isSuperAdmin ? formData.branchCode : (user?.branchCode || 'MAIN')
                };
                await createTrainer(payload);
            }
            setIsModalOpen(false);
            fetchTrainers(filterBranch);
        }
        catch (error) {
            alert(error.response?.data?.message || 'Failed to save trainer');
        }
        finally {
            setIsSaving(false);
        }
    };
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this trainer?'))
            return;
        try {
            await deleteTrainer(id);
            fetchTrainers(filterBranch);
        }
        catch (error) {
            alert(error.response?.data?.message || 'Failed to delete trainer');
        }
    };
    const filteredTrainers = trainers.filter(t => {
        const name = t.user?.name || t.name || '';
        const email = t.user?.email || t.email || '';
        const specialty = t.specialty || '';
        const q = debouncedSearch.toLowerCase();
        return name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || specialty.toLowerCase().includes(q);
    });
    return (_jsxs("div", { children: [_jsxs("div", { className: "page-header flex-responsive", style: { marginBottom: '2rem' }, children: [_jsxs("div", { children: [_jsx("h1", { children: "Trainers & Coaches" }), _jsx("p", { className: "text-muted", children: "Manage fitness coaches, specialties, assigned members, and branch assignments." })] }), _jsxs("button", { className: "btn btn-primary", onClick: handleOpenAdd, children: [_jsx(Plus, { size: 18 }), "Add Trainer"] })] }), _jsx("div", { className: "flex-responsive", style: { marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }, children: _jsxs("div", { className: "flex-responsive", style: { gap: '0.75rem', justifyContent: 'flex-start', width: '100%', flexWrap: 'wrap' }, children: [_jsxs("div", { className: "search-bar", style: { flex: '1 1 200px', minWidth: '150px', background: 'var(--clr-bg-base)', padding: '0.4rem 1rem' }, children: [_jsx(Search, { size: 16, className: "text-muted" }), _jsx("input", { placeholder: "Search by name, email, or specialty...", style: { fontSize: '0.85rem' }, value: searchQuery, onChange: (e) => setSearchQuery(e.target.value) })] }), isSuperAdmin && (_jsxs("div", { className: "filter-container", style: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--clr-bg-base)', padding: '0.4rem 1rem', borderRadius: '12px', border: '1px solid var(--clr-glass-border)', cursor: 'pointer' }, children: [_jsx(Building2, { size: 16, style: { color: 'var(--clr-primary)' } }), _jsxs("select", { className: "filter-select", style: { background: 'transparent', border: 'none', color: 'var(--clr-text-main)', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }, value: filterBranch, onChange: (e) => handleBranchChange(e.target.value), children: [_jsx("option", { value: "ALL", style: { background: '#1e1b4b', color: '#fff' }, children: "Branch: All Branches" }), branches.map(b => (_jsxs("option", { value: b.branchCode, style: { background: '#1e1b4b', color: '#fff' }, children: [b.name, " (", b.branchCode, ")"] }, b._id)))] })] }))] }) }), _jsx(Modal, { isOpen: isModalOpen, onClose: () => setIsModalOpen(false), title: editingId ? "Edit Trainer Profile" : "Add New Trainer", children: _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Full Name" }), _jsx("input", { className: "form-input", required: true, placeholder: "e.g. Alex Hunter", value: formData.name, onChange: e => setFormData({ ...formData, name: e.target.value }) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Email Address" }), _jsx("input", { className: "form-input", type: "email", required: true, placeholder: "e.g. alex@gym.com", value: formData.email, onChange: e => setFormData({ ...formData, email: e.target.value }) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Phone Number" }), _jsx("input", { className: "form-input", type: "tel", placeholder: "e.g. +91 98765 43210", value: formData.phone, onChange: e => setFormData({ ...formData, phone: e.target.value }) })] }), isSuperAdmin && (_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Branch Assignment" }), _jsx("select", { className: "form-input", value: formData.branchCode, onChange: e => setFormData({ ...formData, branchCode: e.target.value }), required: true, children: branches.map(b => (_jsxs("option", { value: b.branchCode, children: [b.name, " (", b.branchCode, ")"] }, b._id))) })] })), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Specialty / Discipline" }), _jsx("input", { className: "form-input", required: true, placeholder: "e.g. Strength & Conditioning, HIIT, Yoga", value: formData.specialty, onChange: e => setFormData({ ...formData, specialty: e.target.value }) })] }), !editingId && (_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Temporary Password" }), _jsx("input", { className: "form-input", type: "password", required: true, value: formData.password, onChange: e => setFormData({ ...formData, password: e.target.value }) })] })), editingId && (_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Status" }), _jsxs("select", { className: "form-input", value: formData.status, onChange: e => setFormData({ ...formData, status: e.target.value }), children: [_jsx("option", { value: "active", children: "Active" }), _jsx("option", { value: "inactive", children: "Inactive" })] })] })), _jsx("div", { style: { marginTop: '2rem' }, children: _jsxs("button", { className: "btn btn-primary w-full", type: "submit", disabled: isSaving, children: [_jsx(Save, { size: 18 }), isSaving ? 'Saving...' : (editingId ? 'Update Trainer' : 'Create Trainer')] }) })] }) }), _jsx(Modal, { isOpen: isMemberModalOpen, onClose: () => setIsMemberModalOpen(false), title: `Members Assigned to ${selectedTrainer?.user?.name || selectedTrainer?.name || 'Trainer'}`, children: _jsx("div", { style: { padding: '0.5rem 0' }, children: loadingMembers ? (_jsxs("div", { style: { textAlign: 'center', padding: '2rem' }, children: [_jsx("div", { className: "spinner" }), _jsx("p", { className: "text-muted", style: { marginTop: '0.5rem' }, children: "Loading assigned members..." })] })) : trainerMembers.length === 0 ? (_jsxs("div", { style: { textAlign: 'center', padding: '2rem' }, className: "text-muted", children: [_jsx(Users, { size: 32, style: { margin: '0 auto 0.5rem', opacity: 0.5 } }), _jsx("p", { children: "No members currently assigned to this trainer." })] })) : (_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }, children: trainerMembers.map((m) => (_jsxs("div", { className: "glass-panel", style: { padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("div", { children: [_jsx("h4", { style: { fontSize: '0.95rem', marginBottom: '0.15rem' }, children: m.user?.name }), _jsxs("p", { className: "text-muted", style: { fontSize: '0.8rem' }, children: [m.user?.email, " \u2022 ID: ", m.secretCode] }), _jsxs("span", { style: { fontSize: '0.75rem', color: 'var(--clr-primary)' }, children: ["Branch: ", m.branchCode || 'MAIN'] })] }), _jsx("span", { className: `status-badge ${m.status}`, children: m.status })] }, m._id))) })) }) }), loading ? (_jsxs("div", { className: "loading-state", style: { padding: '4rem', textAlign: 'center' }, children: [_jsx("div", { className: "spinner" }), _jsx("p", { className: "text-muted", style: { marginTop: '1rem' }, children: "Loading trainers..." })] })) : (_jsx("div", { className: "grid-cards", children: filteredTrainers.map((trainer) => (_jsxs("div", { className: "glass-card trainer-card", style: { padding: 0, position: 'relative', overflow: 'hidden' }, children: [_jsx("div", { style: {
                                position: 'relative',
                                height: '120px',
                                background: `linear-gradient(135deg, rgba(6, 182, 212, 0.6) 0%, rgba(139, 92, 246, 0.6) 100%), url('https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&h=300&fit=crop')`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            } }), _jsxs("div", { style: { padding: '2rem 2rem 1.5rem', position: 'relative' }, children: [_jsxs("div", { style: { position: 'absolute', top: '1rem', right: '1.25rem', display: 'flex', gap: '0.5rem', zIndex: 10 }, children: [_jsx("button", { className: "btn-icon", onClick: () => handleOpenEdit(trainer), title: "Edit", children: _jsx(Edit2, { size: 14 }) }), _jsx("button", { className: "btn-icon danger", onClick: () => handleDelete(trainer._id), title: "Delete", children: _jsx(Trash2, { size: 14 }) })] }), _jsx("div", { className: "avatar", style: {
                                        width: '100px',
                                        height: '100px',
                                        margin: '-60px auto 1.5rem',
                                        fontSize: '2rem',
                                        boxShadow: '0 0 20px var(--clr-primary-glow)',
                                        border: '3px solid var(--clr-glass-border)',
                                        background: 'linear-gradient(135deg, var(--clr-primary), var(--clr-secondary))',
                                        position: 'relative',
                                        zIndex: 5
                                    }, children: trainer.user?.name?.charAt(0) || trainer.name?.charAt(0) }), _jsxs("div", { className: "text-center", children: [_jsx("h3", { style: { fontSize: '1.35rem', marginBottom: '0.25rem' }, children: trainer.user?.name || trainer.name }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }, children: [_jsx("span", { className: `status-badge ${trainer.status || 'active'}`, children: trainer.status || 'active' }), _jsxs("span", { style: {
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem',
                                                        fontSize: '0.75rem',
                                                        padding: '0.15rem 0.5rem',
                                                        borderRadius: '12px',
                                                        background: 'rgba(139, 92, 246, 0.12)',
                                                        color: 'var(--clr-primary)'
                                                    }, children: [_jsx(Building2, { size: 12 }), " ", trainer.branchCode || 'MAIN'] })] }), _jsx("div", { className: "info-pill", style: { display: 'inline-block', padding: '0.5rem 1rem', borderRadius: '30px', background: 'rgba(255, 255, 255, 0.05)', marginBottom: '1.5rem' }, children: _jsx("p", { className: "text-primary", style: { fontSize: '0.9rem', fontWeight: '600' }, children: trainer.specialty || 'General Fitness' }) }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.5rem' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--clr-text-muted)', fontSize: '0.85rem' }, children: [_jsx(Mail, { size: 14 }), _jsx("span", { children: trainer.user?.email || trainer.email })] }), (trainer.user?.phone || trainer.phone) && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--clr-text-muted)', fontSize: '0.85rem' }, children: [_jsx(Phone, { size: 14 }), _jsx("span", { children: trainer.user?.phone || trainer.phone })] }))] }), _jsxs("button", { className: "btn btn-secondary w-full", style: { fontSize: '0.85rem' }, onClick: () => handleViewMembers(trainer), children: [_jsx(Users, { size: 16 }), "View Assigned Members"] })] })] })] }, trainer._id))) }))] }));
};
export default TrainersPage;
