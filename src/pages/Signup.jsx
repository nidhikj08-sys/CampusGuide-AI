import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { friendlyError, roleHome } from "../utils";

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const SECTIONS = ["A", "B", "C", "D"];

export default function Signup() {
  const { user, profile, loading, signup } = useAuth();
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

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) return setError("Passwords do not match.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");

    const extra =
      role === "student"
        ? { usn: form.usn.trim().toUpperCase(), year: form.year, section: form.section }
        : { employee_id: form.employeeId.trim(), department: form.department.trim() };

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
      // Otherwise the redirect happens automatically after signup
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  return (
    <div className="center-screen">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1>Create account</h1>
        <p className="muted">Join CampusGuide as a student or faculty member</p>

        <div className="segmented">
          {["student", "faculty"].map((r) => (
            <button type="button" key={r} className={role === r ? "seg active" : "seg"} onClick={() => setRole(r)}>
              {r === "student" ? "Student" : "Faculty"}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {info && <div className="alert alert-info">{info}</div>}

        <label>Full name</label>
        <input value={form.name} onChange={set("name")} placeholder="Your full name" required />

        <label>Email</label>
        <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" required />

        {role === "student" ? (
          <>
            <label>USN / Student ID</label>
            <input value={form.usn} onChange={set("usn")} placeholder="e.g. 4KV24CS123" required />
            <div className="row">
              <div>
                <label>Year</label>
                <select value={form.year} onChange={set("year")}>
                  {YEARS.map((y) => <option key={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label>Section</label>
                <select value={form.section} onChange={set("section")}>
                  {SECTIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </>
        ) : (
          <>
            <label>Employee ID</label>
            <input value={form.employeeId} onChange={set("employeeId")} placeholder="Your staff ID" required />
            <label>Department</label>
            <input value={form.department} onChange={set("department")} placeholder="e.g. Computer Science and Engineering" required />
          </>
        )}

        <label>Password</label>
        <input type="password" value={form.password} onChange={set("password")} placeholder="At least 6 characters" required />

        <label>Confirm password</label>
        <input type="password" value={form.confirm} onChange={set("confirm")} placeholder="Re-enter password" required />

        <button className="btn" disabled={busy}>{busy ? "Creating account..." : "Sign up"}</button>

        <p className="muted center">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
