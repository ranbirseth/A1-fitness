import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Building2, Edit2, Eye, Plus, Power, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../components/Modal";
import { createBranch, deleteBranch, getBranches, updateBranch } from "../features/branches/branches.api";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
const blank = { name: "", branchCode: "", address: "", phone: "", email: "", status: "active" };
export default function BranchesPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(blank);
    const [open, setOpen] = useState(false);
    const { user } = useAuthStore();
    const isSuperAdmin = user?.role === "superadmin";
    const load = async () => { setLoading(true); try {
        const res = await getBranches({ limit: 100 });
        setItems(res.data?.data?.items || []);
    }
    catch {
        toast.error("Unable to load branches. Please try again.");
    }
    finally {
        setLoading(false);
    } };
    useEffect(() => { load(); }, []);
    const save = async (event) => { event.preventDefault(); try {
        editing ? await updateBranch(editing._id, form) : await createBranch(form);
        toast.success(editing ? "Branch updated." : "Branch created.");
        setOpen(false);
        await load();
    }
    catch (error) {
        toast.error(error.response?.data?.message || "Unable to save branch.");
    } };
    const toggle = async (branch) => { try {
        await updateBranch(branch._id, { status: branch.status === "active" ? "inactive" : "active" });
        toast.success("Branch status updated.");
        load();
    }
    catch {
        toast.error("Unable to update branch status.");
    } };
    const remove = async (branch) => { if (!window.confirm("Delete this branch? Branches with members or staff must be deactivated instead."))
        return; try {
        await deleteBranch(branch._id);
        toast.success("Branch deleted.");
        load();
    }
    catch (error) {
        toast.error(error.response?.data?.message || "Unable to delete branch.");
    } };
    return _jsxs("div", { children: [_jsxs("div", { className: "page-header flex-responsive", children: [_jsxs("div", { children: [_jsx("h1", { children: "Branches" }), _jsx("p", { className: "text-muted", children: "Manage locations and branch operations." })] }), isSuperAdmin && _jsxs("button", { className: "btn btn-primary", onClick: () => { setEditing(null); setForm(blank); setOpen(true); }, children: [_jsx(Plus, { size: 17 }), " Add branch"] })] }), _jsx("div", { className: "branch-grid", children: loading ? _jsx("div", { className: "glass-panel branch-empty", children: "Loading branches..." }) : items.length ? items.map(branch => _jsxs("article", { className: "glass-panel branch-card", children: [_jsxs("div", { className: "branch-card-head", children: [_jsx("div", { className: "branch-mark", children: _jsx(Building2, { size: 20 }) }), _jsx("span", { className: `status-badge ${branch.status}`, children: branch.status })] }), _jsx("h2", { children: branch.name }), _jsx("p", { className: "text-muted", children: branch.branchCode }), _jsx("p", { className: "text-muted branch-address", children: branch.address || "No address provided" }), _jsxs("div", { className: "branch-card-actions", children: [_jsxs(Link, { className: "btn btn-secondary", to: `/branches/${branch._id}`, children: [_jsx(Eye, { size: 16 }), " View"] }), _jsx("button", { className: "btn-icon", title: "Edit branch", onClick: () => { setEditing(branch); setForm({ name: branch.name, branchCode: branch.branchCode, address: branch.address || "", phone: branch.phone || "", email: branch.email || "", status: branch.status }); setOpen(true); }, children: _jsx(Edit2, { size: 16 }) }), isSuperAdmin && _jsx("button", { className: "btn-icon", title: "Activate or deactivate", onClick: () => toggle(branch), children: _jsx(Power, { size: 16 }) }), isSuperAdmin && _jsx("button", { className: "btn-icon danger", title: "Delete branch", onClick: () => remove(branch), children: _jsx(Trash2, { size: 16 }) })] })] }, branch._id)) : _jsx("div", { className: "glass-panel branch-empty", children: "No branches available." }) }), _jsx(Modal, { isOpen: open, onClose: () => setOpen(false), title: editing ? "Edit branch" : "Add branch", children: _jsxs("form", { onSubmit: save, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Branch name" }), _jsx("input", { className: "form-input", required: true, value: form.name, onChange: e => setForm({ ...form, name: e.target.value }) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Branch code" }), _jsx("input", { className: "form-input", required: true, disabled: editing && !isSuperAdmin, value: form.branchCode, onChange: e => setForm({ ...form, branchCode: e.target.value.toUpperCase() }) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Address" }), _jsx("textarea", { className: "form-input", value: form.address, onChange: e => setForm({ ...form, address: e.target.value }) })] }), _jsxs("div", { className: "grid-cards", style: { gridTemplateColumns: "1fr 1fr", gap: "1rem" }, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Phone" }), _jsx("input", { className: "form-input", value: form.phone, onChange: e => setForm({ ...form, phone: e.target.value }) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Email" }), _jsx("input", { className: "form-input", type: "email", value: form.email, onChange: e => setForm({ ...form, email: e.target.value }) })] })] }), _jsx("button", { className: "btn btn-primary", type: "submit", children: editing ? "Save changes" : "Create branch" })] }) })] });
}
