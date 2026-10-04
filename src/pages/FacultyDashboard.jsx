import { useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";
import { getFacultyClasses } from "../services/timetableService";

const NOTIFICATIONS = [
  { id: 1, type: "room-change", title: "Room Change", message: "CS501 moved to Room 302 - 2nd Floor", time: "2 min ago", action: "/faculty/request-change" },
  { id: 2, type: "timetable", title: "Timetable Update", message: "New class added: Data Structures at 10:15 AM", time: "15 min ago", action: "/faculty/timetable" },
  { id: 3, type: "alert", title: "System Alert", message: "QR code scan limit reached for today", time: "30 min ago", action: "/profile" },
  { id: 4, type: "shift", title: "Shift Request", message: "Faculty requested room change for CS lab", time: "1 hour ago", action: "/faculty/request-change" },
  { id: 5, type: "info", title: "Info", message: "Library opens at 8 AM - Don't be late!", time: "2 hours ago", action: "/student/map" },
];

export default function FacultyDashboard() {
  const { profile } = useAuth();
  const facultyName = profile?.name || "Dr. Sneha";
  const facultyClasses = getFacultyClasses();
  const [activeTab, setActiveTab] = useState("cards"); // "cards" | "schedule" | "notifications"

  return (
    <AppLayout>
      {/* Welcome Header (Matching Screen 5) */}
      <div className="dashboard-welcome-banner">
        <h1 className="greeting-text">Welcome, {facultyName}</h1>
        <p className="greeting-sub">Here's your faculty dashboard.</p>
      </div>

      {/* Tab Bar */}
      <div className="faculty-tab-bar">
        {["cards", "schedule", "notifications"].map((tab) => (
          <button
            key={tab}
            className={`faculty-tab-btn${activeTab === tab ? " active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "cards" ? "Quick Cards" : tab === "schedule" ? "Timetable" : "Notifications"}
          </button>
        ))}
      </div>

      {/* ── QUICK CARDS (DEFAULT) ── */}
      {activeTab === "cards" && (
        <div className="portal-cards-grid">
          <Link to="/faculty/timetable" className="portal-card card-blue">
            <div className="portal-icon-box icon-blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className="portal-card-body">
              <h3>My Timetable</h3>
              <span className="card-link-text">View your classes ›</span>
            </div>
          </Link>

          <Link to="/student/map?dest=r_204" className="portal-card card-green">
            <div className="portal-icon-box icon-green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div className="portal-card-body">
              <h3>My Classroom</h3>
              <span className="card-link-text">View assigned room ›</span>
            </div>
          </Link>

          <Link to="/faculty/request-change" className="portal-card card-indigo">
            <div className="portal-icon-box icon-indigo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 3h5v5" />
                <path d="M4 20L21 3" />
                <path d="M21 16v5h-5" />
                <path d="M15 15l6 6" />
                <path d="M4 4l5 5" />
              </svg>
            </div>
            <div className="portal-card-body">
              <h3>Request Change</h3>
              <span className="card-link-text">Change classroom ›</span>
            </div>
          </Link>

          <Link to="/profile" className="portal-card card-purple">
            <div className="portal-icon-box icon-purple">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="portal-card-body">
              <h3>Profile</h3>
              <span className="card-link-text">View / edit details ›</span>
            </div>
          </Link>
        </div>
      )}

      {/* ── SCHEDULE LIST ── */}
      {activeTab === "schedule" && (
        <div className="schedule-panel">
          <div className="schedule-header">
            <h2>Today's Classes</h2>
            <Link to="/faculty/timetable" className="view-all-text">View All</Link>
          </div>

          <div className="class-schedule-list">
            {facultyClasses.map((item) => (
              <div key={item.id} className="class-schedule-item">
                <div className="schedule-time-col">
                  <span className={`status-dot dot-${item.dot}`} />
                  <span className="time-text">{item.time}</span>
                </div>
                <div className="schedule-subject-col">
                  <span className="subject-title">{item.subject}</span>
                  <span className="section-subtitle">{item.section}</span>
                </div>
                <div className="schedule-room-col">
                  <span className="room-label-tag">Room {item.room}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS ── */}
      {activeTab === "notifications" && (
        <div className="notification-panel">
          <div className="notification-header">
            <h2>Notifications</h2>
            <span className="muted">{NOTIFICATIONS.length} new</span>
          </div>

          <div className="notification-list">
            {NOTIFICATIONS.map((notif) => (
              <div key={notif.id} className="notification-item">
                <div className={`notification-icon notif-${notif.type}`}>
                  {notif.type === "room-change" ? "🏫" : notif.type === "timetable" ? "📅" : notif.type === "alert" ? "⚠️" : notif.type === "shift" ? "🔄" : "ℹ️"}
                </div>
                <div className="notification-content">
                  <div className="notification-title">{notif.title}</div>
                  <div className="notification-message">{notif.message}</div>
                </div>
                <div className="notification-time">{notif.time}</div>
              </div>
            ))}
          </div>

          {NOTIFICATIONS.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">ℹ️</span>
              <p>No new notifications</p>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
