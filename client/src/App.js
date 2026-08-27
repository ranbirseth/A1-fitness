import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Suspense, lazy, useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import { useAuthStore } from "./store/auth.store";
import { DEV_BYPASS_ENABLED, tryDevAutoLogin } from "./auth/devAuth";
import { tryDemoAutoLogin } from "./auth/demoAuth";
// Import styles directly in App.tsx to ensure they are loaded
import "./styles/variables.css";
import "./styles/glass.css";
import "./styles/layout.css";
import "./styles/components.css";
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const BranchesPage = lazy(() => import("./pages/BranchesPage"));
const BranchDetailsPage = lazy(() => import("./pages/BranchDetailsPage"));
const MembersPage = lazy(() => import("./pages/MembersPage"));
const TrainersPage = lazy(() => import("./pages/TrainersPage"));
const PlansPage = lazy(() => import("./pages/PlansPage"));
const AttendancePage = lazy(() => import("./pages/AttendancePage"));
const MemberAttendancePage = lazy(() => import("./pages/MemberAttendancePage"));
const WorkoutsPage = lazy(() => import("./pages/WorkoutsPage"));
const PaymentsPage = lazy(() => import("./pages/PaymentsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const PendingApprovalPage = lazy(() => import("./pages/PendingApprovalPage"));
const DiscardedPage = lazy(() => import("./pages/DiscardedPage"));
const AccessRestrictedPage = lazy(() => import("./pages/AccessRestrictedPage"));
const QRAttendancePage = lazy(() => import("./pages/QRAttendancePage"));
const InvoicesPage = lazy(() => import("./pages/InvoicesPage"));
const AdminsPage = lazy(() => import("./pages/AdminsPage"));
function App() {
    const { user, accessToken } = useAuthStore();
    // Hold rendering until the demo-mode / dev auto-login probe resolves so
    // the login page never flashes. Visitors with a persisted session skip
    // the probe entirely (authResolved starts true, no extra request).
    // When the server runs with DEMO_MODE=false this resolves after one
    // quick /auth/demo-status check and the normal login flow is used.
    const [authResolved, setAuthResolved] = useState(Boolean(user && accessToken));
    useEffect(() => {
        if (authResolved)
            return;
        let cancelled = false;
        tryDemoAutoLogin()
            .then((demoSignedIn) => {
            if (cancelled || demoSignedIn)
                return;
            // Local-dev-only convenience fallback (no-op in production builds).
            if (DEV_BYPASS_ENABLED)
                return tryDevAutoLogin();
        })
            .finally(() => {
            if (!cancelled)
                setAuthResolved(true);
        });
        return () => {
            cancelled = true;
        };
    }, []);
    if (!authResolved) {
        return (_jsx("div", { className: "loading-screen", style: {
                height: '100vh',
                width: '100vw',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0a0b10',
                color: '#ffffff'
            }, children: "Signing in..." }));
    }
    return (_jsxs(BrowserRouter, { future: {
            v7_startTransition: true,
            v7_relativeSplatPath: true
        }, children: [_jsx(Toaster, { position: "top-center", reverseOrder: false }), _jsx(Suspense, { fallback: _jsx("div", { className: "loading-screen", style: {
                        height: '100vh',
                        width: '100vw',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#0a0b10',
                        color: '#ffffff'
                    }, children: "Loading..." }), children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/signup", element: _jsx(SignupPage, {}) }), _jsx(Route, { path: "/forgot-password", element: _jsx(ForgotPasswordPage, {}) }), _jsx(Route, { path: "/reset-password/:token", element: _jsx(ResetPasswordPage, {}) }), _jsx(Route, { path: "/pending-approval", element: _jsx(PendingApprovalPage, {}) }), _jsx(Route, { path: "/account-inactive", element: _jsx(DiscardedPage, {}) }), _jsx(Route, { path: "/access-restricted", element: _jsx(AccessRestrictedPage, {}) }), _jsx(Route, { path: "/mark-attendance", element: _jsx(QRAttendancePage, {}) }), _jsx(Route, { path: "/", element: _jsx(ProtectedRoute, { roles: ["superadmin", "admin", "trainer", "member"], children: _jsx(AppLayout, { children: user?.role === "member" ? _jsx(Navigate, { to: "/my-attendance", replace: true }) : _jsx(DashboardPage, {}) }) }) }), _jsx(Route, { path: "/members", element: _jsx(ProtectedRoute, { roles: ["superadmin", "admin", "trainer"], children: _jsx(AppLayout, { children: _jsx(MembersPage, {}) }) }) }), _jsx(Route, { path: "/analytics", element: _jsx(ProtectedRoute, { roles: ["superadmin", "admin", "trainer"], children: _jsx(AppLayout, { children: _jsx(AnalyticsPage, {}) }) }) }), _jsx(Route, { path: "/branches", element: _jsx(ProtectedRoute, { roles: ["superadmin", "admin"], children: _jsx(AppLayout, { children: _jsx(BranchesPage, {}) }) }) }), _jsx(Route, { path: "/branches/:id", element: _jsx(ProtectedRoute, { roles: ["superadmin", "admin"], children: _jsx(AppLayout, { children: _jsx(BranchDetailsPage, {}) }) }) }), _jsx(Route, { path: "/trainers", element: _jsx(ProtectedRoute, { roles: ["superadmin", "admin"], children: _jsx(AppLayout, { children: _jsx(TrainersPage, {}) }) }) }), _jsx(Route, { path: "/admins", element: _jsx(ProtectedRoute, { roles: ["superadmin"], children: _jsx(AppLayout, { children: _jsx(AdminsPage, {}) }) }) }), _jsx(Route, { path: "/plans", element: _jsx(ProtectedRoute, { roles: ["superadmin", "admin"], children: _jsx(AppLayout, { children: _jsx(PlansPage, {}) }) }) }), _jsx(Route, { path: "/attendance", element: _jsx(ProtectedRoute, { roles: ["superadmin", "admin", "trainer"], children: _jsx(AppLayout, { children: _jsx(AttendancePage, {}) }) }) }), _jsx(Route, { path: "/my-attendance", element: _jsx(ProtectedRoute, { roles: ["member"], children: _jsx(AppLayout, { children: _jsx(MemberAttendancePage, {}) }) }) }), _jsx(Route, { path: "/workouts", element: _jsx(ProtectedRoute, { roles: ["superadmin", "admin", "trainer", "member"], children: _jsx(AppLayout, { children: _jsx(WorkoutsPage, {}) }) }) }), _jsx(Route, { path: "/payments", element: _jsx(ProtectedRoute, { roles: ["superadmin", "admin", "member"], children: _jsx(AppLayout, { children: _jsx(PaymentsPage, {}) }) }) }), _jsx(Route, { path: "/invoices", element: _jsx(ProtectedRoute, { roles: ["superadmin", "admin", "trainer", "member"], children: _jsx(AppLayout, { children: _jsx(InvoicesPage, {}) }) }) }), _jsx(Route, { path: "/settings", element: _jsx(ProtectedRoute, { roles: ["superadmin", "admin", "trainer", "member"], children: _jsx(AppLayout, { children: _jsx(SettingsPage, {}) }) }) }), _jsx(Route, { path: "/profile", element: _jsx(ProtectedRoute, { roles: ["superadmin", "admin", "trainer", "member"], children: _jsx(AppLayout, { children: _jsx(ProfilePage, {}) }) }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) })] }));
}
export default App;
