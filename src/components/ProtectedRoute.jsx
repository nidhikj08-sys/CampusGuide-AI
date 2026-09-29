import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { roleHome } from "../utils";

// allow = list of roles that may open this page
export default function ProtectedRoute({ allow, children }) {
  const { user, profile, loading, logout } = useAuth();

  if (loading) return <div className="center-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (!profile) {
    return (
      <div className="center-screen">
        <div className="card">
          <h2>Profile not found</h2>
          <p className="muted">
            Your account exists but has no profile record. Please sign up again or contact the admin.
          </p>
          <button className="btn" onClick={logout}>Log out</button>
        </div>
      </div>
    );
  }

  if (allow && !allow.includes(profile.role)) {
    return <Navigate to={roleHome(profile.role)} replace />;
  }
  return children;
}
