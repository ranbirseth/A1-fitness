import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuthStore } from "../store/auth.store";

type Props = { children: ReactNode; roles?: Array<"superadmin" | "admin" | "trainer" | "member"> };

export default function ProtectedRoute({ children, roles }: Props) {
  const { user, accessToken } = useAuthStore();
  
  if (!accessToken || !user) return <Navigate to="/login" replace />;
  
  // Strict check for all roles: redirection if inactive
  if (user.status === "inactive") {
    return <Navigate to="/account-inactive" replace />;
  }

  // Role specific checks
  if (user.role === "member") {
    if (user.status === "pending") {
      return <Navigate to="/pending-approval" replace />;
    }
    if (user.status === "expired" || user.status === "frozen" || user.status === "cancelled") {
      return <Navigate to="/access-restricted" replace />;
    }
  }
  
  if (roles?.length && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
