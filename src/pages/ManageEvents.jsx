import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import { getEvents, createEvent, updateEvent, deleteEvent, getEventMeta, formatEventDate, formatEventTime } from "../services/eventService";

export default function ManageEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    event_type: "other",
    event_date: "",
    start_time: "",
    end_time: "",
    location: "",
    organizer: "",
    status: "upcoming",
    target_roles: ["student", "faculty", "admin"],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadEvents(); }, []);

  async function loadEvents() {
    setLoading(true);
    try { setEvents(await getEvents()); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        const data = await updateEvent(editingId, form);
        setEvents((prev) => prev.map((ev) => (ev.id === editingId ? data : ev)));
      } else {
        const data = await createEvent(form);
        setEvents((prev) => [data, ...prev]);
      }
      resetForm();
    } catch (err) {
      alert("Failed to save event: " + (err.message || JSON.stringify(err)));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this event?")) return;
    await deleteEvent(id);
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
  }

  function resetForm() {
    setForm({
      title: "",
      description: "",
      event_type: "other",
      event_date: "",
      start_time: "",
      end_time: "",
      location: "",
      organizer: "",
      status: "upcoming",
      target_roles: ["student", "faculty", "admin"],
    });
    setShowForm(false);
    setEditingId(null);
  }

  function startEdit(ev) {
    setForm({
      title: ev.title,
      description: ev.description || "",
      event_type: ev.event_type,
      event_date: ev.event_date,
      start_time: ev.start_time,
      end_time: ev.end_time,
      location: ev.location || "",
      organizer: ev.organizer || "",
      status: ev.status,
      target_roles: ev.target_roles || ["student", "faculty", "admin"],
    });
    setEditingId(ev.id);
    setShowForm(true);
  }

  return (
    <AdminLayout title="Manage Events" subtitle="Add, edit and remove campus events">
      <div className="manage-page">
        <div className="manage-header">
          <button className="btn" onClick={() => { resetForm(); setShowForm(!showForm); }}>
            {showForm ? "Cancel" : "+ New Event"}
          </button>
        </div>

        {showForm && (
          <form className="manage-form" onSubmit={handleSubmit}>
            <h3>{editingId ? "Edit Event" : "New Event"}</h3>
            <label>Event Title</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Annual Tech Fest" />

            <label>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Event description" />

            <div className="row">
              <div>
                <label>Event Type</label>
                <select value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })}>
                  <option value="college_fest">College Fest</option>
                  <option value="hackathon">Hackathon</option>
                  <option value="workshop">Workshop</option>
                  <option value="seminar">Seminar</option>
                  <option value="sports">Sports</option>
                  <option value="cultural">Cultural</option>
                  <option value="exam">Exam</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="upcoming">Upcoming</option>
                  <option value="today">Today</option>
                  <option value="past">Past</option>
                </select>
              </div>
            </div>

            <div className="row">
              <div>
                <label>Date</label>
                <input type="date" required value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
              </div>
              <div>
                <label>Start Time</label>
                <input type="time" required value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
              </div>
              <div>
                <label>End Time</label>
                <input type="time" required value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
              </div>
            </div>

            <div className="row">
              <div>
                <label>Location</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Auditorium" />
              </div>
              <div>
                <label>Organizer</label>
                <input value={form.organizer} onChange={(e) => setForm({ ...form, organizer: e.target.value })} placeholder="e.g. CSI Department" />
              </div>
            </div>

            <button type="submit" className="btn" disabled={saving}>{saving ? "Saving…" : editingId ? "Update Event" : "Create Event"}</button>
          </form>
        )}

        {loading ? (
          <div className="loading-state"><div className="spinner" /><p className="muted">Loading…</p></div>
        ) : (
          <div className="manage-table-wrapper">
            <table className="manage-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => {
                  const meta = getEventMeta(ev.event_type);
                  return (
                    <tr key={ev.id}>
                      <td><span className="event-type-badge">{meta.icon} {meta.label}</span></td>
                      <td>{ev.title}</td>
                      <td>{formatEventDate(ev.event_date)}</td>
                      <td>{formatEventTime(ev.start_time)} - {formatEventTime(ev.end_time)}</td>
                      <td>{ev.location || "-"}</td>
                      <td><span className="status-badge" data-status={ev.status}>{ev.status}</span></td>
                      <td>
                        <div className="table-actions">
                          <button className="btn-sm btn-outline" onClick={() => startEdit(ev)}>Edit</button>
                          <button className="btn-sm btn-danger" onClick={() => handleDelete(ev.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
