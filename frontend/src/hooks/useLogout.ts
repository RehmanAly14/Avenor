import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../constants/routes";

/**
 * AuthProvider sits outside BrowserRouter (see main.tsx), so it can't
 * navigate itself — it only clears auth state. This hook pairs that with
 * the explicit redirect to the public homepage, so every "Sign out"
 * control in the app behaves the same way instead of relying on
 * ProtectedRoute's incidental redirect-to-/login-on-state-change.
 */
export function useLogout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return () => {
    logout();
    navigate(ROUTES.landing, { replace: true });
  };
}
