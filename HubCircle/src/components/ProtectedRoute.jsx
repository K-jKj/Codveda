import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function ProtectedRoute() {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  return <Outlet />;
}