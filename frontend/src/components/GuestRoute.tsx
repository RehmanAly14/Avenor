import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../constants/routes";
import { FullScreenSpinner } from "./FullScreenSpinner";

/**
 * Inverse of ProtectedRoute — keeps an already-authenticated user off
 * guest-only pages (/login, /register) by bouncing them to the dashboard.
 * Waits out session restoration first so a logged-in user never flashes
 * the login form on refresh.
 */
export function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <FullScreenSpinner />;
  if (isAuthenticated) return <Navigate to={ROUTES.dashboard} replace />;
  return <>{children}</>;
}
