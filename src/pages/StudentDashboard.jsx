import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";
import { getStudentClasses } from "../services/timetableService";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  NOTIF_ICON,
  timeAgo,
} from "../services/notificationService";

export default function StudentDashboard() {
  const { profile } = useAuth();
  const studentName = profile?.name || "Manya";
  const todayClasses = getStudentClasses().slice(0, 3);
  const [activeTab, setActiveTab] = useState("cards"); // "cards" | "schedule" | "notifications"
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    setNotifLoading(true);
    const [data, count] = await Promise.all([getNotifications(), getUnreadCount()]);
    setNotifications(data);
    setUnreadCount(count);
    setNotifLoading(false);
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  async function handleMarkRead(id) {
    await markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function handleMarkAllRead() {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }

  return (
    <AppLayout
      title="Student Dashboard"
      subtitle="Your campus overview & schedule"
    >
      {/* Welcome Greeting (Matching Screen 2) */}
      <div className="dashboard-welcome-banner">
        <h1 className="greeting-text">Good Morning, {studentName}! 👋</h1>
        <p className="greeting-sub">Here's your today's overview.</p>
      </div>

      {/* Tab Bar */}
      <div className="student-tab-bar">
        {["cards", "schedule", "notifications"].map((tab) => (
          <button
            key={tab}
            className={`student-tab-btn${activeTab === tab ? " active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "cards" ? "Quick Cards" : tab === "schedule" ? "Timetable" : (
              <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                Notifications
                {unreadCount > 0 && (
                  <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
                )}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── QUICK CARDS (DEFAULT) ── */}
      {activeTab === "cards" && (
        <div className="portal-cards-grid">
          <Link to="/student/timetable" className="portal-card card-blue">
            <div className="portal-icon-box icon-blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className="portal-card-body">
              <h3>Today's Timetable</h3>
              <span className="card-link-text">View your classes ›</span>
            </div>
          </Link>

          <Link to="/student/map" className="portal-card card-green">
            <div className="portal-icon-box icon-green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <div className="portal-card-body">
              <h3>Find Classroom</h3>
              <span className="card-link-text">Search & navigate ›</span>
            </div>
          </Link>

          <Link to="/student/map" className="portal-card card-indigo">
            <div className="portal-icon-box icon-indigo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <div className="portal-card-body">
              <h3>Campus Map</h3>
              <span className="card-link-text">Explore building map ›</span>
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
              <h3>Your Profile</h3>
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
            <Link to="/student/timetable" className="view-all-text">View All</Link>
          </div>

          <div className="class-schedule-list">
            {todayClasses.map((item) => (
              <div key={item.id} className="class-schedule-item">
                <div className="schedule-time-col">
                  <span className={`status-dot dot-${item.dot}`} />
                  <span className="time-text">{item.time}</span>
                </div>
                <div className="schedule-subject-col">
                  <span className="subject-title">{item.subject}</span>
                </div>
                <div className="schedule-room-col">
                  <Link 
                    to={`/student/map?dest=r_${item.room}`} 
                    className="room-tag-link"
                    title="Navigate to this room"
                  >
                    Room {item.room}
                    <span className="nav-arrow">↗</span>
                  </Link>
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
            {unreadCount > 0 && (
              <button className="mark-all-read-btn" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>

          {notifLoading ? (
            <div className="empty-state"><span className="empty-icon">⏳</span><p>Loading...</p></div>
          ) : notifications.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🔔</span>
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="notification-list">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-item${notif.is_read ? " notif-read" : " notif-unread"}`}
                  onClick={() => !notif.is_read && handleMarkRead(notif.id)}
                  style={{ cursor: notif.is_read ? "default" : "pointer" }}
                >
                  <div className={`notification-icon notif-${notif.type}`}>
                    {NOTIF_ICON[notif.type] ?? "ℹ️"}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">
                      {notif.title}
                      {!notif.is_read && <span className="unread-dot" />}
                    </div>
                    <div className="notification-message">{notif.message}</div>
                  </div>
                  <div className="notification-time">{timeAgo(notif.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
