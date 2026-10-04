import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { friendlyError } from "../utils";

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [validToken, setValidToken] = useState(true);

  // Check for token in URL (Supabase puts it in hash or search params)
  useEffect(() => {
    const token = searchParams.get("access_token") || searchParams.get("token");
    const type = searchParams.get("type");
    
    if (!token && type !== "recovery") {
      // Token might be in hash fragment - handled by Supabase client
      setValidToken(true); // Let the updateUser call validate it
    }
  }, [searchParams]);

  function getStrength(password) {
    if (!password) return { score: 0, label: "" };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    return { score, label: labels[score] };
  }

  const { score, label } = getStrength(password);
  const colors = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password !== confirm) return setError("Passwords do not match.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (score < 3) return setError("Please choose a stronger password.");

    setBusy(true);
    try {
      await resetPassword(password);
      setSuccess(true);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  if (success) {
    return (
      <div className="center-screen">
        <div className="card auth-card">
          <div className="success-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <h1>Password updated</h1>
            <p className="muted">Your password has been reset successfully.</p>
            <button className="btn btn-primary" onClick={() => navigate("/login")} style={{ marginTop: "16px" }}>
              Log in now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="center-screen">
      <div className="card auth-card">
        <h1>Reset password</h1>
        <p className="muted">Enter your new password below</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group-custom">
            <label htmlFor="password">New password</label>
            <div className="input-with-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                disabled={busy}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
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
            <div className="password-strength">
              <div className="strength-bar">
                <div 
                  className="strength-fill" 
                  style={{ 
                    width: `${(score / 5) * 100}%`, 
                    backgroundColor: colors[score] 
                  }} 
                />
              </div>
              <span className="strength-label" style={{ color: colors[score] }}>
                {label}
              </span>
            </div>
          </div>

          <div className="input-group-custom">
            <label htmlFor="confirm">Confirm new password</label>
            <div className="input-with-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="confirm"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                required
                disabled={busy}
              />
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Updating..." : "Update password"}
          </button>
        </form>

        <p className="muted center" style={{ marginTop: "16px" }}>
          <a href="/login">Back to login</a>
        </p>
      </div>
    </div>
  );
}