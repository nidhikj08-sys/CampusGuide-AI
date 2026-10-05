import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { getDashboardStats, getClassrooms } from "../services/classroomService";
import { getScanStats } from "../services/scanLogService";

const QUICK_ACTIONS = [
  { label: "Add Room", desc: "Register new room, lab or office", icon: "plus", color: "icon-blue", href: "/admin/classrooms/new" },
  { label: "Users", desc: "Manage students, faculty & admins", icon: "users", color: "icon-green", href: "/admin/users" },
  { label: "Timetable", desc: "Create & manage class schedules", icon: "calendar", color: "icon-amber", href: "/admin/timetable" },
  { label: "Notifications", desc: "Create & send notifications", icon: "bell", color: "icon-purple", href: "/admin/notifications" },
  { label: "Events", desc: "Manage campus events", icon: "star", color: "icon-pink", href: "/admin/events" },
];

const RECENT_CHANGES = [
  { type: "room", title: "Room 304 added", desc: "New lab on Floor 3", time: "2h ago", color: "icon-blue" },
  { type: "user", title: "5 students enrolled", desc: "CS Batch 2024", time: "4h ago", color: "icon-green" },
  { type: "timetable", title: "Timetable updated", desc: "Semester 5 schedule", time: "6h ago", color: "icon-amber" },
  { type: "notice", title: "Notice posted", desc: "Library hours changed", time: "8h ago", color: "icon-purple" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 120,
    totalFaculty: 25,
    totalClassrooms: 14,
    totalTimetables: 5,
  });
  const [recentRooms, setRecentRooms] = useState([]);
  const [scanStats, setScanStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const statsData = await getDashboardStats();
        setStats(statsData);

        const rooms = await getClassrooms();
        setRecentRooms(rooms.slice(0, 5));

        const scans = await getScanStats();
        setScanStats(scans);
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <AdminLayout
      title="Admin Dashboard"
      subtitle="Manage campus, rooms & users"
    >
      {/* 4 Metric Stats Cards - 2x2 Grid */}
      <div className="stats-grid stats-grid-2x2">
        <div className="stat-card blue">
          <div className="stat-icon-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Students</span>
            <span className="stat-number">{stats.totalStudents}</span>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Faculty</span>
            <span className="stat-number">{stats.totalFaculty}</span>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Classrooms</span>
            <span className="stat-number">{stats.totalClassrooms}</span>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">Timetables</span>
            <span className="stat-number">{stats.totalTimetables}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions - 2x2 Grid */}
      <div className="dashboard-section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions-grid quick-actions-2x2">
          {QUICK_ACTIONS.map((action, idx) => (
            <Link key={idx} to={action.href} className="action-card">
              <div className={`action-icon ${action.color}`}>
                {action.icon === "plus" && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                )}
                {action.icon === "users" && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                )}
                {action.icon === "calendar" && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                )}
                {action.icon === "bell" && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                )}
              </div>
              <span className="action-label">{action.label}</span>
              <span className="action-desc">{action.desc}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Changes / Notifications */}
      <div className="dashboard-section">
        <div className="section-header-flex">
          <h2 className="section-title">Recent Changes</h2>
          <Link to="/admin/activity" className="view-all-link">View All →</Link>
        </div>
        <div className="recent-changes-list">
          {RECENT_CHANGES.map((change, idx) => (
            <div key={idx} className="recent-change-item">
              <div className={`recent-change-icon ${change.color}`}>
                {change.type === "room" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>}
                {change.type === "user" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
                {change.type === "timetable" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
                {change.type === "notice" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>}
              </div>
              <div className="recent-change-content">
                <span className="recent-change-title">{change.title}</span>
                <span className="recent-change-desc">{change.desc}</span>
              </div>
              <span className="recent-change-time">{change.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Analytics - Keep at Bottom */}
      {scanStats && (
        <div className="dashboard-section">
          <h2 className="section-title">Navigation Analytics</h2>
          <div className="stats-grid stats-grid-four">
            <div className="stat-card indigo">
              <div className="stat-content">
                <span className="stat-label">Total QR Scans</span>
                <span className="stat-number">{scanStats.totalScans}</span>
              </div>
            </div>
            <div className="stat-card teal">
              <div className="stat-content">
                <span className="stat-label">Today</span>
                <span className="stat-number">{scanStats.todayScans}</span>
              </div>
            </div>
            <div className="stat-card pink">
              <div className="stat-content">
                <span className="stat-label">This Week</span>
                <span className="stat-number">{scanStats.weekScans}</span>
              </div>
            </div>
            <div className="stat-card lime">
              <div className="stat-content">
                <span className="stat-label">Accessible Routes</span>
                <span className="stat-number">{scanStats.accessibilityUsed}</span>
              </div>
            </div>
          </div>

          {/* Top Scanned Locations */}
          {scanStats.topNodes.length > 0 && (
            <div className="analytics-card">
              <h3 className="analytics-title">Top Scanned Locations</h3>
              <div className="analytics-list">
                {scanStats.topNodes.map((item, idx) => (
                  <div key={idx} className="analytics-item">
                    <span className="analytics-rank">#{idx + 1}</span>
                    <span className="analytics-name">{item.nodeId}</span>
                    <span className="analytics-count">{item.count} scans</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Popular Routes */}
          {scanStats.topRoutes.length > 0 && (
            <div className="analytics-card">
              <h3 className="analytics-title">Popular Routes</h3>
              <div className="analytics-list">
                {scanStats.topRoutes.map((item, idx) => (
                  <div key={idx} className="analytics-item">
                    <span className="analytics-rank">#{idx + 1}</span>
                    <span className="analytics-name">{item.route}</span>
                    <span className="analytics-count">{item.count} times</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}