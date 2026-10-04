import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { friendlyError } from "../utils";
import { supabase } from "../supabase";

export default function VerifyEmail() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("checking"); // checking, confirmed, error, sent
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkConfirmation = async () => {
      const token = searchParams.get("access_token");
      const type = searchParams.get("type");
      
      if (token && type === "signup") {
        // Token is in URL - user clicked email link
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(token);
          if (error) throw error;
          setStatus("confirmed");
        } catch (err) {
          setStatus("error");
          setError("This confirmation link is invalid or has expired.");
        }
      } else if (user && !user.email_confirmed_at) {
        // User is logged in but email not confirmed
        setStatus("sent");
        setEmail(user.email);
      } else if (user && user.email_confirmed_at) {
        setStatus("confirmed");
      } else {
        setStatus("sent");
      }
    };

    checkConfirmation();
  }, [searchParams, user]);

  async function resendConfirmation() {
    if (!email) return;
    setBusy(true);
    setError("");
    try {
      const { error } = await supabase.auth.resend({ 
        type: "signup", 
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
      });
      if (error) throw error;
      // Stay on same status but could show toast
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  if (status === "checking") {
    return (
      <div className="center-screen">
        <div className="card auth-card">
          <div className="loading-state">
            <div className="spinner" />
            <p>Verifying your email...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "confirmed") {
    return (
      <div className="center-screen">
        <div className="card auth-card">
          <div className="success-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <h1>Email confirmed!</h1>
            <p className="muted">Your account is ready. You can now log in.</p>
            <Link to="/login" className="btn btn-primary" style={{ marginTop: "16px", display: "inline-block" }}>
              Log in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="center-screen">
      <div className="card auth-card">
        <h1>Confirm your email</h1>
        <p className="muted">
          We&apos;ve sent a confirmation link to <strong>{email || "your email"}</strong>
        </p>
        <p className="muted" style={{ marginTop: "8px", fontSize: "0.85rem" }}>
          Click the link in the email to verify your account, then come back here.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="verify-actions">
          <button className="btn btn-primary" onClick={resendConfirmation} disabled={busy}>
            {busy ? "Sending..." : "Resend email"}
          </button>
          <Link to="/login" className="btn btn-secondary">
            Back to login
          </Link>
        </div>

        <p className="muted center" style={{ marginTop: "20px", fontSize: "0.8rem" }}>
          Didn&apos;t receive it? Check your spam folder or{" "}
          <a href="/forgot-password">request a password reset</a> instead.
        </p>
      </div>
    </div>
  );
}