import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { friendlyError, roleHome } from "../utils";

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const SECTIONS = ["A", "B", "C", "D"];

function PasswordStrengthMeter({ password }) {
  if (!password) return null;
  
  let score = 0;
  let feedback = [];
  
  if (password.length >= 8) score += 1;
  else feedback.push("at least 8 characters");
  
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push("one uppercase letter");
  
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push("one lowercase letter");
  
  if (/[0-9]/.test(password)) score += 1;
  else feedback.push("one number");
  
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else feedback.push("one special character");

  const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  const colors = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];
  
  return (
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
      <div className="strength-info">
        <span className="strength-label" style={{ color: colors[score] }}>
          {labels[score]}
        </span>
        {feedback.length > 0 && (
          <span className="strength-hint">
            Add: {feedback.join(", ")}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Signup() {
  const { user, profile, loading, signup } = useAuth();
  const [step, setStep] = useState(1); // 1: email/password, 2: profile
  const [role, setRole] = useState("student");
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirm: "",
    usn: "", year: YEARS[0], section: SECTIONS[0],
    employeeId: "", department: "",
  });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && user && profile) return <Navigate to={roleHome(profile.role)} replace />;

  const setField = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleStep1Submit(e) {
    e.preventDefault();
    setError("");
    
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    
    setStep(2);
  }

  async function handleStep2Submit(e) {
    e.preventDefault();
    setError("");
    
    const extra = role === "student"
      ? { usn: form.usn.trim().toUpperCase(), year: form.year, section: form.section }
      : { employee_id: form.employeeId.trim(), department: form.department.trim() };

    // Validate required fields
    if (role === "student") {
      if (!form.usn.trim()) return setError("USN/Student ID is required.");
    } else {
      if (!form.employeeId.trim()) return setError("Employee ID is required.");
      if (!form.department.trim()) return setError("Department is required.");
    }

    setBusy(true);
    try {
      const result = await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role,
        extra,
      });
      if (result.needsConfirmation) {
        setInfo("Account created! Check your email and click the confirmation link, then log in.");
        setBusy(false);
      }
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  function goBack() {
    setStep(1);
  }

  return (
    <div className="center-screen">
      <div className="card auth-card">
        <div className="signup-progress">
          <div className={`progress-step ${step >= 1 ? "active" : ""}`}>
            <span className="step-number">1</span>
            <span className="step-label">Account</span>
          </div>
          <div className="progress-line" />
          <div className={`progress-step ${step >= 2 ? "active" : ""}`}>
            <span className="step-number">2</span>
            <span className="step-label">Profile</span>
          </div>
        </div>

        {step === 1 && (
          <form onSubmit={handleStep1Submit}>
            <h1>Create your account</h1>
            <p className="muted">Enter your email and a strong password</p>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="input-group-custom">
              <label htmlFor="name">Full name</label>
              <input 
                id="name"
                value={form.name} 
                onChange={setField("name")} 
                placeholder="Your full name" 
                required 
                autoComplete="name"
                disabled={busy}
              />
            </div>

            <div className="input-group-custom">
              <label htmlFor="email">Email</label>
              <input 
                id="email"
                type="email" 
                inputMode="email"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                value={form.email} 
                onChange={setField("email")} 
                placeholder="you@example.com" 
                required 
                autoComplete="email"
                disabled={busy}
              />
            </div>

            <div className="input-group-custom">
              <label htmlFor="password">Password</label>
              <div className="input-with-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input 
                  id="password"
                  type="password" 
                  value={form.password} 
                  onChange={setField("password")} 
                  placeholder="At least 8 characters" 
                  required 
                  autoComplete="new-password"
                  disabled={busy}
                />
              </div>
              <PasswordStrengthMeter password={form.password} />
            </div>

            <div className="input-group-custom">
              <label htmlFor="confirm">Confirm password</label>
              <input 
                id="confirm"
                type="password" 
                value={form.confirm} 
                onChange={setField("confirm")} 
                placeholder="Re-enter password" 
                required 
                autoComplete="new-password"
                disabled={busy}
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? "Creating account..." : "Continue"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2Submit}>
            <h1>Complete your profile</h1>
            <p className="muted">Tell us a bit more about yourself</p>

            {error && <div className="alert alert-error">{error}</div>}
            {info && <div className="alert alert-info">{info}</div>}

            <div className="segmented">
              {["student", "faculty"].map((r) => (
                <button 
                  type="button" 
                  key={r} 
                  className={role === r ? "seg active" : "seg"} 
                  onClick={() => setRole(r)}
                  disabled={busy}
                >
                  {r === "student" ? "Student" : "Faculty"}
                </button>
              ))}
            </div>

            <div className="input-group-custom">
              <label htmlFor="name">Full name</label>
              <input 
                id="name"
                value={form.name} 
                onChange={setField("name")} 
                placeholder="Your full name" 
                required 
                autoComplete="name"
                disabled={busy}
              />
            </div>

            {role === "student" ? (
              <>
                <div className="input-group-custom">
                  <label htmlFor="usn">USN / Student ID</label>
                  <input 
                    id="usn"
                    value={form.usn} 
                    onChange={setField("usn")} 
                    placeholder="e.g. 4KV24CS123"
                    required 
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck="false"
                    disabled={busy}
                  />
                </div>
                <div className="row">
                  <div className="input-group-custom">
                    <label htmlFor="year">Year</label>
                    <select 
                      id="year"
                      value={form.year} 
                      onChange={setField("year")} 
                      required
                      disabled={busy}
                    >
                      {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div className="input-group-custom">
                    <label htmlFor="section">Section</label>
                    <select 
                      id="section"
                      value={form.section} 
                      onChange={setField("section")} 
                      required
                      disabled={busy}
                    >
                      {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="input-group-custom">
                  <label htmlFor="employeeId">Employee ID</label>
                  <input 
                    id="employeeId"
                    value={form.employeeId} 
                    onChange={setField("employeeId")} 
                    placeholder="Your staff ID"
                    required 
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck="false"
                    disabled={busy}
                  />
                </div>
                <div className="input-group-custom">
                  <label htmlFor="department">Department</label>
                  <input 
                    id="department"
                    value={form.department} 
                    onChange={setField("department")} 
                    placeholder="e.g. Computer Science and Engineering" 
                    required 
                    autoComplete="off"
                    disabled={busy}
                  />
                </div>
              </>
            )}

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={goBack} disabled={busy}>
                Back
              </button>
              <button className="btn btn-primary" type="submit" disabled={busy}>
                {busy ? "Creating account..." : "Create Account"}
              </button>
            </div>
          </form>
        )}

        <p className="muted center" style={{ marginTop: "16px" }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}