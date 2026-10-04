import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";
import { getStudentClasses } from "../services/timetableService";

const NOTIFICATIONS = [
  { id: 1, type: "room-change", title: "Room Change", message: "CS501 moved to Room 302 - 2nd Floor", time: "2 min ago", action: "/student/map" },
  { id: 2, type: "timetable", title: "Timetable Update", message: "New class added: Data Structures at 10:15 AM", time: "15 min ago", action: "/student/timetable" },
  { id: 3, type: "alert", title: "System Alert", message: "QR code scan limit reached for today", time: "30 min ago", action: "/profile" },
  { id: 4, type: "shift", title: "Shift Request", message: "Faculty requested room change for CS lab", time: "1 hour ago", action: "/faculty/request-change" },
  { id: 5, type: "info", title: "Info", message: "Library opens at 8 AM - Don't be late!", time: "2 hours ago", action: "/student/map" },
];

export default function StudentDashboard() {
  const { profile } = useAuth();
  const studentName = profile?.name || "Manya";
  const todayClasses = getStudentClasses().slice(0, 3);
  const [activeTab, setActiveTab] = useState("cards"); // "cards" | "schedule" | "notifications"

  return (
    <AppLayout>
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
            {tab === "cards" ? "Quick Cards" : tab === "schedule" ? "Timetable" : "Notifications"}
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
            <span className="muted">{NOTIFICATIONS.length} new</span>
          </div>

          <div className="notification-list">
            {NOTIFICATIONS.map((notif) => (
              <div key={notif.id} className="notification-item">
                <div className="notification-icon {notif.type}">
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

      {/* Today's Classes List */}
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
    </AppLayout>
  );
}
