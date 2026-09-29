import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { friendlyError, roleHome } from "../utils";

export default function Login() {
  const { user, profile, loading, login, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // If already authenticated and profile loaded, navigate to role home
  if (!loading && user && profile) {
    return <Navigate to={roleHome(profile.role)} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  // Quick Demo Login bypass for fast testing of Student, Faculty, Admin views
  function handleQuickDemo(role) {
    loginAsDemo(role);
    if (role === "student") navigate("/student");
    else if (role === "faculty") navigate("/faculty");
    else if (role === "admin") navigate("/admin");
  }

  return (
    <div className="login-split-page">
      <div className="login-container">
        {/* Left Side: Campus Branding & Photo (Matching Screen 1) */}
        <div className="login-left-panel">
          <div className="panel-brand">
            <div className="panel-pin-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <div>
              <h2 className="panel-title">CampusGuide</h2>
              <p className="panel-tagline">Find Your Way, Every Day</p>
            </div>
          </div>

          <div className="panel-image-wrapper">
            <img 
              src="/campus_building.jpg" 
              alt="College Campus Building" 
              className="campus-building-img"
              onError={(e) => {
                // Fallback styling if local image load fails
                e.target.style.display = 'none';
              }}
            />
          </div>

          <div className="panel-footer">
            <span>Smart Navigation</span>
            <span className="dot-sep">•</span>
            <span>Classrooms</span>
            <span className="dot-sep">•</span>
            <span>Timetable</span>
          </div>
        </div>

        {/* Right Side: Login Form (Matching Screen 1) */}
        <div className="login-right-panel">
          <div className="login-form-box">
            <h1 className="login-heading">Login</h1>
            <p className="login-subheading">Access your campus account</p>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form-body">
              <div className="input-group-custom">
                <label>Email ID</label>
                <div className="input-with-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className="input-group-custom">
                <label>Password</label>
                <div className="input-with-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? "👁️" : "🙈"}
                  </button>
                </div>
              </div>

              <div className="input-group-custom">
                <label>Login as</label>
                <div className="select-with-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="login-submit-btn" disabled={busy}>
                {busy ? "Logging in..." : "Login"}
              </button>
            </form>

            <div className="quick-preview-box">
              <span className="preview-label">Quick Preview Mode:</span>
              <div className="preview-buttons">
                <button type="button" onClick={() => handleQuickDemo("student")} className="demo-btn">
                  🎓 Student
                </button>
                <button type="button" onClick={() => handleQuickDemo("faculty")} className="demo-btn">
                  👨‍🏫 Faculty
                </button>
                <button type="button" onClick={() => handleQuickDemo("admin")} className="demo-btn">
                  ⚙️ Admin
                </button>
              </div>
            </div>

            <p className="login-footer-text">
              Don't have an account? <Link to="/signup">Create one here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
