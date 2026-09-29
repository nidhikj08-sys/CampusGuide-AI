import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { friendlyError } from "../utils";

const FIELD_CONFIG = {
  student: [
    { key: "name", label: "Full Name", type: "text", required: true },
    { key: "email", label: "Email", type: "email", required: true, disabled: true },
    { key: "usn", label: "USN / Student ID", type: "text", required: true },
    { key: "year", label: "Year", type: "select", options: ["1st Year", "2nd Year", "3rd Year", "4th Year"] },
    { key: "section", label: "Section", type: "select", options: ["A", "B", "C", "D"] },
  ],
  faculty: [
    { key: "name", label: "Full Name", type: "text", required: true },
    { key: "email", label: "Email", type: "email", required: true, disabled: true },
    { key: "employee_id", label: "Employee ID", type: "text", required: true },
    { key: "department", label: "Department", type: "text", required: true },
  ],
  admin: [
    { key: "name", label: "Full Name", type: "text", required: true },
    { key: "email", label: "Email", type: "email", required: true, disabled: true },
  ],
};

export default function Profile() {
  const { profile, updateProfile, user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const config = FIELD_CONFIG[profile?.role] || FIELD_CONFIG.student;

  useEffect(() => {
    if (profile) {
      const initialData = {};
      config.forEach((field) => {
        initialData[field.key] = profile[field.key] || "";
      });
      setFormData(initialData);
    }
  }, [profile, config]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const updates = { ...formData };
      if (profile.role === "student") {
        updates.usn = updates.usn?.toUpperCase().trim();
      }
      await updateProfile(updates);
      setSuccess("Profile updated successfully!");
      setEditing(false);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = () => {
    setFormData((prev) => {
      const reset = {};
      config.forEach((field) => {
        reset[field.key] = profile[field.key] || "";
      });
      return reset;
    });
    setEditing(false);
    setError("");
    setSuccess("");
  };

  if (!profile) return <div className="center-screen">Loading...</div>;

  return (
    <div className="center-screen">
      <div className="card auth-card profile-card" style={{ maxWidth: "600px", width: "100%" }}>
        <div className="profile-header">
          <div className="avatar-lg">{profile.name?.charAt(0)?.toUpperCase() || "?"}</div>
          <div>
            <h1>{editing ? "Edit Profile" : "My Profile"}</h1>
            <p className="muted">{profile.role} • {profile.email}</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <dl className="profile-view">
            {config.map((field) => (
              <div key={field.key} className="profile-row">
                <dt>{field.label}</dt>
                <dd>
                  {editing ? (
                    field.type === "select" ? (
                      <select
                        value={formData[field.key] || field.options[0]}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        disabled={field.disabled || busy}
                        required={field.required}
                      >
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={formData[field.key] || ""}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        disabled={field.disabled || busy}
                        required={field.required}
                        placeholder={field.label}
                      />
                    )
                  ) : (
                    formData[field.key] || <span className="muted">Not set</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>

          <div className="form-actions">
            {editing ? (
              <>
                <button type="button" className="btn btn-outline" onClick={handleCancel} disabled={busy}>
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={busy}>
                  {busy ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : (
              <button type="button" className="btn" onClick={() => setEditing(true)}>
                Edit Profile
              </button>
            )}
          </div>
        </form>

        <div className="profile-role-badge">
          <span className={`role-badge role-${profile.role}`}>{profile.role}</span>
        </div>
      </div>
    </div>
  );
}