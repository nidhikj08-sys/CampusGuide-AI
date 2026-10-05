import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { getEvents, getEventMeta, formatEventDate, formatEventTime } from "../services/eventService";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("upcoming"); // upcoming | today | past

  useEffect(() => {
    loadEvents();
  }, [tab]);

  async function loadEvents() {
    setLoading(true);
    try {
      const data = await getEvents({ upcoming: tab !== "past", past: tab === "past" });
      setEvents(data);
    } catch (err) {
      console.error("Failed to load events:", err);
    } finally {
      setLoading(false);
    }
  }

  const upcomingEvents = events.filter((e) => e.status === "upcoming");
  const todayEvents = events.filter((e) => e.status === "today");
  const pastEvents = events.filter((e) => e.status === "past");

  const displayEvents = tab === "today" ? todayEvents : tab === "past" ? pastEvents : [...todayEvents, ...upcomingEvents];

  return (
    <AppLayout title="Events" subtitle="College events, workshops & announcements">
      <div className="events-page">
        <div className="events-tabs">
          <button className={`events-tab ${tab === "upcoming" ? "active" : ""}`} onClick={() => setTab("upcoming")}>
            Upcoming
            {upcomingEvents.length > 0 && <span className="tab-count">{upcomingEvents.length}</span>}
          </button>
          <button className={`events-tab ${tab === "today" ? "active" : ""}`} onClick={() => setTab("today")}>
            Today
            {todayEvents.length > 0 && <span className="tab-count">{todayEvents.length}</span>}
          </button>
          <button className={`events-tab ${tab === "past" ? "active" : ""}`} onClick={() => setTab("past")}>
            Past
            {pastEvents.length > 0 && <span className="tab-count">{pastEvents.length}</span>}
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p className="muted">Loading events…</p>
          </div>
        ) : displayEvents.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🎉</span>
            <h3>No events found</h3>
            <p className="muted">Check back later for upcoming events.</p>
          </div>
        ) : (
          <div className="events-list">
            {displayEvents.map((ev) => {
              const meta = getEventMeta(ev.event_type);
              return (
                <div key={ev.id} className="event-card" style={{ borderLeftColor: meta.color }}>
                  <div className="event-header">
                    <div className="event-title-row">
                      <span className="event-icon">{meta.icon}</span>
                      <h3 className="event-title">{ev.title}</h3>
                    </div>
                    <span className="event-status-badge" data-status={ev.status}>
                      {ev.status}
                    </span>
                  </div>

                  <p className="event-description">{ev.description}</p>

                  <div className="event-details-grid">
                    <div className="event-detail">
                      <span className="detail-label">📅 Date</span>
                      <span className="detail-value">{formatEventDate(ev.event_date)}</span>
                    </div>
                    <div className="event-detail">
                      <span className="detail-label">⏰ Time</span>
                      <span className="detail-value">{formatEventTime(ev.start_time)} - {formatEventTime(ev.end_time)}</span>
                    </div>
                    {ev.location && (
                      <div className="event-detail">
                        <span className="detail-label">📍 Location</span>
                        <span className="detail-value">{ev.location}</span>
                      </div>
                    )}
                    {ev.organizer && (
                      <div className="event-detail">
                        <span className="detail-label">👤 Organizer</span>
                        <span className="detail-value">{ev.organizer}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
