import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import { friendlyError } from "../utils";

/* ──────────────────────────────────────────────
   QR code using a free library-free approach:
   encodes USN/EmployeeID as a data URL via canvas
   ────────────────────────────────────────────── */
function QRPlaceholder({ value }) {
  // Render a visual placeholder that looks like a QR
  const size = 80;
  const cells = 7;
  const cell = Math.floor(size / cells);
  // Simple deterministic pattern based on value chars
  const bits = value
    .split("")
    .map((c) => c.charCodeAt(0))
    .reduce((acc, n, i) => acc ^ (n << (i % 8)), 0);
  const grid = Array.from({ length: cells }, (_, r) =>
    Array.from({ length: cells }, (_, c) => {
      if (r < 2 && c < 2) return 1; // top-left finder
      if (r < 2 && c >= cells - 2) return 1; // top-right finder
      if (r >= cells - 2 && c < 2) return 1; // bottom-left finder
      return ((bits >> ((r * cells + c) % 16)) & 1) === 1 ? 1 : 0;
    })
  );

  return (
    <div className="id-qr-box">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {grid.map((row, r) =>
          row.map((filled, c) =>
            filled ? (
              <rect
                key={`${r}-${c}`}
                x={c * cell}
                y={r * cell}
                width={cell - 1}
                height={cell - 1}
                fill="#fff"
                rx="1"
              />
            ) : null
          )
        )}
      </svg>
      <span className="id-qr-label">Scan Here</span>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Field configs per role
   ────────────────────────────────────────────── */
const STUDENT_EXTRA_FIELDS = [
  { key: "blood_group", label: "Blood Group", type: "select", options: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] },
  { key: "emergency_contact", label: "Emergency Contact", type: "tel", placeholder: "+91 XXXXXXXXXX" },
  { key: "classroom", label: "Base Classroom", type: "text", placeholder: "e.g. Room 204 - CS Block" },
  { key: "semester", label: "Current Semester", type: "select", options: ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"] },
];

const FACULTY_EXTRA_FIELDS = [
  { key: "designation", label: "Designation", type: "text", placeholder: "e.g. Associate Professor" },
  { key: "cabin", label: "Cabin / Office", type: "text", placeholder: "e.g. Cabin F-12, 2nd Floor" },
  { key: "office_hours", label: "Office Hours", type: "text", placeholder: "e.g. Mon & Wed: 2:30-4:00 PM" },
  { key: "blood_group", label: "Blood Group", type: "select", options: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] },
  { key: "emergency_contact", label: "Emergency Contact", type: "tel", placeholder: "+91 XXXXXXXXXX" },
];

const BASE_FIELDS = {
  student: [
    { key: "name", label: "Full Name", type: "text", required: true },
    { key: "email", label: "Email", type: "email", required: true, disabled: true },
    { key: "usn", label: "USN / Student ID", type: "text", required: true },
    { key: "department", label: "Branch / Program", type: "text", placeholder: "e.g. B.E. Computer Science" },
    { key: "year", label: "Year", type: "select", options: ["1st Year", "2nd Year", "3rd Year", "4th Year"] },
    { key: "section", label: "Section", type: "select", options: ["A", "B", "C", "D"] },
    ...STUDENT_EXTRA_FIELDS,
  ],
  faculty: [
    { key: "name", label: "Full Name", type: "text", required: true },
    { key: "email", label: "Email", type: "email", required: true, disabled: true },
    { key: "employee_id", label: "Employee ID", type: "text", required: true },
    { key: "department", label: "Department", type: "text", required: true },
    ...FACULTY_EXTRA_FIELDS,
  ],
  admin: [
    { key: "name", label: "Full Name", type: "text", required: true },
    { key: "email", label: "Email", type: "email", required: true, disabled: true },
    { key: "department", label: "Department", type: "text" },
  ],
};

/* ──────────────────────────────────────────────
   Main Component
   ────────────────────────────────────────────── */
export default function Profile() {
  const { profile, updateProfile, user, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("id"); // "id" | "info" | "account"
  const [formData, setFormData] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef(null);

  const config = BASE_FIELDS[profile?.role] || BASE_FIELDS.student;

  // Sync form when profile loads or editing starts
  const startEdit = () => {
    const init = {};
    config.forEach((f) => { init[f.key] = profile?.[f.key] || ""; });
    setFormData(init);
    setEditing(true);
    setActiveTab("info");
    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    setEditing(false);
    setError("");
    setSuccess("");
  };

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
      if (profile?.role === "student") updates.usn = updates.usn?.toUpperCase().trim();
      await updateProfile(updates);
      setSuccess("Profile updated!");
      setEditing(false);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  // Photo upload handler — stores as base64 in localStorage (no Supabase Storage needed)
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Photo must be under 2 MB.");
      return;
    }
    setPhotoUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target.result;
        await updateProfile({ avatar_url: dataUrl });
        setPhotoUploading(false);
        setSuccess("Photo updated!");
      };
      reader.onerror = () => {
        setError("Failed to read file.");
        setPhotoUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Failed to upload photo.");
      setPhotoUploading(false);
    }
  };

  const handleNavigateToRoom = () => {
    const dest = profile?.classroom_id || profile?.cabin_id || "r_204";
    navigate(`/student/map?dest=${dest}`);
  };

  const handleDownloadID = () => {
    const card = document.getElementById("id-card-printable");
    if (!card) return;
    const w = window.open("", "_blank");
    w.document.write(`
      <html><head><title>Campus ID – ${profile?.name}</title>
      <style>
        body { margin: 0; font-family: sans-serif; background: #f3f5f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
        .id-card { width: 360px; border-radius: 18px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
      </style></head><body>
      ${card.outerHTML}
      <script>window.onload=()=>{ window.print(); }</scr` + `ipt>
      </body></html>
    `);
    w.document.close();
  };

  if (!profile) return <div className="center-screen">Loading profile…</div>;

  const idCode = profile.usn || profile.employee_id || profile.email;
  const avatarUrl = profile.avatar_url;
  const roomLabel = profile.role === "faculty"
    ? (profile.cabin || "Not set")
    : (profile.classroom || "Not set");
  const navigateLabel = profile.role === "faculty" ? "🗺️ Navigate to Cabin" : "🗺️ Navigate to Room";

  return (
    <AppLayout
      title="My Profile"
      subtitle="Your CampusGuide account"
    >
      <div className="profile-page-root">
        {/* ── TAB BAR ── */}
        <div className="profile-tabs-bar">
          {[
            { key: "id", label: "🪪 My ID Card" },
            { key: "info", label: "📋 Details" },
            { key: "account", label: "⚙️ Account" },
          ].map((t) => (
            <button
              key={t.key}
              className={`profile-tab-btn${activeTab === t.key ? " active" : ""}`}
              onClick={() => { setActiveTab(t.key); setEditing(false); setError(""); setSuccess(""); }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════
            TAB 1 – DIGITAL ID CARD
            ════════════════════════════════════ */}
        {activeTab === "id" && (
          <div className="profile-tab-content">
            {/* The printable ID Card */}
            <div id="id-card-printable" className="digital-id-card">
              {/* Header Bar */}
              <div className="id-card-header">
                <div className="id-header-college">
                  <span className="id-college-icon">🎓</span>
                  <div>
                    <div className="id-college-name">KVG College of Engineering</div>
                    <div className="id-college-sub">Sullia, Karnataka</div>
                  </div>
                </div>
                <div className="id-app-brand">CampusGuide</div>
              </div>

              {/* Body */}
              <div className="id-card-body">
                {/* Left: Photo + name */}
                <div className="id-card-left">
                  {/* Profile Photo */}
                  <div className="id-photo-wrapper">
                    {avatarUrl
                      ? <img src={avatarUrl} alt="Profile" className="id-photo-img" />
                      : <div className="id-photo-initials">{profile.name?.charAt(0)?.toUpperCase() || "?"}</div>
                    }
                    <button
                      className="id-photo-edit-btn"
                      onClick={() => fileInputRef.current?.click()}
                      title="Change photo"
                      disabled={photoUploading}
                    >
                      {photoUploading ? "⏳" : "📷"}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: "none" }}
                      onChange={handlePhotoChange}
                    />
                  </div>

                  {/* Identity */}
                  <div className="id-identity">
                    <div className="id-name">{profile.name}</div>
                    <div className="id-verified-badge">✅ Verified {profile.role === "faculty" ? "Faculty" : profile.role === "admin" ? "Admin" : "Student"}</div>
                    <div className="id-meta-row">
                      <span className="id-meta-label">{profile.role === "faculty" || profile.role === "admin" ? "Emp ID" : "USN"}</span>
                      <span className="id-meta-val">{idCode}</span>
                    </div>
                    <div className="id-meta-row">
                      <span className="id-meta-label">Branch</span>
                      <span className="id-meta-val">{profile.department || (profile.role === "student" ? "B.E. Computer Science" : "—")}</span>
                    </div>
                    {profile.role === "student" && (
                      <div className="id-meta-row">
                        <span className="id-meta-label">Year / Sec</span>
                        <span className="id-meta-val">{profile.year || "—"} · Sec {profile.section || "—"}</span>
                      </div>
                    )}
                    {profile.role === "faculty" && profile.designation && (
                      <div className="id-meta-row">
                        <span className="id-meta-label">Designation</span>
                        <span className="id-meta-val">{profile.designation}</span>
                      </div>
                    )}
                    <div className="id-meta-row">
                      <span className="id-meta-label">Valid Thru</span>
                      <span className="id-meta-val">{profile.valid_thru || "July 2028"}</span>
                    </div>
                  </div>
                </div>

                {/* Right: QR Code */}
                <div className="id-card-right">
                  <div className="id-qr-section">
                    <div className="id-qr-title">CAMPUS &amp; LIBRARY ACCESS</div>
                    <QRPlaceholder value={idCode || "KVGCE"} />
                  </div>
                  {profile.blood_group && (
                    <div className="id-blood-badge">
                      🩸 {profile.blood_group}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer stripe */}
              <div className="id-card-footer">
                <span>⚠️ If found, please return to the college administration</span>
              </div>
            </div>

            {success && <div className="alert alert-success" style={{ marginTop: 12 }}>{success}</div>}
            {error && <div className="alert alert-error" style={{ marginTop: 12 }}>{error}</div>}

            {/* Action Buttons */}
            <div className="id-card-actions">
              <button className="btn btn-outline btn-sm" onClick={startEdit}>✏️ Edit Info</button>
              <button className="btn btn-sm" style={{ background: "#059669" }} onClick={handleNavigateToRoom}>
                {navigateLabel}
              </button>
              <button className="btn btn-sm" onClick={handleDownloadID}>⬇️ Download ID</button>
            </div>

            {/* Quick Info Cards below ID */}
            <div className="id-info-cards-grid">
              {/* Academic / Role Info */}
              <div className="id-info-card">
                <div className="id-info-card-title">
                  {profile.role === "faculty" ? "📋 Faculty Details" : "📚 Academic Info"}
                </div>
                {profile.role === "student" && <>
                  <div className="id-info-row"><span>Semester</span><b>{profile.semester || "5th"}</b></div>
                  <div className="id-info-row"><span>CGPA</span><b>{profile.cgpa || "—"}</b></div>
                  <div className="id-info-row"><span>Credits</span><b>{profile.credits || "—"}</b></div>
                </>}
                {profile.role === "faculty" && <>
                  <div className="id-info-row"><span>Designation</span><b>{profile.designation || "—"}</b></div>
                  <div className="id-info-row"><span>Office Hours</span><b>{profile.office_hours || "—"}</b></div>
                  <div className="id-info-row"><span>Intercom</span><b>{profile.intercom || "—"}</b></div>
                </>}
                {profile.role === "admin" && <>
                  <div className="id-info-row"><span>Department</span><b>{profile.department || "Administration"}</b></div>
                  <div className="id-info-row"><span>Access Level</span><b>Full Admin</b></div>
                </>}
              </div>

              {/* Classroom / Cabin Card */}
              {(profile.role === "student" || profile.role === "faculty") && (
                <div className="id-info-card id-room-card">
                  <div className="id-info-card-title">
                    {profile.role === "faculty" ? "🚪 My Cabin" : "🏫 Base Classroom"}
                  </div>
                  <div className="id-room-display">{roomLabel}</div>
                  <button className="btn btn-sm" style={{ marginTop: 10, width: "100%" }} onClick={handleNavigateToRoom}>
                    {navigateLabel}
                  </button>
                </div>
              )}

              {/* Emergency Info */}
              {(profile.blood_group || profile.emergency_contact) && (
                <div className="id-info-card id-emergency-card">
                  <div className="id-info-card-title">🚨 Emergency Info</div>
                  {profile.blood_group && <div className="id-info-row"><span>Blood Group</span><b className="blood-tag">🩸 {profile.blood_group}</b></div>}
                  {profile.emergency_contact && (
                    <div className="id-info-row">
                      <span>Emergency</span>
                      <a href={`tel:${profile.emergency_contact}`} style={{ fontWeight: 700, color: "#dc2626" }}>
                        📞 {profile.emergency_contact}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            TAB 2 – DETAILS / EDIT FORM
            ════════════════════════════════════ */}
        {activeTab === "info" && (
          <div className="profile-tab-content">
            <div className="profile-detail-card card">
              <div className="profile-detail-header">
                <div className="profile-mini-avatar">
                  {avatarUrl
                    ? <img src={avatarUrl} alt="avatar" className="profile-mini-img" />
                    : <span>{profile.name?.charAt(0)?.toUpperCase()}</span>
                  }
                </div>
                <div>
                  <div className="profile-detail-name">{profile.name}</div>
                  <div className="profile-detail-role">{profile.email}</div>
                </div>
                {!editing && (
                  <button className="btn btn-outline btn-sm" style={{ marginLeft: "auto", marginTop: 0 }} onClick={startEdit}>
                    ✏️ Edit
                  </button>
                )}
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
                              value={formData[field.key] || ""}
                              onChange={(e) => handleChange(field.key, e.target.value)}
                              disabled={field.disabled || busy}
                            >
                              <option value="">— select —</option>
                              {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          ) : (
                            <input
                              type={field.type}
                              value={formData[field.key] || ""}
                              onChange={(e) => handleChange(field.key, e.target.value)}
                              disabled={field.disabled || busy}
                              placeholder={field.placeholder || field.label}
                            />
                          )
                        ) : (
                          <span>{profile[field.key] || <span className="muted">Not set</span>}</span>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>

                {editing && (
                  <div className="form-actions">
                    <button type="button" className="btn btn-outline" onClick={handleCancel} disabled={busy}>Cancel</button>
                    <button type="submit" className="btn" disabled={busy}>{busy ? "Saving…" : "Save Changes"}</button>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            TAB 3 – ACCOUNT & SETTINGS
            ════════════════════════════════════ */}
        {activeTab === "account" && (
          <div className="profile-tab-content">
            <div className="profile-detail-card card">
              <h2 style={{ marginBottom: 20 }}>⚙️ Account Settings</h2>
              <div className="account-section">
                <div className="account-section-title">Profile Photo</div>
                <div className="account-photo-row">
                  <div className="account-avatar">
                    {avatarUrl
                      ? <img src={avatarUrl} alt="avatar" className="account-avatar-img" />
                      : <span>{profile.name?.charAt(0)?.toUpperCase()}</span>
                    }
                  </div>
                  <div>
                    <button className="btn btn-outline btn-sm" onClick={() => fileInputRef.current?.click()} disabled={photoUploading}>
                      {photoUploading ? "⏳ Uploading…" : "📷 Upload New Photo"}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handlePhotoChange} />
                    <p className="muted" style={{ marginTop: 6, fontSize: "0.8rem" }}>JPG, PNG or WebP, max 2 MB</p>
                    {avatarUrl && (
                      <button className="btn btn-outline btn-sm" style={{ borderColor: "#dc2626", color: "#dc2626", marginTop: 4 }}
                        onClick={async () => { await updateProfile({ avatar_url: "" }); setSuccess("Photo removed."); }}>
                        🗑️ Remove Photo
                      </button>
                    )}
                  </div>
                </div>
              </div>

<div className="account-section">
                <div className="account-section-title">Role & Access</div>
                <div className="profile-row" style={{ borderBottom: "none" }}>
                  <dt>Account Type</dt>
                  <dd><span className={`role-badge role-${profile.role}`}>{profile.role?.toUpperCase()}</span></dd>
                </div>
                <div className="profile-row" style={{ borderBottom: "none" }}>
                  <dt>Account Email</dt>
                  <dd>{profile.email}</dd>
                </div>
              </div>

              <div className="account-section" style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #e2e8f0" }}>
                <div className="account-section-title" style={{ color: "#dc2626" }}>Danger Zone</div>
                <div className="account-danger-row">
                  <div>
                    <div style={{ fontWeight: 600, color: "#dc2626" }}>Sign Out</div>
                    <div className="muted" style={{ fontSize: "0.8rem", marginTop: 2 }}>Log out of your CampusGuide account on this device</div>
                  </div>
                  <button 
                    className="btn btn-danger btn-sm" 
                    onClick={logout}
                    style={{ background: "#dc2626", borderColor: "#dc2626", height: 36 }}
                  >
                    Logout
                  </button>
                </div>
              </div>

              {success && <div className="alert alert-success">{success}</div>}
              {error && <div className="alert alert-error">{error}</div>}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}