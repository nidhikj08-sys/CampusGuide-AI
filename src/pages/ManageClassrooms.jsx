import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import { 
  getClassrooms, 
  addClassroom, 
  updateClassroom, 
  deleteClassroom 
} from "../services/classroomService";

export default function ManageClassrooms() {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [floorFilter, setFloorFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({
    room_number: "",
    floor: 1,
    type: "Classroom",
    capacity: 60,
    building: "Main Block",
  });

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "" });

  useEffect(() => {
    loadClassrooms();
  }, []);

  async function loadClassrooms() {
    setLoading(true);
    const data = await getClassrooms();
    setClassrooms(data);
    setLoading(false);
  }

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3500);
  }

  function openAddModal() {
    setEditingRoom(null);
    setFormData({
      room_number: "",
      floor: 1,
      type: "Classroom",
      capacity: 60,
      building: "Main Block",
    });
    setIsModalOpen(true);
  }

  function openEditModal(room) {
    setEditingRoom(room);
    setFormData({
      room_number: room.room_number,
      floor: room.floor,
      type: room.type,
      capacity: room.capacity || 60,
      building: room.building || "Main Block",
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingRoom(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.room_number.trim()) {
      showToast("Please enter a room number", "error");
      return;
    }

    setSaving(true);
    try {
      if (editingRoom) {
        await updateClassroom(editingRoom.id, formData);
        showToast(`Room ${formData.room_number} updated successfully!`);
      } else {
        await addClassroom(formData);
        showToast(`Room ${formData.room_number} added successfully!`);
      }
      closeModal();
      await loadClassrooms();
    } catch (err) {
      showToast(err.message || "Failed to save classroom", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(room) {
    const confirmed = window.confirm(
      `Are you sure you want to delete Room ${room.room_number} (${room.type}, Floor ${room.floor})?`
    );
    if (!confirmed) return;

    try {
      await deleteClassroom(room.id);
      showToast(`Room ${room.room_number} deleted successfully.`);
      await loadClassrooms();
    } catch (err) {
      showToast("Failed to delete classroom", "error");
    }
  }

  // Filtering
  const filteredRooms = classrooms.filter((room) => {
    const matchesSearch =
      room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFloor =
      floorFilter === "all" || String(room.floor) === String(floorFilter);

    const matchesType =
      typeFilter === "all" || room.type.toLowerCase() === typeFilter.toLowerCase();

    return matchesSearch && matchesFloor && matchesType;
  });

  return (
    <AdminLayout 
      title="Manage Classrooms" 
      subtitle="View, register, and update academic rooms, labs, and facilities."
    >
      {toast.message && (
        <div className={`toast-notification ${toast.type}`}>
          {toast.type === "success" ? "✓ " : "✕ "}
          {toast.message}
        </div>
      )}

      {/* Top Action Bar */}
      <div className="section-toolbar">
        <div className="search-filter-group">
          <div className="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by room or type (e.g. 204, Lab)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-btn" onClick={() => setSearchTerm("")}>✕</button>
            )}
          </div>

          <div className="floor-filter-pills">
            <button
              className={`pill-btn ${floorFilter === "all" ? "active" : ""}`}
              onClick={() => setFloorFilter("all")}
            >
              All Floors
            </button>
            <button
              className={`pill-btn ${floorFilter === "1" ? "active" : ""}`}
              onClick={() => setFloorFilter("1")}
            >
              Floor 1
            </button>
            <button
              className={`pill-btn ${floorFilter === "2" ? "active" : ""}`}
              onClick={() => setFloorFilter("2")}
            >
              Floor 2
            </button>
            <button
              className={`pill-btn ${floorFilter === "3" ? "active" : ""}`}
              onClick={() => setFloorFilter("3")}
            >
              Floor 3
            </button>
          </div>

          <select 
            className="type-select-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="Classroom">Classrooms</option>
            <option value="Lab">Labs</option>
            <option value="Office">Offices</option>
            <option value="Seminar Hall">Seminar Halls</option>
          </select>
        </div>

        <button className="btn-primary-add" onClick={openAddModal}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Classroom
        </button>
      </div>

      {/* Classroom Table Card */}
      <div className="table-card">
        <div className="table-header-meta">
          <span className="total-badge">
            {filteredRooms.length} {filteredRooms.length === 1 ? "room" : "rooms"} listed
          </span>
          {floorFilter !== "all" && <span className="active-tag">Floor {floorFilter}</span>}
          {typeFilter !== "all" && <span className="active-tag">{typeFilter}</span>}
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading campus classrooms...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏫</div>
            <h3>No classrooms found</h3>
            <p>Try clearing your filters or click "+ Add Classroom" to register a new room.</p>
            <button className="btn btn-sm" onClick={() => { setSearchTerm(""); setFloorFilter("all"); setTypeFilter("all"); }}>
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>ID</th>
                  <th>Room Number</th>
                  <th>Floor</th>
                  <th>Type</th>
                  <th>Capacity</th>
                  <th>Building</th>
                  <th style={{ width: "120px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map((room, index) => (
                  <tr key={room.id || index}>
                    <td className="cell-id">{room.id}</td>
                    <td className="cell-room">
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
                    <td className="cell-capacity">
                      <strong>{room.capacity || 60}</strong> seats
                    </td>
                    <td className="cell-muted">{room.building || "Main Block"}</td>
                    <td style={{ textAlign: "right" }}>
                      <div className="action-buttons">
                        <button 
                          className="icon-action-btn edit-btn"
                          title="Edit Classroom"
                          onClick={() => openEditModal(room)}
                        >
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </svg>
                        </button>
                        <button 
                          className="icon-action-btn delete-btn"
                          title="Delete Classroom"
                          onClick={() => handleDelete(room)}
                        >
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Classroom Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingRoom ? "Edit Classroom" : "Add New Classroom"}</h3>
              <button className="modal-close-btn" onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Room Number / Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 204, Lab 2, Seminar Hall A"
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                  />
                  <span className="field-hint">Used by students in indoor navigation search</span>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Floor *</label>
                    <select
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: Number(e.target.value) })}
                    >
                      <option value={1}>Floor 1 (Ground)</option>
                      <option value={2}>Floor 2</option>
                      <option value={3}>Floor 3</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Room Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="Classroom">Classroom</option>
                      <option value="Lab">Lab</option>
                      <option value="Office">Office / HOD</option>
                      <option value="Seminar Hall">Seminar Hall</option>
                      <option value="Staff Room">Staff Room</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Seating Capacity</label>
                    <input
                      type="number"
                      min="5"
                      max="300"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Building / Block</label>
                    <input
                      type="text"
                      value={formData.building}
                      onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                      placeholder="e.g. Main Block"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : editingRoom ? "Update Room" : "Add Classroom"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
