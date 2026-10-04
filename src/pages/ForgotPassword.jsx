import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { friendlyError } from "../utils";

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center-screen">
      <div className="card auth-card">
        {!submitted ? (
          <>
            <h1>Forgot password?</h1>
            <p className="muted">Enter your email and we&apos;ll send you a reset link</p>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="input-group-custom">
                <label htmlFor="email">Email</label>
                <div className="input-with-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={busy}
                  />
                </div>
              </div>

              <button className="btn btn-primary" type="submit" disabled={busy}>
                {busy ? "Sending..." : "Send reset link"}
              </button>
            </form>

            <p className="muted center" style={{ marginTop: "16px" }}>
              <Link to="/login">Back to login</Link>
            </p>
          </>
        ) : (
          <>
            <div className="success-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" aria-hidden="true">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <h1>Check your inbox</h1>
              <p className="muted">
                We&apos;ve sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="muted" style={{ fontSize: "0.85rem", marginTop: "8px" }}>
                The link expires in 1 hour. If you don&apos;t see it, check your spam folder.
              </p>
              
              <div className="success-actions">
                <button className="btn btn-primary" onClick={() => navigate("/login")}>
                  Back to login
                </button>
                <button className="btn btn-secondary" onClick={() => setSubmitted(false)}>
                  Resend email
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}