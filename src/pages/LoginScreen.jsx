import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { friendlyError } from "../utils";

export default function LoginScreen() {
  const { user, profile, loading, login, loginWithProvider } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [role, setRole] = useState("student");

  if (!loading && user && profile) {
    return <Navigate to={profile.role === "faculty" ? "/faculty" : profile.role === "admin" ? "/admin" : "/student"} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email.trim(), password, rememberMe);
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  async function handleSocialLogin(provider) {
    setError("");
    setBusy(true);
    try {
      await loginWithProvider(provider);
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  return (
    <div className="login-screen-page">
      <div className="login-screen-bg" />
      <div className="login-screen-overlay" />

      <div className="login-screen-card">
        <div className="login-screen-brand">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="login-screen-logo-icon">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          <div>
            <h1 className="login-screen-title">CampusGuide AI</h1>
            <p className="login-screen-subtitle">Sign In</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-screen-form">
          <div className="input-group-custom">
            <label htmlFor="login-email">Email / ID</label>
            <div className="input-with-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <input
                id="login-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={busy}
              />
            </div>
          </div>

          <div className="input-group-custom">
            <label htmlFor="login-password">Password</label>
            <div className="input-with-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete={rememberMe ? "current-password" : "one-time-code"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={busy}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="login-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={busy}
              />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" className="forgot-link">Need help?</Link>
          </div>

          <div className="input-group-custom">
            <label>Role</label>
            <div className="role-segmented">
              {["student", "faculty", "admin"].map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`role-seg ${role === r ? "active" : ""}`}
                  onClick={() => setRole(r)}
                  disabled={busy}
                >
                  {r === "student" ? "Student" : r === "faculty" ? "Faculty" : "Admin"}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="login-submit-btn" disabled={busy}>
            {busy ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="divider" role="separator" aria-label="or">
          <span>or continue with</span>
        </div>

        <div className="social-login">
          <button
            type="button"
            className="social-btn google"
            onClick={() => handleSocialLogin("google")}
            disabled={busy}
            aria-label="Sign in with Google"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Google</span>
          </button>
          <button
            type="button"
            className="social-btn microsoft"
            onClick={() => handleSocialLogin("azure")}
            disabled={busy}
            aria-label="Sign in with Microsoft"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12.24,0c6.37,0,11.52,5.15,11.52,11.52S18.62,23.04,12.24,23.04,0.72,17.89,0.72,11.52,5.87,0,12.24,0z M7.22,12.97h2.2V9.1h2.77v3.87h2.2v2.8h-2.2v3.87h-2.77v-3.87H7.22V12.97z"/>
            </svg>
            <span>Microsoft</span>
          </button>
        </div>

        <p className="login-footer-text">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
