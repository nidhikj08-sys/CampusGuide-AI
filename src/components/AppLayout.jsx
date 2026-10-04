import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import InstallPwaPrompt from "./InstallPwaPrompt";

export default function AppLayout({ children, title, subtitle }) {
  const { profile, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = profile?.role || "student";

  // Navigation Links based on user role (matching Mockups 2, 5, 7, 8)
  const navConfigs = {
    student: [
      { label: "Dashboard", path: "/student", icon: "📊" },
      { label: "Timetable", path: "/student/timetable", icon: "📅" },
      { label: "Find Classroom", path: "/student/map", icon: "🔍" },
      { label: "Map & Navigation", path: "/student/map", icon: "🗺️" },
      { label: "Profile", path: "/profile", icon: "👤" },
    ],
    faculty: [
      { label: "Dashboard", path: "/faculty", icon: "📊" },
      { label: "Timetable", path: "/faculty/timetable", icon: "📅" },
      { label: "My Classroom", path: "/student/map?dest=r_204", icon: "🏫" },
      { label: "Request Change", path: "/faculty/request-change", icon: "🔄" },
      { label: "Profile", path: "/profile", icon: "👤" },
    ],
    admin: [
      { label: "Dashboard", path: "/admin", icon: "📊" },
      { label: "Manage Classrooms", path: "/admin/classrooms", icon: "🏫" },
      { label: "Manage Faculty", path: "/admin/faculty", icon: "👨‍🏫" },
      { label: "Manage Students", path: "/admin/students", icon: "👥" },
      { label: "Create Timetable", path: "/admin/timetable", icon: "📅" },
      { label: "Profile", path: "/profile", icon: "👤" },
    ],
  };

  const navItems = navConfigs[role] || navConfigs.student;

  // Mobile Bottom Nav items (4 primary tabs)
  const mobileTabs = {
    student: [
      { label: "Dashboard", path: "/student", icon: "📊" },
      { label: "Timetable", path: "/student/timetable", icon: "📅" },
      { label: "Map", path: "/student/map", icon: "🗺️" },
      { label: "Profile", path: "/profile", icon: "👤" },
    ],
    faculty: [
      { label: "Dashboard", path: "/faculty", icon: "📊" },
      { label: "Timetable", path: "/faculty/timetable", icon: "📅" },
      { label: "Shift Req", path: "/faculty/request-change", icon: "🔄" },
      { label: "Profile", path: "/profile", icon: "👤" },
    ],
    admin: [
      { label: "Dashboard", path: "/admin", icon: "📊" },
      { label: "Rooms", path: "/admin/classrooms", icon: "🏫" },
      { label: "Map", path: "/student/map", icon: "🗺️" },
      { label: "Profile", path: "/profile", icon: "👤" },
    ],
  };

  const currentMobileTabs = mobileTabs[role] || mobileTabs.student;

  // Display user role label
  const roleDisplay = {
    student: "Student",
    faculty: "Faculty",
    admin: "Administrator",
  }[role] || "User";

  const displayName = profile?.name || (role === "faculty" ? "Dr. Sneha" : role === "student" ? "Manya" : "Admin");

  return (
    <div className="admin-shell">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div className="admin-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Unified Sidebar (Matches Mockups 2, 3, 5, 7, 8) */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <div className="brand-text">
            <h2>CampusGuide</h2>
            <p>Smart Indoor Navigation</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, idx) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={idx}
                to={item.path}
                className={`sidebar-link ${isActive ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <InstallPwaPrompt />
          <button className="sidebar-logout-btn" onClick={logout}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Page Area */}
      <div className="admin-main">
        {/* Header Bar */}
        <header className="admin-header">
          <div className="header-left">
            <button 
              className="menu-toggle-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div>
              {title && <h1 className="header-title">{title}</h1>}
              {subtitle && <p className="header-subtitle">{subtitle}</p>}
            </div>
          </div>

          <div className="header-right">
            <Link to="/profile" className="admin-user-pill">
              <div className="admin-avatar">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="avatar" className="admin-avatar-photo" />
                  : displayName.charAt(0).toUpperCase()
                }
              </div>
              <div className="admin-user-info">
                <span className="user-name">{displayName}</span>
                <span className="user-role">{roleDisplay}</span>
              </div>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="admin-content with-bottom-nav">
          {children}
        </main>

        {/* Mobile Bottom Navigation (Android Native View Experience) */}
        <nav className="mobile-bottom-nav">
          {currentMobileTabs.map((tab, i) => {
            const isActive = location.pathname === tab.path;
            return (
              <Link 
                key={i} 
                to={tab.path} 
                className={`bottom-nav-item ${isActive ? "active" : ""}`}
              >
                <span className="bottom-nav-icon">{tab.icon}</span>
                <span className="bottom-nav-label">{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
