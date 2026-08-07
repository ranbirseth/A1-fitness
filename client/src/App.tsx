import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import { useAuthStore } from "./store/auth.store";

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

function App() {
  const { user } = useAuthStore();

  return (
    <BrowserRouter 
      future={{ 
        v7_startTransition: true, 
        v7_relativeSplatPath: true 
      }}
    >
      <Toaster position="top-center" reverseOrder={false} />
      <Suspense fallback={<div className="loading-screen" style={{ 
        height: '100vh', 
        width: '100vw', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#0a0b10',
        color: '#ffffff'
      }}>Loading...</div>}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/pending-approval" element={<PendingApprovalPage />} />
          <Route path="/account-inactive" element={<DiscardedPage />} />
          <Route path="/access-restricted" element={<AccessRestrictedPage />} />
          <Route path="/mark-attendance" element={<QRAttendancePage />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute roles={["superadmin", "admin", "trainer", "member"]}>
                <AppLayout>
                  {user?.role === "member" ? <Navigate to="/my-attendance" replace /> : <DashboardPage />}
                </AppLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/members"
            element={
              <ProtectedRoute roles={["superadmin", "admin", "trainer"]}>
                <AppLayout>
                  <MembersPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/trainers"
            element={
              <ProtectedRoute roles={["superadmin", "admin"]}>
                <AppLayout>
                  <TrainersPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/plans"
            element={
              <ProtectedRoute roles={["superadmin", "admin"]}>
                <AppLayout>
                  <PlansPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/attendance"
            element={
              <ProtectedRoute roles={["superadmin", "admin", "trainer"]}>
                <AppLayout>
                  <AttendancePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-attendance"
            element={
              <ProtectedRoute roles={["member"]}>
                <AppLayout>
                  <MemberAttendancePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/workouts"
            element={
              <ProtectedRoute roles={["superadmin", "admin", "trainer", "member"]}>
                <AppLayout>
                  <WorkoutsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/payments"
            element={
              <ProtectedRoute roles={["superadmin", "admin", "member"]}>
                <AppLayout>
                  <PaymentsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute roles={["superadmin", "admin", "trainer", "member"]}>
                <AppLayout>
                  <SettingsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute roles={["superadmin", "admin", "trainer", "member"]}>
                <AppLayout>
                  <ProfilePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
