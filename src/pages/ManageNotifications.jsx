import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import { getNotifications, postNotification, markAsRead, markAllAsRead, NOTIF_ICON } from "../services/notificationService";
import { supabase } from "../supabase";

export default function ManageNotifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: "", message: "", type: "info", role: null, user_id: null });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadNotifications(); }, []);

  async function loadNotifications() {
    setLoading(true);
    try { setItems(await getNotifications()); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        message: form.message,
        type: form.type,
        role: form.role,
        userId: form.user_id || null,
      };
      if (editingId) {
        const updated = items.find((n) => n.id === editingId);
        const { data } = await postNotification({ ...updated, ...payload });
        setItems((prev) => prev.map((n) => (n.id === editingId ? data : n)));
      } else {
        const data = await postNotification(payload);
        setItems((prev) => [data, ...prev]);
      }
      resetForm();
    } catch (err) {
      alert("Failed to save notification: " + (err.message || JSON.stringify(err)));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this notification?")) return;
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) { alert(error.message); return; }
    setItems((prev) => prev.filter((n) => n.id !== id));
  }

  function resetForm() {
    setForm({ title: "", message: "", type: "info", role: null, user_id: null });
    setShowForm(false);
    setEditingId(null);
  }

  function startEdit(notif) {
    setForm({ title: notif.title, message: notif.message, type: notif.type, role: notif.role, user_id: notif.user_id });
    setEditingId(notif.id);
    setShowForm(true);
  }

  return (
    <AdminLayout title="Manage Notifications" subtitle="Create, edit and send notifications">
      <div className="manage-page">
        <div className="manage-header">
          <button className="btn" onClick={() => { resetForm(); setShowForm(!showForm); }}>
            {showForm ? "Cancel" : "+ New Notification"}
          </button>
        </div>

        {showForm && (
          <form className="manage-form" onSubmit={handleSubmit}>
            <h3>{editingId ? "Edit Notification" : "New Notification"}</h3>
            <label>Title</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Notification title" />

            <label>Message</label>
            <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Notification message" rows={3} />

            <div className="row">
              <div>
                <label>Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                  <option value="room_change">Room Change</option>
                </select>
              </div>
              <div>
                <label>Target Role</label>
                <select value={form.role ?? ""} onChange={(e) => setForm({ ...form, role: e.target.value || null })}>
                  <option value="">All Roles</option>
                  <option value="student">Students</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <label>Target User ID (optional - leave blank for broadcast)</label>
            <input value={form.user_id || ""} onChange={(e) => setForm({ ...form, user_id: e.target.value || null })} placeholder="Specific user UUID" />

            <button type="submit" className="btn" disabled={saving}>{saving ? "Saving…" : editingId ? "Update" : "Send Notification"}</button>
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
                  <th>Message</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((notif) => (
                  <tr key={notif.id}>
                    <td><span className="notif-type-badge">{NOTIF_ICON[notif.type] || "ℹ️"} {notif.type}</span></td>
                    <td>{notif.title}</td>
                    <td className="cell-truncate">{notif.message}</td>
                    <td><span className="role-badge">{notif.role || "all"}</span></td>
                    <td>{notif.is_read ? "Read" : "Unread"}</td>
                    <td>{new Date(notif.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-sm btn-outline" onClick={() => startEdit(notif)}>Edit</button>
                        <button className="btn-sm btn-danger" onClick={() => handleDelete(notif.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

