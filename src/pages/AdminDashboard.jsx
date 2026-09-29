import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { getDashboardStats, getClassrooms } from "../services/classroomService";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 120,
    totalFaculty: 25,
    totalClassrooms: 14,
    totalTimetables: 5,
  });
  const [recentRooms, setRecentRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const statsData = await getDashboardStats();
        setStats(statsData);

        const rooms = await getClassrooms();
        setRecentRooms(rooms.slice(0, 5));
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
      subtitle="Manage your campus resources and oversee building allocations."
    >
      {/* 4 Metric Stats Cards (Matching Mockup 7) */}
      <div className="stats-grid">
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

      {/* Quick Actions (Matching Mockup 7) */}
      <div className="dashboard-section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions-grid">
          <Link to="/admin/classrooms" className="action-card">
            <div className="action-icon icon-blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <span className="action-label">Add Classroom</span>
            <span className="action-desc">Register rooms, labs & offices</span>
          </Link>

          <Link to="/admin/classrooms" className="action-card">
            <div className="action-icon icon-green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="action-label">Manage Classrooms</span>
            <span className="action-desc">View, edit, or filter 3-floor map</span>
          </Link>

          <div className="action-card disabled-card" title="Coming in next phase">
            <div className="action-icon icon-amber">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </div>
            <span className="action-label">Add Faculty</span>
            <span className="action-desc">Enroll professors & staff</span>
          </div>

          <div className="action-card disabled-card" title="Coming in next phase">
            <div className="action-icon icon-purple">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <span className="action-label">Create Timetable</span>
            <span className="action-desc">Set period hours & allocations</span>
          </div>
        </div>
      </div>

      {/* Overview Table */}
      <div className="dashboard-section">
        <div className="section-header-flex">
          <h2 className="section-title">Recently Registered Classrooms</h2>
          <Link to="/admin/classrooms" className="view-all-link">
            View All Classrooms →
          </Link>
        </div>

        <div className="table-card">
          <div className="table-responsive">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Floor</th>
                  <th>Type</th>
                  <th>Capacity</th>
                  <th>Building</th>
                </tr>
              </thead>
              <tbody>
                {recentRooms.map((room) => (
                  <tr key={room.id}>
                    <td>
                      <span className="room-pill">Room {room.room_number}</span>
                    </td>
                    <td>
                      <span className="floor-badge">Floor {room.floor}</span>
                    </td>
                    <td>
                      <span className={`type-badge type-${room.type.toLowerCase().replace(/\s+/g, "-")}`}>
                        {room.type}
                      </span>
                    </td>
                    <td>{room.capacity || 60} seats</td>
                    <td className="cell-muted">{room.building || "Main Block"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
