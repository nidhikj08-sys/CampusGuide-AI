import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { settings as settingsStore, initSettings, getSettingsSync } from "../services/settingsService";
import { useAuth } from "../context/AuthContext";

const TEXT_SIZES = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "kn", label: "ಕನ್ನಡ (Kannada)" },
];

const DISTANCE_UNITS = [
  { value: "meters", label: "Meters" },
  { value: "feet", label: "Feet" },
];

const ROUTE_TYPES = [
  { value: "shortest", label: "Shortest route" },
  { value: "accessible", label: "Accessible route" },
];

const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System Default" },
];

export default function Settings() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeSection, setActiveSection] = useState("appearance");

  const [settings, setSettings] = useState(() => getSettingsSync());

  useEffect(() => {
    initSettings();
    const handler = () => setSettings(getSettingsSync());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  function update(key, value) {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      settingsStore.update(next);
      return next;
    });
    setSaved(false);
  }

  function updateNested(path, value) {
    setSettings((prev) => {
      const next = { ...prev, [path[0]]: { ...prev[path[0]], [path[1]]: value } };
      settingsStore.update(next);
      return next;
    });
    setSaved(false);
  }

  function handleReset() {
    settingsStore.reset();
    setSettings(getSettingsSync());
    setShowResetConfirm(false);
  }

  function handleDeleteAccount() {
    alert("Account deletion must be completed by an administrator. Please contact the campus IT desk.");
    setShowDeleteConfirm(false);
  }

  function handleSignOut() {
    logout();
    navigate("/login", { replace: true });
  }

  const section = (key, label, icon) => (
    <button
      key={key}
      className={`settings-nav-item ${activeSection === key ? "active" : ""}`}
      onClick={() => setActiveSection(key)}
    >
      <span className="settings-nav-icon">{icon}</span>
      <span className="settings-nav-label">{label}</span>
    </button>
  );

  return (
    <AppLayout title="Settings" subtitle="Manage your preferences">
      <div className="settings-page">
        <div className="settings-layout">
          <nav className="settings-nav">
            {section("appearance", "Appearance", "🎨")}
            {section("notifications", "Notifications", "🔔")}
            {section("navigation", "Navigation", "🧭")}
            {section("account", "Account", "👤")}
            {section("privacy", "Privacy", "🔐")}
            {section("language", "Language", "🌐")}
            {section("accessibility", "Accessibility", "♿")}
            {section("data", "Data & Connection", "📶")}
            {section("about", "About", "ℹ️")}
          </nav>

          <div className="settings-content">
            {saved && <div className="settings-saved">Settings saved</div>}

            {activeSection === "appearance" && (
              <div className="settings-section">
                <h3 className="settings-section-title">Appearance</h3>
                <div className="settings-card">
                  <div className="setting-row">
                    <div className="setting-info">
                      <span className="setting-label">Theme</span>
                      <span className="setting-desc">Choose app appearance</span>
                    </div>
                    <select
                      className="setting-select"
                      value={settings.theme}
                      onChange={(e) => update("theme", e.target.value)}
                    >
                      {THEME_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "notifications" && (
              <div className="settings-section">
                <h3 className="settings-section-title">Notifications</h3>
                <div className="settings-card">
                  <ToggleRow label="Notifications" desc="Receive push notifications" checked={settings.notificationsEnabled} onChange={(v) => update("notificationsEnabled", v)} />
                  <ToggleRow label="Notification Sound" desc="Play sound for notifications" checked={settings.notificationSound} onChange={(v) => update("notificationSound", v)} />
                  <ToggleRow label="Vibration" desc="Vibrate on new notification" checked={settings.vibration} onChange={(v) => update("vibration", v)} />
                </div>

                <h4 className="settings-subtitle">Notification Categories</h4>
                <div className="settings-card">
                  {[
                    { key: "classroom_changes", label: "Classroom changes" },
                    { key: "timetable_changes", label: "Timetable changes" },
                    { key: "important_announcements", label: "Important announcements" },
                    { key: "events", label: "Events" },
                    { key: "emergency", label: "Emergency notifications", locked: true },
                  ].map((cat) => (
                    <ToggleRow
                      key={cat.key}
                      label={cat.label}
                      checked={settings.notificationCategories[cat.key]}
                      onChange={(v) => updateNested(["notificationCategories", cat.key], v)}
                      locked={cat.locked}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeSection === "navigation" && (
              <div className="settings-section">
                <h3 className="settings-section-title">Navigation</h3>
                <div className="settings-card">
                  <ToggleRow label="Navigation Guidance" desc="Show turn-by-turn directions" checked={settings.navigationGuidance} onChange={(v) => update("navigationGuidance", v)} />
                  <ToggleRow label="Voice Guidance" desc="Speak directions aloud" checked={settings.voiceGuidance} onChange={(v) => update("voiceGuidance", v)} />
                  <SelectRow label="Distance Unit" value={settings.distanceUnit} options={DISTANCE_UNITS} onChange={(v) => update("distanceUnit", v)} />
                  <SelectRow label="Preferred Route" value={settings.preferredRoute} options={ROUTE_TYPES} onChange={(v) => update("preferredRoute", v)} />
                </div>
              </div>
            )}

            {activeSection === "account" && (
              <div className="settings-section">
                <h3 className="settings-section-title">Account & Profile</h3>
                <div className="settings-card">
                  <div className="setting-row">
                    <div className="setting-info">
                      <span className="setting-label">Name</span>
                      <span className="setting-value">{profile?.name || "-"}</span>
                    </div>
                  </div>
                  <div className="setting-row">
                    <div className="setting-info">
                      <span className="setting-label">Student ID</span>
                      <span className="setting-value">{profile?.usn || profile?.employee_id || "-"}</span>
                    </div>
                  </div>
                  <div className="setting-row">
                    <div className="setting-info">
                      <span className="setting-label">Year</span>
                      <span className="setting-value">{profile?.year || "-"}</span>
                    </div>
                  </div>
                  <div className="setting-row">
                    <div className="setting-info">
                      <span className="setting-label">Branch</span>
                      <span className="setting-value">{profile?.branch || profile?.department || "-"}</span>
                    </div>
                  </div>
                  <div className="setting-row">
                    <div className="setting-info">
                      <span className="setting-label">Section</span>
                      <span className="setting-value">{profile?.section || "-"}</span>
                    </div>
                  </div>
                  <div className="setting-row">
                    <div className="setting-info">
                      <span className="setting-label">Semester</span>
                      <span className="setting-value">{profile?.semester || "-"}</span>
                    </div>
                  </div>
                </div>

                <div className="settings-actions">
                  <button className="btn btn-outline" onClick={() => navigate("/profile")}>Edit Profile</button>
                  <button className="btn btn-outline" onClick={() => navigate("/forgot-password")}>Change Password</button>
                  <button className="btn btn-danger" onClick={handleSignOut}>Sign Out</button>
                </div>
              </div>
            )}

            {activeSection === "privacy" && (
              <div className="settings-section">
                <h3 className="settings-section-title">Privacy & Security</h3>
                <div className="settings-card">
                  <ToggleRow label="Save Login" desc="Stay signed in on this device" checked={settings.saveLogin} onChange={(v) => update("saveLogin", v)} />
                  <ToggleRow label="Show Profile Information" desc="Allow others to see your profile" checked={settings.showProfileInfo} onChange={(v) => update("showProfileInfo", v)} />
                </div>

                <div className="settings-actions">
                  <button className="btn btn-outline">Manage Account</button>
                  <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>Delete Account</button>
                </div>

                {showDeleteConfirm && (
                  <div className="confirm-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                      <h3>Delete Account?</h3>
                      <p>This action is irreversible. Your account data will be permanently removed.</p>
                      <div className="confirm-actions">
                        <button className="btn btn-outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                        <button className="btn btn-danger" onClick={handleDeleteAccount}>Delete</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSection === "language" && (
              <div className="settings-section">
                <h3 className="settings-section-title">Language</h3>
                <div className="settings-card">
                  <SelectRow label="Language" value={settings.language} options={LANGUAGES} onChange={(v) => update("language", v)} />
                  <p className="setting-desc" style={{ padding: "0 12px" }}>More languages will be added in future updates.</p>
                </div>
              </div>
            )}

            {activeSection === "accessibility" && (
              <div className="settings-section">
                <h3 className="settings-section-title">Accessibility</h3>
                <div className="settings-card">
                  <SelectRow label="Text Size" value={settings.textSize} options={TEXT_SIZES} onChange={(v) => update("textSize", v)} />
                  <ToggleRow label="High Contrast" desc="Increase contrast for better visibility" checked={settings.highContrast} onChange={(v) => update("highContrast", v)} />
                  <ToggleRow label="Reduce Animations" desc="Minimize motion effects" checked={settings.reduceAnimations} onChange={(v) => update("reduceAnimations", v)} />
                </div>
              </div>
            )}

            {activeSection === "data" && (
              <div className="settings-section">
                <h3 className="settings-section-title">Data & Connection</h3>
                <div className="settings-card">
                  <ToggleRow label="Allow Offline Maps" desc="Download maps for offline use" checked={settings.allowOfflineMaps} onChange={(v) => update("allowOfflineMaps", v)} />
                  <ToggleRow label="Cache Timetable" desc="Save timetable for offline access" checked={settings.cacheTimetable} onChange={(v) => update("cacheTimetable", v)} />
                  <ToggleRow label="Cache Building Map" desc="Save floor maps locally" checked={settings.cacheBuildingMap} onChange={(v) => update("cacheBuildingMap", v)} />
                </div>
                <div className="settings-card">
                  <div className="setting-row">
                    <div className="setting-info">
                      <span className="setting-label">Last Synced</span>
                      <span className="setting-desc">{new Date().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "about" && (
              <div className="settings-section">
                <h3 className="settings-section-title">About</h3>
                <div className="settings-card">
                  <div className="setting-row">
                    <div className="setting-info">
                      <span className="setting-label">CampusGuide</span>
                      <span className="setting-desc">Smart Indoor Navigation</span>
                    </div>
                  </div>
                  <div className="setting-row">
                    <div className="setting-info">
                      <span className="setting-label">Version</span>
                      <span className="setting-value">1.0.0</span>
                    </div>
                  </div>
                </div>

                <div className="settings-links">
                  <button className="settings-link-btn">About CampusGuide</button>
                  <button className="settings-link-btn">Help & Support</button>
                  <button className="settings-link-btn">Report a Problem</button>
                  <button className="settings-link-btn">Privacy Policy</button>
                  <button className="settings-link-btn">Terms of Service</button>
                </div>
              </div>
            )}

            <div className="settings-reset">
              <button className="btn btn-outline btn-danger-outline" onClick={() => setShowResetConfirm(true)}>Reset Settings</button>
            </div>

            {showResetConfirm && (
              <div className="confirm-modal-overlay" onClick={() => setShowResetConfirm(false)}>
                <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                  <h3>Reset all settings?</h3>
                  <p>This will restore all preferences to default. Your account, timetable, and profile will not be affected.</p>
                  <div className="confirm-actions">
                    <button className="btn btn-outline" onClick={() => setShowResetConfirm(false)}>Cancel</button>
                    <button className="btn btn-danger" onClick={handleReset}>Reset</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function ToggleRow({ label, desc, checked, onChange, locked }) {
  return (
    <div className="setting-row">
      <div className="setting-info">
        <span className="setting-label">{label}</span>
        {desc && <span className="setting-desc">{desc}</span>}
      </div>
      <label className="toggle-label">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={locked} />
        <span className="toggle-switch"></span>
        {locked && <span className="setting-lock">🔒</span>}
      </label>
    </div>
  );
}

function SelectRow({ label, value, options, onChange }) {
  return (
    <div className="setting-row">
      <div className="setting-info">
        <span className="setting-label">{label}</span>
      </div>
      <select className="setting-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
