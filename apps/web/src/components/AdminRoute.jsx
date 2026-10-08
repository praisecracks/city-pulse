import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * Protects admin routes. Unauthenticated users are redirected to the admin
 * login page. Authenticated non-admins (shouldn't happen, but defense in depth)
 * are redirected to the public home page.
 */
export default function AdminRoute() {
  const { token, isAdmin } = useAuth();

  if (!token) {
    return <Navigate to="/admin-pulse/login" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}