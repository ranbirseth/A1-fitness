import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Check, X, Plus, Trash2, Edit2, Save, IndianRupee, Clock, Zap, Search, UserPlus } from 'lucide-react';
import { getPlans, createPlan, deletePlan, updatePlan } from '../features/plans/plans.api';
import { getMembers, assignPlan } from '../features/members/members.api';
import { recordPayment } from '../features/payments/payments.api';
import { useDebounce } from '../hooks/useDebounce';
import Modal from '../components/Modal';
const PlansPage = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', price: 0, duration: 30, features: [] });
    const [featureInput, setFeatureInput] = useState('');
    // States for Assigning Plan to Member
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedPlanForAssign, setSelectedPlanForAssign] = useState(null);
    const [members, setMembers] = useState([]);
    const [memberSearchQuery, setMemberSearchQuery] = useState('');
    const debouncedMemberSearch = useDebounce(memberSearchQuery, 500);
    const [isAssigning, setIsAssigning] = useState(false);
    const [recordAssignPayment, setRecordAssignPayment] = useState(true);
    const fetchPlans = async () => {
        setLoading(true);
        try {
            const res = await getPlans();
            const planData = res.data?.data;
            setPlans(Array.isArray(planData) ? planData : (planData?.items || []));
        }
        catch (error) {
            console.error('Failed to fetch plans', error);
            setPlans([]);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchPlans();
    }, []);
    useEffect(() => {
        if (isAssignModalOpen) {
            const fetchMembers = async () => {
                try {
                    const res = await getMembers({ search: debouncedMemberSearch, limit: 10 });
                    setMembers(res.data?.data?.items || []);
                }
                catch (error) {
                    console.error('Failed to fetch members', error);
                }
            };
            fetchMembers();
        }
    }, [debouncedMemberSearch, isAssignModalOpen]);
    const handleOpenAssignModal = (plan) => {
        setSelectedPlanForAssign(plan);
        setIsAssignModalOpen(true);
        setMemberSearchQuery('');
    };
    const handleAssignToMember = async (memberId) => {
        if (!selectedPlanForAssign)
            return;
        setIsAssigning(true);
        try {
            await assignPlan(memberId, { planId: selectedPlanForAssign._id });
            // Also record payment if checkbox is checked
            if (recordAssignPayment) {
                await recordPayment({
                    member: memberId,
                    plan: selectedPlanForAssign._id,
                    amount: selectedPlanForAssign.price,
                    method: 'cash',
                    status: 'paid',
                    note: `Assigned plan ${selectedPlanForAssign.name} from Plans section.`
                });
            }
            alert('Plan assigned successfully!');
            setIsAssignModalOpen(false);
        }
        catch (error) {
            alert(error.response?.data?.message || 'Failed to assign plan');
        }
        finally {
            setIsAssigning(false);
        }
    };
    const handleOpenAdd = () => {
        setEditingId(null);
        setFormData({ name: '', price: 0, duration: 30, features: [] });
        setIsModalOpen(true);
    };
    const handleOpenEdit = (plan) => {
        setEditingId(plan._id);
        setFormData({
            name: plan.name,
            price: plan.price,
            duration: plan.duration,
            features: plan.features || []
        });
        setIsModalOpen(true);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingId) {
                await updatePlan(editingId, formData);
            }
            else {
                await createPlan(formData);
            }
            setIsModalOpen(false);
            fetchPlans();
        }
        catch (error) {
            alert(error.response?.data?.message || 'Failed to save plan');
        }
        finally {
            setIsSaving(false);
        }
    };
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this plan? This cannot be undone if members are using it.'))
            return;
        try {
            await deletePlan(id);
            fetchPlans();
        }
        catch (error) {
            alert(error.response?.data?.message || 'Failed to delete plan');
        }
    };
    const addFeature = () => {
        if (!featureInput.trim())
            return;
        setFormData({ ...formData, features: [...formData.features, featureInput.trim()] });
        setFeatureInput('');
    };
    const removeFeature = (index) => {
        setFormData({ ...formData, features: formData.features.filter((_, i) => i !== index) });
    };
    return (_jsxs("div", { children: [_jsx("div", { className: "page-header", style: { marginBottom: '3rem' }, children: _jsxs("div", { className: "flex-responsive", style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }, children: [_jsxs("div", { children: [_jsx("h1", { children: "Membership Plans" }), _jsx("p", { className: "text-muted", children: "Create and manage gym subscription plans." })] }), _jsxs("button", { className: "btn btn-primary", onClick: handleOpenAdd, children: [_jsx(Plus, { size: 18 }), "Add New Plan"] })] }) }), _jsx(Modal, { isOpen: isModalOpen, onClose: () => setIsModalOpen(false), title: editingId ? "Edit Plan" : "Add New Plan", children: _jsxs("form", { onSubmit: handleSubmit, style: { display: 'flex', flexDirection: 'column', height: '100%' }, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Plan Name" }), _jsx("input", { className: "form-input", required: true, value: formData.name, onChange: e => setFormData({ ...formData, name: e.target.value }), placeholder: "e.g. Basic Monthly, Pro Yearly" })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Price (\u20B9)" }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx(IndianRupee, { size: 16, style: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' } }), _jsx("input", { className: "form-input", style: { paddingLeft: '35px' }, type: "number", required: true, min: "0", value: formData.price, onChange: e => setFormData({ ...formData, price: Number(e.target.value) }) })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Duration (Days)" }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx(Clock, { size: 16, style: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' } }), _jsx("input", { className: "form-input", style: { paddingLeft: '35px' }, type: "number", required: true, min: "1", value: formData.duration, onChange: e => setFormData({ ...formData, duration: Number(e.target.value) }) })] })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Plan Features" }), _jsxs("div", { style: { display: 'flex', gap: '0.5rem', marginBottom: '1rem' }, children: [_jsx("input", { className: "form-input", value: featureInput, onChange: e => setFeatureInput(e.target.value), placeholder: "Add a feature (e.g. Personal Trainer)...", onKeyPress: e => e.key === 'Enter' && (e.preventDefault(), addFeature()) }), _jsx("button", { type: "button", className: "btn btn-secondary", onClick: addFeature, children: "Add" })] }), _jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }, children: formData.features.map((f, i) => (_jsxs("span", { className: "status-badge active", style: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem' }, children: [f, _jsx(X, { size: 14, style: { cursor: 'pointer', opacity: 0.7 }, onClick: () => removeFeature(i) })] }, i))) })] })] }), _jsx("div", { style: { marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--clr-glass-border)', position: 'sticky', bottom: 0, background: 'var(--clr-bg-sidebar)', zIndex: 10 }, children: _jsxs("button", { className: "btn btn-primary w-full", type: "submit", disabled: isSaving, children: [_jsx(Save, { size: 18 }), isSaving ? 'Saving...' : (editingId ? 'Update Plan' : 'Create Plan')] }) })] }) }), _jsxs(Modal, { isOpen: isAssignModalOpen, onClose: () => setIsAssignModalOpen(false), title: `Assign ${selectedPlanForAssign?.name} to Member`, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Search Member" }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx(Search, { size: 18, style: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' } }), _jsx("input", { className: "form-input", style: { paddingLeft: '40px' }, placeholder: "Type member name or email...", value: memberSearchQuery, onChange: (e) => setMemberSearchQuery(e.target.value) })] })] }), _jsxs("div", { className: "form-group", style: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }, children: [_jsx("input", { type: "checkbox", id: "recordAssignPayment", checked: recordAssignPayment, onChange: (e) => setRecordAssignPayment(e.target.checked), style: { width: '18px', height: '18px', cursor: 'pointer' } }), _jsx("label", { htmlFor: "recordAssignPayment", style: { cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }, children: "Mark as Paid immediately (Cash) - Recommended to avoid Access Restricted page" })] }), _jsx("div", { style: { marginTop: '1.5rem', maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }, children: members.length > 0 ? (members.map((member) => (_jsxs("div", { className: "glass-panel", style: {
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }, onClick: () => handleAssignToMember(member._id), children: [_jsxs("div", { children: [_jsx("p", { style: { fontWeight: '600', marginBottom: '0.25rem' }, children: member.user?.name || member.name }), _jsx("p", { className: "text-muted", style: { fontSize: '0.8rem' }, children: member.user?.email || member.email })] }), _jsx("button", { className: "btn-icon", style: { background: 'var(--clr-primary)', color: 'white' }, disabled: isAssigning, children: _jsx(UserPlus, { size: 16 }) })] }, member._id)))) : (_jsx("p", { className: "text-center text-muted", style: { padding: '2rem' }, children: memberSearchQuery ? 'No members found matching your search.' : 'Search for a member to assign this plan.' })) })] }), loading ? (_jsxs("div", { style: { padding: '4rem', textAlign: 'center' }, children: [_jsx("div", { className: "spinner" }), _jsx("p", { className: "text-muted", style: { marginTop: '1rem' }, children: "Loading plans..." })] })) : (_jsx("div", { className: "grid-cards", children: plans.map((plan) => (_jsxs("div", { className: "glass-card", style: {
                        padding: '2.5rem',
                        position: 'relative',
                        textAlign: 'center'
                    }, children: [_jsxs("div", { style: { position: 'absolute', top: '1.25rem', right: '1.25rem', display: 'flex', gap: '0.5rem' }, children: [_jsx("button", { className: "btn-icon", onClick: () => handleOpenEdit(plan), title: "Edit", children: _jsx(Edit2, { size: 14 }) }), _jsx("button", { className: "btn-icon danger", onClick: () => handleDelete(plan._id), title: "Delete", children: _jsx(Trash2, { size: 14 }) })] }), _jsx("div", { style: {
                                display: 'inline-flex',
                                padding: '0.75rem',
                                borderRadius: '16px',
                                background: 'rgba(var(--clr-primary-rgb), 0.1)',
                                color: 'var(--clr-primary)',
                                marginBottom: '1.5rem'
                            }, children: _jsx(Zap, { size: 24, fill: "currentColor" }) }), _jsx("h3", { style: { fontSize: '1.5rem', marginBottom: '0.5rem' }, children: plan.name }), _jsxs("p", { className: "text-muted", style: { fontSize: '0.9rem', marginBottom: '1.5rem' }, children: ["Valid for ", plan.duration, " days"] }), _jsx("div", { style: { marginBottom: '2rem' }, children: _jsxs("span", { style: { fontSize: '2.5rem', fontWeight: '800', color: 'var(--clr-primary)' }, children: ["\u20B9", plan.price.toLocaleString()] }) }), _jsxs("div", { style: { textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem', minHeight: '150px' }, children: [(plan.features || []).map((feature, idx) => (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.75rem' }, children: [_jsx("div", { style: { width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: _jsx(Check, { size: 12, className: "text-success" }) }), _jsx("span", { style: { fontSize: '0.9rem' }, children: feature })] }, idx))), (!plan.features || plan.features.length === 0) && (_jsx("p", { className: "text-muted", style: { fontSize: '0.85rem', fontStyle: 'italic' }, children: "No specific features listed" }))] }), _jsx("button", { className: "btn btn-secondary w-full", style: { justifyContent: 'center' }, onClick: () => handleOpenAssignModal(plan), children: "Assign to Member" })] }, plan._id))) })), !loading && plans.length === 0 && (_jsxs("div", { className: "glass-panel text-center", style: { padding: '5rem' }, children: [_jsx(Zap, { size: 48, className: "text-muted", style: { marginBottom: '1.5rem', opacity: 0.3 } }), _jsx("h3", { children: "No plans created yet" }), _jsx("p", { className: "text-muted", style: { marginBottom: '2rem' }, children: "Get started by creating your first membership plan." }), _jsxs("button", { className: "btn btn-primary", onClick: handleOpenAdd, children: [_jsx(Plus, { size: 18 }), "Add First Plan"] })] }))] }));
};
export default PlansPage;
