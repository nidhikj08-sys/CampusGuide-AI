import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LABELS = {
  name: "Name",
  email: "Email",
  role: "Role",
  usn: "USN / ID",
  year: "Year",
  section: "Section",
  employee_id: "Employee ID",
  department: "Department",
};

export default function DashboardLayout({ title, children }) {
  const { profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="dash">
      <header className="dash-header">
        <div>
          <h1>{title}</h1>
          <p className="muted">Welcome, {profile.name}</p>
        </div>
        <div className="header-actions">
          <Link to="/profile" className="btn btn-outline" style={{ textDecoration: "none" }}>
            My Profile
          </Link>
          <button className="btn btn-outline" onClick={handleLogout}>Log out</button>
        </div>
      </header>

      <section className="card">
        <h2>Your Profile</h2>
        <dl className="profile">
          {Object.keys(LABELS).map(
            (key) =>
              profile[key] && (
                <div key={key} className="profile-row">
                  <dt>{LABELS[key]}</dt>
                  <dd className={key === "role" ? "cap" : ""}>{profile[key]}</dd>
                </div>
              )
          )}
        </dl>
        <Link to="/profile" className="btn btn-sm" style={{ textDecoration: "none", display: "inline-block", marginTop: "0.75rem" }}>
          View / Edit Profile
        </Link>
      </section>

      {children}
    </div>
  );
}
