import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { UserSquare2, Star, Users, Plus, Edit2, Trash2, Save, Search, Mail, Shield, Phone, Zap } from 'lucide-react';
import { getTrainers, createTrainer, deleteTrainer, updateTrainer } from '../features/trainers/trainers.api';
import { getMembers } from '../features/members/members.api';
import { useDebounce } from '../hooks/useDebounce';
import Modal from '../components/Modal';
const TrainersPage = () => {
    const [trainers, setTrainers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 400);
    const [selectedTrainer, setSelectedTrainer] = useState(null);
    const [trainerMembers, setTrainerMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        specialty: '',
        email: '',
        phone: '',
        password: 'Password123',
        status: 'active'
    });
    const fetchTrainers = async () => {
        setLoading(true);
        try {
            const res = await getTrainers();
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
        fetchTrainers();
    }, []);
    const handleOpenAdd = () => {
        setEditingId(null);
        setFormData({ name: '', specialty: '', email: '', phone: '', password: 'Password123', status: 'active' });
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
            status: trainer.status || 'active'
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
                await createTrainer(formData);
            }
            setIsModalOpen(false);
            fetchTrainers();
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
            fetchTrainers();
        }
        catch (error) {
            alert(error.response?.data?.message || 'Failed to delete trainer');
        }
    };
    const filteredTrainers = trainers.filter(trainer => {
        const name = (trainer.user?.name || trainer.name || '').toLowerCase();
        const email = (trainer.user?.email || trainer.email || '').toLowerCase();
        const specialty = (trainer.specialty || '').toLowerCase();
        const q = debouncedSearch.toLowerCase();
        return name.includes(q) || email.includes(q) || specialty.includes(q);
    });
    return (_jsxs("div", { children: [_jsx("div", { className: "page-header", style: { marginBottom: '2rem' }, children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }, children: [_jsxs("div", { children: [_jsx("h1", { children: "Trainers Management" }), _jsx("p", { className: "text-muted", children: "Manage gym trainers, their specialties, and access." })] }), _jsxs("button", { className: "btn btn-primary", onClick: handleOpenAdd, children: [_jsx(Plus, { size: 18 }), "Add Trainer"] })] }) }), _jsx("div", { className: "glass-panel", style: { padding: '1.25rem', marginBottom: '2rem' }, children: _jsxs("div", { className: "search-bar", style: { maxWidth: '450px', background: 'var(--clr-bg-base)' }, children: [_jsx(Search, { size: 18, className: "text-muted" }), _jsx("input", { placeholder: "Search by name, email, or specialty...", value: searchQuery, onChange: e => setSearchQuery(e.target.value) })] }) }), _jsx(Modal, { isOpen: isModalOpen, onClose: () => setIsModalOpen(false), title: editingId ? "Edit Trainer" : "Add New Trainer", children: _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Full Name" }), _jsx("input", { className: "form-input", required: true, value: formData.name, onChange: e => setFormData({ ...formData, name: e.target.value }), placeholder: "e.g. Karan Johar" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Email Address" }), _jsx("input", { className: "form-input", type: "email", required: true, value: formData.email, onChange: e => setFormData({ ...formData, email: e.target.value }), placeholder: "karan@example.com" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Phone Number" }), _jsx("input", { className: "form-input", type: "tel", value: formData.phone, onChange: e => setFormData({ ...formData, phone: e.target.value }), placeholder: "e.g. +91 9876543210" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Specialty" }), _jsx("input", { className: "form-input", required: true, value: formData.specialty, onChange: e => setFormData({ ...formData, specialty: e.target.value }), placeholder: "e.g. Weightlifting" })] }), !editingId && (_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Password" }), _jsx("input", { className: "form-input", type: "password", required: true, value: formData.password, onChange: e => setFormData({ ...formData, password: e.target.value }), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" })] })), editingId && (_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Status" }), _jsxs("select", { className: "form-input", value: formData.status, onChange: e => setFormData({ ...formData, status: e.target.value }), children: [_jsx("option", { value: "active", children: "Active" }), _jsx("option", { value: "inactive", children: "Inactive" })] })] })), _jsx("div", { style: { marginTop: '2rem' }, children: _jsxs("button", { className: "btn btn-primary w-full", type: "submit", disabled: isSaving, children: [_jsx(Save, { size: 18 }), isSaving ? 'Saving...' : (editingId ? 'Update Trainer' : 'Create Trainer')] }) })] }) }), loading ? (_jsxs("div", { className: "loading-state", style: { padding: '4rem', textAlign: 'center' }, children: [_jsx("div", { className: "spinner" }), _jsx("p", { className: "text-muted", style: { marginTop: '1rem' }, children: "Loading trainers..." })] })) : (_jsx("div", { className: "grid-cards", children: filteredTrainers.map((trainer) => (_jsxs("div", { className: "glass-card trainer-card", style: { padding: 0, position: 'relative', overflow: 'hidden' }, children: [_jsx("div", { style: {
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
                                    }, children: trainer.user?.name?.charAt(0) || trainer.name?.charAt(0) }), _jsxs("div", { className: "text-center", children: [_jsx("h3", { style: { fontSize: '1.35rem', marginBottom: '0.25rem' }, children: trainer.user?.name || trainer.name }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }, children: [_jsx("span", { className: `status-badge ${trainer.status || 'active'}`, children: trainer.status || 'active' }), _jsxs("span", { className: "text-muted", style: { fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }, children: [_jsx(Shield, { size: 12 }), " Trainer"] })] }), _jsx("div", { className: "info-pill", style: { display: 'inline-block', padding: '0.5rem 1rem', borderRadius: '30px', background: 'rgba(255, 255, 255, 0.05)', marginBottom: '1.5rem' }, children: _jsx("p", { className: "text-primary", style: { fontSize: '0.9rem', fontWeight: '600' }, children: trainer.specialty }) }), _jsxs("div", { style: {
                                                display: 'flex',
                                                justifyContent: 'center',
                                                gap: '2.5rem',
                                                padding: '1rem',
                                                background: 'rgba(255, 255, 255, 0.03)',
                                                borderRadius: '12px',
                                                marginBottom: '1.5rem',
                                                border: '1px solid var(--clr-glass-border)'
                                            }, children: [_jsxs("div", { children: [_jsxs("p", { className: "stat-value", style: { fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center' }, children: [trainer.rating || 0, " ", _jsx(Star, { size: 14, fill: "currentColor" })] }), _jsx("p", { className: "text-muted", style: { fontSize: '0.75rem' }, children: "Rating" })] }), _jsx("div", { style: { width: '1px', background: 'var(--clr-glass-border)' } }), _jsxs("div", { children: [_jsx("p", { className: "stat-value", style: { fontSize: '1.1rem' }, children: trainer.studentsCount || 0 }), _jsx("p", { className: "text-muted", style: { fontSize: '0.75rem' }, children: "Students" })] })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.5rem' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--clr-text-muted)', fontSize: '0.85rem' }, children: [_jsx(Mail, { size: 14 }), _jsx("span", { children: trainer.user?.email || trainer.email })] }), (trainer.user?.phone || trainer.phone) && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--clr-text-muted)', fontSize: '0.85rem' }, children: [_jsx(Phone, { size: 14 }), _jsx("span", { children: trainer.user?.phone || trainer.phone })] }))] }), _jsxs("button", { className: "btn btn-secondary w-full", style: { justifyContent: 'center' }, onClick: () => handleViewMembers(trainer), children: [_jsx(Users, { size: 16 }), "View Members"] })] })] })] }, trainer._id))) })), _jsxs(Modal, { isOpen: isMemberModalOpen, onClose: () => setIsMemberModalOpen(false), title: `Members assigned to ${selectedTrainer?.user?.name || selectedTrainer?.name || 'Trainer'}`, children: [loadingMembers ? (_jsxs("div", { className: "loading-state", style: { padding: '2rem', textAlign: 'center' }, children: [_jsx("div", { className: "spinner" }), _jsx("p", { className: "text-muted", style: { marginTop: '1rem' }, children: "Fetching members..." })] })) : (_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '60vh', overflowY: 'auto', padding: '0.5rem' }, children: trainerMembers.length === 0 ? (_jsx("div", { className: "text-center", style: { padding: '2rem' }, children: _jsx("p", { className: "text-muted", children: "No members assigned to this trainer yet." }) })) : (trainerMembers.map((member) => (_jsxs("div", { className: "glass-panel", style: { padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }, children: [_jsx("div", { className: "avatar", style: { width: '40px', height: '40px', fontSize: '1rem' }, children: member.user?.name?.charAt(0) }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("p", { style: { fontWeight: '600', fontSize: '0.95rem' }, children: member.user?.name }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }, children: [_jsx("span", { className: `status-badge ${member.status}`, style: { fontSize: '0.65rem', padding: '0.15rem 0.5rem' }, children: member.status }), _jsxs("span", { className: "text-muted", style: { fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }, children: [_jsx(Zap, { size: 10, className: "text-primary" }), member.currentPlan?.name || 'No Plan'] })] })] }), _jsxs("div", { style: { textAlign: 'right' }, children: [_jsx("p", { className: "text-muted", style: { fontSize: '0.7rem', textTransform: 'uppercase' }, children: "Joined" }), _jsx("p", { style: { fontSize: '0.8rem' }, children: new Date(member.createdAt).toLocaleDateString() })] })] }, member._id)))) })), _jsx("div", { style: { marginTop: '2rem', borderTop: '1px solid var(--clr-glass-border)', paddingTop: '1rem' }, children: _jsx("button", { className: "btn btn-secondary w-full", onClick: () => setIsMemberModalOpen(false), children: "Close" }) })] }), !loading && filteredTrainers.length === 0 && (_jsxs("div", { className: "glass-panel text-center", style: { padding: '4rem' }, children: [_jsx(UserSquare2, { size: 48, className: "text-muted", style: { marginBottom: '1rem', opacity: 0.5 } }), _jsx("h3", { children: "No trainers found" }), _jsx("p", { className: "text-muted", children: "Try adjusting your search query or add a new trainer." })] }))] }));
};
export default TrainersPage;
