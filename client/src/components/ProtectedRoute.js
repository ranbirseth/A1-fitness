import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
export default function ProtectedRoute({ children, roles }) {
    const { user, accessToken } = useAuthStore();
    if (!accessToken || !user)
        return _jsx(Navigate, { to: "/login", replace: true });
    // Strict check for all roles: redirection if inactive
    if (user.status === "inactive") {
        return _jsx(Navigate, { to: "/account-inactive", replace: true });
    }
    // Role specific checks
    if (user.role === "member") {
        if (user.status === "pending") {
            return _jsx(Navigate, { to: "/pending-approval", replace: true });
        }
        if (user.status === "expired" || user.status === "frozen" || user.status === "cancelled") {
            return _jsx(Navigate, { to: "/access-restricted", replace: true });
        }
    }
    if (roles?.length && !roles.includes(user.role))
        return _jsx(Navigate, { to: "/", replace: true });
    return _jsx(_Fragment, { children: children });
}
