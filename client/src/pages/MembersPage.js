import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Search, Plus, Filter, Edit2, Trash2, Shield, Calendar, CreditCard, Zap, Building2, UserX, UserCheck, UserSquare2 } from 'lucide-react';
import { getMembers, createMember, deleteMember, assignPlan, renewPlan, upgradePlan, cancelPlan, freezePlan, resumePlan, approveMember, updateMember } from '../features/members/members.api';
import { getPlans } from '../features/plans/plans.api';
import { getTrainers } from '../features/trainers/trainers.api';
import { recordPayment } from '../features/payments/payments.api';
import { useDebounce } from '../hooks/useDebounce';
import { useAuthStore } from '../store/auth.store';
import { useBranchStore } from '../store/branch.store';
import Modal from '../components/Modal';
const MembersPage = () => {
    const { user } = useAuthStore();
    const { branches, selectedBranch: globalBranch, setSelectedBranch } = useBranchStore();
    const isSuperAdmin = user?.role === 'superadmin';
    const isAdmin = user?.role === 'admin' || isSuperAdmin;
    const isTrainer = user?.role === 'trainer';
    const [members, setMembers] = useState([]);
    const [plans, setPlans] = useState([]);
    const [trainers, setTrainers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterBranch, setFilterBranch] = useState(globalBranch);
    const debouncedSearch = useDebounce(searchQuery, 500);
    const defaultBranch = isSuperAdmin
        ? (filterBranch !== 'ALL' ? filterBranch : (branches[0]?.branchCode || 'MAIN'))
        : (user?.branchCode || 'MAIN');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: 'Password123',
        planId: '',
        trainerId: '',
        branchCode: defaultBranch
    });
    const [editFormData, setEditFormData] = useState({
        name: '',
        email: '',
        phone: '',
        trainerId: '',
        branchCode: 'MAIN'
    });
    const [subFormData, setSubFormData] = useState({
        planId: '',
        amount: 0,
        note: '',
        recordPayment: true
    });
    // Sync filterBranch with globalBranch changes
    useEffect(() => {
        setFilterBranch(globalBranch);
    }, [globalBranch]);
    const fetchMembersList = async (search = '', status = 'all', branch = filterBranch) => {
        setLoading(true);
        try {
            const params = { search, limit: 100 };
            if (status !== 'all')
                params.status = status;
            if (isSuperAdmin && branch && branch !== 'ALL') {
                params.branchCode = branch;
            }
            const res = await getMembers(params);
            setMembers(res.data?.data?.items || []);
        }
        catch (error) {
            console.error('Failed to fetch members', error);
        }
        finally {
            setLoading(false);
        }
    };
    const fetchPlansList = async (branch = filterBranch) => {
        try {
            const params = {};
            if (isSuperAdmin && branch && branch !== 'ALL') {
                params.branchCode = branch;
            }
            const res = await getPlans(params);
            const planData = res.data?.data;
            setPlans(Array.isArray(planData) ? planData : (planData?.items || []));
        }
        catch (error) {
            console.error('Failed to fetch plans', error);
            setPlans([]);
        }
    };
    const fetchTrainersList = async (branch = filterBranch) => {
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
        }
    };
    useEffect(() => {
        fetchMembersList(debouncedSearch, filterStatus, filterBranch);
        fetchPlansList(filterBranch);
        fetchTrainersList(filterBranch);
    }, [debouncedSearch, filterStatus, filterBranch]);
    const handleBranchChange = (newBranch) => {
        setFilterBranch(newBranch);
        if (isSuperAdmin)
            setSelectedBranch(newBranch);
    };
    const handleCreateMember = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                branchCode: isSuperAdmin ? formData.branchCode : (user?.branchCode || 'MAIN')
            };
            await createMember(payload);
            setIsModalOpen(false);
            setFormData({ name: '', email: '', phone: '', password: 'Password123', planId: '', trainerId: '', branchCode: defaultBranch });
            fetchMembersList(debouncedSearch, filterStatus, filterBranch);
        }
        catch (error) {
            alert(error.response?.data?.message || 'Failed to create member');
        }
    };
    const handleEditClick = (member) => {
        setSelectedMember(member);
        setEditFormData({
            name: member.user?.name || '',
            email: member.user?.email || '',
            phone: member.user?.phone || '',
            trainerId: member.trainer?._id || '',
            branchCode: member.branchCode || member.user?.branchCode || 'MAIN'
        });
        setIsEditModalOpen(true);
    };
    const handleUpdateMember = async (e) => {
        e.preventDefault();
        try {
            await updateMember(selectedMember._id, editFormData);
            setIsEditModalOpen(false);
            fetchMembersList(debouncedSearch, filterStatus, filterBranch);
        }
        catch (error) {
            alert(error.response?.data?.message || 'Update failed');
        }
    };
    const handleDeleteMember = async (id) => {
        if (!window.confirm('Are you sure you want to permanently delete this member and all associated data?'))
            return;
        try {
            await deleteMember(id);
            fetchMembersList(debouncedSearch, filterStatus, filterBranch);
        }
        catch (error) {
            alert(error.response?.data?.message || 'Failed to delete member');
        }
    };
    const handleToggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
        const actionName = newStatus === 'inactive' ? 'deactivate' : 'reactivate';
        if (!window.confirm(`Are you sure you want to ${actionName} this member?`))
            return;
        try {
            await updateMember(id, { status: newStatus });
            fetchMembersList(debouncedSearch, filterStatus, filterBranch);
        }
        catch (error) {
            alert(error.response?.data?.message || `Failed to ${actionName} member`);
        }
    };
    const handleApprove = async (id) => {
        try {
            await approveMember(id);
            fetchMembersList(debouncedSearch, filterStatus, filterBranch);
        }
        catch (error) {
            alert(error.response?.data?.message || 'Approval failed');
        }
    };
    const handleOpenSubscription = (member) => {
        setSelectedMember(member);
        const plan = plans.find(p => p._id === member.currentPlan?._id) || plans[0];
        setSubFormData({
            planId: plan?._id || '',
            amount: plan?.price || 0,
            note: '',
            recordPayment: true
        });
        setIsSubModalOpen(true);
    };
    const handleSubscriptionAction = async (action) => {
        if (!selectedMember)
            return;
        try {
            if (!subFormData.planId && ['assign', 'renew', 'upgrade'].includes(action)) {
                alert('Please select a plan first');
                return;
            }
            if (action === 'assign')
                await assignPlan(selectedMember._id, { planId: subFormData.planId });
            else if (action === 'renew')
                await renewPlan(selectedMember._id, { planId: subFormData.planId });
            else if (action === 'upgrade')
                await upgradePlan(selectedMember._id, { planId: subFormData.planId });
            else if (action === 'freeze')
                await freezePlan(selectedMember._id);
            else if (action === 'resume')
                await resumePlan(selectedMember._id);
            else if (action === 'cancel')
                await cancelPlan(selectedMember._id);
            if (subFormData.recordPayment && subFormData.amount > 0 && ['assign', 'renew', 'upgrade'].includes(action)) {
                await recordPayment({
                    member: selectedMember._id,
                    plan: subFormData.planId,
                    amount: subFormData.amount,
                    note: subFormData.note,
                    status: 'paid'
                });
            }
            setIsSubModalOpen(false);
            fetchMembersList(debouncedSearch, filterStatus, filterBranch);
        }
        catch (error) {
            alert(error.response?.data?.message || `Action ${action} failed`);
        }
    };
    return (_jsxs("div", { children: [_jsxs("div", { className: "page-header flex-responsive", style: { marginBottom: '2rem' }, children: [_jsxs("div", { children: [_jsx("h1", { children: "Members Directory" }), _jsx("p", { className: "text-muted", children: "Manage gym memberships, profiles, and attendance credentials." })] }), _jsx("div", { children: isAdmin && (_jsxs("button", { className: "btn btn-primary", onClick: () => {
                                setFormData({ name: '', email: '', phone: '', password: 'Password123', planId: '', trainerId: '', branchCode: defaultBranch });
                                setIsModalOpen(true);
                            }, children: [_jsx(Plus, { size: 18 }), " Add Member"] })) })] }), _jsx("div", { className: "flex-responsive", style: { marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }, children: _jsxs("div", { className: "flex-responsive", style: { gap: '0.75rem', justifyContent: 'flex-start', width: '100%', flexWrap: 'wrap' }, children: [_jsxs("div", { className: "search-bar", style: { flex: '1 1 200px', minWidth: '150px', background: 'var(--clr-bg-base)', padding: '0.4rem 1rem' }, children: [_jsx(Search, { size: 16, className: "text-muted" }), _jsx("input", { placeholder: "Search members...", style: { fontSize: '0.85rem' }, value: searchQuery, onChange: (e) => setSearchQuery(e.target.value) })] }), _jsxs("div", { className: "filter-container", style: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--clr-bg-base)', padding: '0.4rem 1rem', borderRadius: '12px', border: '1px solid var(--clr-glass-border)', cursor: 'pointer' }, children: [_jsx(Filter, { size: 16, className: "text-muted" }), _jsxs("select", { className: "filter-select", style: { background: 'transparent', border: 'none', color: 'var(--clr-text-main)', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }, value: filterStatus, onChange: (e) => setFilterStatus(e.target.value), children: [_jsx("option", { value: "all", style: { background: '#1e1b4b', color: '#fff' }, children: "Filter: All Statuses" }), _jsx("option", { value: "active", style: { background: '#1e1b4b', color: '#fff' }, children: "Active" }), _jsx("option", { value: "pending", style: { background: '#1e1b4b', color: '#fff' }, children: "Pending Approval" }), _jsx("option", { value: "expired", style: { background: '#1e1b4b', color: '#fff' }, children: "Expired" }), _jsx("option", { value: "frozen", style: { background: '#1e1b4b', color: '#fff' }, children: "Frozen" }), _jsx("option", { value: "cancelled", style: { background: '#1e1b4b', color: '#fff' }, children: "Cancelled" }), _jsx("option", { value: "inactive", style: { background: '#1e1b4b', color: '#fff' }, children: "Inactive" })] })] }), isSuperAdmin && (_jsxs("div", { className: "filter-container", style: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--clr-bg-base)', padding: '0.4rem 1rem', borderRadius: '12px', border: '1px solid var(--clr-glass-border)', cursor: 'pointer' }, children: [_jsx(Building2, { size: 16, style: { color: 'var(--clr-primary)' } }), _jsxs("select", { className: "filter-select", style: { background: 'transparent', border: 'none', color: 'var(--clr-text-main)', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }, value: filterBranch, onChange: (e) => handleBranchChange(e.target.value), children: [_jsx("option", { value: "ALL", style: { background: '#1e1b4b', color: '#fff' }, children: "Branch: All Branches" }), branches.map(b => (_jsxs("option", { value: b.branchCode, style: { background: '#1e1b4b', color: '#fff' }, children: [b.name, " (", b.branchCode, ")"] }, b._id)))] })] }))] }) }), _jsx(Modal, { isOpen: isModalOpen, onClose: () => setIsModalOpen(false), title: "Add New Member", children: _jsxs("form", { onSubmit: handleCreateMember, style: { display: 'flex', flexDirection: 'column', height: '100%' }, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Full Name" }), _jsx("input", { className: "form-input", required: true, value: formData.name, onChange: e => setFormData({ ...formData, name: e.target.value }) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Email" }), _jsx("input", { className: "form-input", type: "email", required: true, value: formData.email, onChange: e => setFormData({ ...formData, email: e.target.value }) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Phone Number" }), _jsx("input", { className: "form-input", type: "tel", required: true, value: formData.phone, onChange: e => setFormData({ ...formData, phone: e.target.value }) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Password" }), _jsx("input", { className: "form-input", type: "password", required: true, value: formData.password, onChange: e => setFormData({ ...formData, password: e.target.value }) })] }), isSuperAdmin && (_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Branch Assignment" }), _jsx("select", { className: "form-input", value: formData.branchCode, onChange: e => setFormData({ ...formData, branchCode: e.target.value }), required: true, children: branches.map(b => (_jsxs("option", { value: b.branchCode, children: [b.name, " (", b.branchCode, ")"] }, b._id))) })] })), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Initial Plan (Optional)" }), _jsxs("select", { className: "form-input", value: formData.planId, onChange: e => setFormData({ ...formData, planId: e.target.value }), children: [_jsx("option", { value: "", children: "Select a plan" }), plans.map(p => _jsxs("option", { value: p._id, children: [p.name, " - \u20B9", p.price] }, p._id))] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Assign Trainer (Optional)" }), _jsxs("select", { className: "form-input", value: formData.trainerId, onChange: e => setFormData({ ...formData, trainerId: e.target.value }), children: [_jsx("option", { value: "", children: "No Trainer" }), trainers.map(t => (_jsx("option", { value: t._id, children: t.user?.name || t.name }, t._id)))] })] })] }), _jsx("div", { style: { marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--clr-glass-border)', position: 'sticky', bottom: 0, background: 'var(--clr-bg-sidebar)', zIndex: 10 }, children: _jsx("button", { className: "btn btn-primary w-full", type: "submit", children: "Create Member" }) })] }) }), _jsx(Modal, { isOpen: isEditModalOpen, onClose: () => setIsEditModalOpen(false), title: "Edit Member Profile", children: _jsxs("form", { onSubmit: handleUpdateMember, className: "form-container", children: [_jsxs("div", { className: "form-grid", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Full Name" }), _jsx("input", { type: "text", className: "form-input", value: editFormData.name, onChange: e => setEditFormData({ ...editFormData, name: e.target.value }), required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Email" }), _jsx("input", { type: "email", className: "form-input", value: editFormData.email, onChange: e => setEditFormData({ ...editFormData, email: e.target.value }), required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Phone" }), _jsx("input", { type: "text", className: "form-input", value: editFormData.phone, onChange: e => setEditFormData({ ...editFormData, phone: e.target.value }), required: true })] }), isSuperAdmin && (_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Branch" }), _jsx("select", { className: "form-input", value: editFormData.branchCode, onChange: e => setEditFormData({ ...editFormData, branchCode: e.target.value }), children: branches.map(b => (_jsxs("option", { value: b.branchCode, children: [b.name, " (", b.branchCode, ")"] }, b._id))) })] })), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Change Trainer" }), _jsxs("select", { className: "form-input", value: editFormData.trainerId, onChange: e => setEditFormData({ ...editFormData, trainerId: e.target.value }), children: [_jsx("option", { value: "", children: "No Trainer" }), trainers.map(t => (_jsx("option", { value: t._id, children: t.user?.name || t.name }, t._id)))] })] })] }), _jsxs("div", { style: { marginTop: '2rem', display: 'flex', gap: '1rem' }, children: [_jsx("button", { type: "submit", className: "btn btn-primary w-full", disabled: loading, children: "Save Changes" }), _jsx("button", { type: "button", className: "btn btn-secondary w-full", onClick: () => setIsEditModalOpen(false), children: "Cancel" })] })] }) }), _jsx(Modal, { isOpen: isSubModalOpen, onClose: () => setIsSubModalOpen(false), title: "Subscription Management", children: selectedMember && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', height: '100%' }, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsxs("div", { className: "glass-panel", style: { marginBottom: '1.5rem', padding: '1rem' }, children: [_jsxs("p", { children: ["Member: ", _jsx("strong", { children: selectedMember.user?.name })] }), _jsxs("p", { children: ["Branch: ", _jsx("strong", { style: { color: 'var(--clr-primary)' }, children: selectedMember.branchCode || 'MAIN' })] }), _jsxs("p", { children: ["Status: ", _jsx("span", { className: `status-badge ${selectedMember.status}`, children: selectedMember.status })] }), _jsxs("p", { children: ["Payment: ", _jsx("span", { className: `status-badge ${selectedMember.paymentStatus === 'paid' ? 'active' : 'pending'}`, children: selectedMember.paymentStatus })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Select Plan" }), _jsxs("select", { className: "form-input", value: subFormData.planId, onChange: e => {
                                                const plan = plans.find(p => p._id === e.target.value);
                                                setSubFormData({ ...subFormData, planId: e.target.value, amount: plan?.price || 0 });
                                            }, children: [_jsx("option", { value: "", children: "Select a plan" }), plans.map(p => _jsxs("option", { value: p._id, children: [p.name, " - \u20B9", p.price, " (", p.duration, " days)"] }, p._id))] })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Amount (\u20B9)" }), _jsx("input", { className: "form-input", type: "number", value: subFormData.amount, onChange: e => setSubFormData({ ...subFormData, amount: Number(e.target.value) }) })] }), _jsx("div", { className: "form-group", style: { display: 'flex', alignItems: 'center', paddingTop: '1.5rem' }, children: _jsxs("label", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }, children: [_jsx("input", { type: "checkbox", checked: subFormData.recordPayment, onChange: e => setSubFormData({ ...subFormData, recordPayment: e.target.checked }) }), _jsx("span", { style: { fontSize: '0.85rem' }, children: "Mark as Paid" })] }) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Note (Optional)" }), _jsx("textarea", { className: "form-input", style: { minHeight: '80px' }, value: subFormData.note, onChange: e => setSubFormData({ ...subFormData, note: e.target.value }), placeholder: "Payment or subscription note..." })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.5rem' }, children: [_jsx("button", { className: "btn btn-primary", onClick: () => handleSubscriptionAction('assign'), children: "Assign" }), _jsx("button", { className: "btn btn-secondary", onClick: () => handleSubscriptionAction('renew'), children: "Renew" }), _jsx("button", { className: "btn btn-warning", onClick: () => handleSubscriptionAction('upgrade'), children: "Upgrade" })] }), _jsx("p", { className: "text-muted", style: { fontSize: '0.72rem', marginBottom: '1.5rem' }, children: "Assign/Upgrade start a new term from today. Renew continues from the current expiry while the membership is still active." })] }), _jsxs("div", { style: { marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--clr-glass-border)', position: 'sticky', bottom: 0, background: 'var(--clr-bg-sidebar)', zIndex: 10, display: 'flex', gap: '0.75rem' }, children: [_jsx("button", { className: "btn btn-warning flex-1", onClick: () => handleSubscriptionAction('freeze'), children: "Freeze" }), _jsx("button", { className: "btn btn-success flex-1", onClick: () => handleSubscriptionAction('resume'), children: "Resume" }), _jsx("button", { className: "btn btn-danger flex-1", onClick: () => handleSubscriptionAction('cancel'), children: "Cancel" })] })] })) }), loading ? (_jsx("div", { className: "loading-state", children: _jsx("div", { className: "spinner" }) })) : (_jsx("div", { className: "grid-cards", children: members.map((member) => (_jsxs("div", { className: "glass-card member-card", style: { padding: '1.5rem' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }, children: [_jsx("div", { className: "avatar", children: member.user?.name?.charAt(0) }), _jsxs("div", { style: { textAlign: 'right' }, children: [_jsx("span", { className: `status-badge ${member.status}`, children: member.status }), _jsxs("div", { className: `text-muted`, style: { fontSize: '0.7rem', marginTop: '0.25rem' }, children: ["Payment: ", _jsx("span", { style: { color: member.paymentStatus === 'paid' ? 'var(--clr-success)' : 'var(--clr-warning)' }, children: member.paymentStatus })] })] })] }), _jsx("h3", { style: { fontSize: '1.1rem', marginBottom: '0.25rem' }, children: member.user?.name }), _jsx("p", { className: "text-muted", style: { fontSize: '0.85rem', marginBottom: '0.25rem' }, children: member.user?.email }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }, children: [_jsxs("span", { className: "text-muted", style: { fontSize: '0.8rem', fontWeight: 600 }, children: ["ID: ", member.secretCode] }), _jsxs("span", { style: {
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        fontSize: '0.75rem',
                                        padding: '0.15rem 0.5rem',
                                        borderRadius: '12px',
                                        background: 'rgba(139, 92, 246, 0.12)',
                                        color: 'var(--clr-primary)'
                                    }, children: [_jsx(Building2, { size: 12 }), " ", member.branchCode || 'MAIN'] })] }), _jsxs("div", { className: "glass-panel", style: { padding: '0.75rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }, children: [_jsx(Zap, { size: 14, className: "text-primary" }), _jsx("span", { style: { fontSize: '0.9rem', fontWeight: '600' }, children: member.currentPlan?.name || 'No Plan' })] }), member.trainer && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }, children: [_jsx(UserSquare2, { size: 14, style: { color: 'var(--clr-secondary)' } }), _jsxs("span", { style: { fontSize: '0.85rem' }, children: ["Trainer: ", member.trainer.user?.name || member.trainer.name] })] })), member.membershipExpiryDate && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }, className: "text-muted", children: [_jsx(Calendar, { size: 12 }), _jsxs("span", { children: ["Expires: ", new Date(member.membershipExpiryDate).toLocaleDateString()] })] }))] }), _jsxs("div", { style: { display: 'flex', gap: '0.5rem' }, children: [member.status === 'pending' ? (_jsx(_Fragment, { children: _jsxs("button", { className: "btn btn-primary flex-1", onClick: () => handleApprove(member._id), style: { fontSize: '0.85rem', padding: '0.5rem' }, children: [_jsx(Shield, { size: 14 }), " Approve"] }) })) : (_jsxs("button", { className: "btn btn-secondary flex-1", onClick: () => handleOpenSubscription(member), style: { fontSize: '0.85rem', padding: '0.5rem' }, children: [_jsx(CreditCard, { size: 14 }), " Subscription"] })), (isAdmin || isTrainer) && (_jsxs(_Fragment, { children: [_jsx("button", { className: "btn-icon", onClick: () => handleEditClick(member), title: "Edit Profile", children: _jsx(Edit2, { size: 14 }) }), _jsx("button", { className: `btn-icon ${member.status === 'inactive' ? 'success' : 'warning'}`, onClick: () => handleToggleStatus(member._id, member.status), title: member.status === 'inactive' ? 'Reactivate Member' : 'Deactivate Member', style: {
                                                background: member.status === 'inactive' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: member.status === 'inactive' ? 'var(--clr-success)' : 'var(--clr-warning)',
                                                border: member.status === 'inactive' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)'
                                            }, children: member.status === 'inactive' ? _jsx(UserCheck, { size: 14 }) : _jsx(UserX, { size: 14 }) }), _jsx("button", { className: "btn-icon", onClick: () => handleDeleteMember(member._id), style: { color: 'var(--clr-danger)' }, title: "Delete Member Permanently", children: _jsx(Trash2, { size: 14 }) })] }))] })] }, member._id))) }))] }));
};
export default MembersPage;
