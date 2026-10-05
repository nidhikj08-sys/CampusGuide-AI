import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { getNotifications, markAsRead, markAllAsRead, NOTIF_ICON } from "../services/notificationService";

const TYPE_COLORS = {
  info:        "#eff6ff",
  warning:     "#fffbeb",
  success:     "#f0fdf4",
  error:       "#fef2f2",
  room_change: "#fdf4ff",
};

const TYPE_BADGE_COLORS = {
  info:        "#2563eb",
  warning:     "#f59e0b",
  success:     "#16a34a",
  error:       "#dc2626",
  room_change: "#9333ea",
};

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | unread

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    setLoading(true);
    try {
      const data = await getNotifications();
      setItems(data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(id) {
    await markAsRead(id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  async function handleMarkAllAsRead() {
    await markAllAsRead();
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  const unreadCount = items.filter((n) => !n.is_read).length;
  const filtered = filter === "unread" ? items.filter((n) => !n.is_read) : items;

  return (
    <AppLayout title="Notifications" subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`}>
      <div className="notifications-page">
        <div className="notifications-toolbar">
          <div className="filter-segmented">
            <button className={`seg ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>All</button>
            <button className={`seg ${filter === "unread" ? "active" : ""}`} onClick={() => setFilter("unread")}>Unread</button>
          </div>
          {unreadCount > 0 && (
            <button className="btn btn-sm btn-outline" onClick={handleMarkAllAsRead}>Mark all as read</button>
          )}
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p className="muted">Loading notifications…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🔔</span>
            <h3>No notifications</h3>
            <p className="muted">You're all caught up!</p>
          </div>
        ) : (
          <div className="notifications-list">
            {filtered.map((notif) => (
              <div
                key={notif.id}
                className={`notification-card ${notif.is_read ? "read" : "unread"}`}
                style={{ borderLeftColor: TYPE_BADGE_COLORS[notif.type] || "#6366f1" }}
                onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
              >
                <div className="notification-icon">{NOTIF_ICON[notif.type] || "ℹ️"}</div>
                <div className="notification-body">
                  <div className="notification-header">
                    <h4 className="notification-title">{notif.title}</h4>
                    {!notif.is_read && <span className="unread-dot" />}
                  </div>
                  <p className="notification-message">{notif.message}</p>
                  <span className="notification-time">{new Date(notif.created_at).toLocaleString()}</span>
                </div>
                <div className="notification-badge" style={{ background: TYPE_BADGE_COLORS[notif.type] || "#6366f1" }}>
                  {notif.type.replace("_", " ")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
