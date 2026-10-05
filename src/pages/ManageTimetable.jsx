import { useCallback, useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  SEMESTERS,
  SECTIONS,
  TIMETABLE_DAYS,
  YEARS,
  addTimetableEntry,
  deleteTimetableEntry,
  getTimetableFacets,
  getTimetableRows,
  toHHMM,
  updateTimetableEntry,
} from "../services/timetableService";

const EMPTY_FORM = {
  year: 3,
  branch: "",
  section: "A",
  semester: 5,
  day: "Monday",
  period_number: 1,
  start_time: "09:00",
  end_time: "10:00",
  subject: "",
  subject_code: "",
  faculty: "",
  room: "",
};

export default function ManageTimetable() {
  const [rows, setRows] = useState([]);
  const [facets, setFacets] = useState({
    branches: [],
    sections: [],
    maxPeriod: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    year: "",
    branch: "",
    section: "",
    semester: "",
    day: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, facetData] = await Promise.all([
        getTimetableRows(filters),
        getTimetableFacets(),
      ]);
      setRows(data);
      setFacets(facetData);
    } catch (err) {
      console.error("Timetable load error:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3500);
  }

  function openAddModal() {
    setEditingRow(null);
    setFormData(EMPTY_FORM);
    setIsModalOpen(true);
  }

  function openEditModal(row) {
    setEditingRow(row);
    setFormData({
      year: Number(row.year),
      branch: row.branch,
      section: row.section,
      semester: Number(row.semester),
      day: row.day,
      period_number: Number(row.period_number),
      start_time: toHHMM(row.start_time),
      end_time: toHHMM(row.end_time),
      subject: row.subject,
      subject_code: row.subject_code || "",
      faculty: row.faculty,
      room: row.room,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingRow(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.branch.trim()) {
      showToast("Branch is required", "error");
      return;
    }
    if (!formData.subject.trim() || !formData.faculty.trim() || !formData.room.trim()) {
      showToast("Subject, faculty and room are required", "error");
      return;
    }
    if (formData.end_time <= formData.start_time) {
      showToast("End time must be after start time", "error");
      return;
    }

    setSaving(true);
    try {
      if (editingRow) {
        await updateTimetableEntry(editingRow.id, formData);
        showToast(
          `${formData.day} Period ${formData.period_number} updated successfully!`,
        );
      } else {
        await addTimetableEntry(formData);
        showToast(
          `${formData.day} Period ${formData.period_number} added successfully!`,
        );
      }
      closeModal();
      await load();
    } catch (err) {
      showToast(err.message || "Failed to save timetable entry", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row) {
    const confirmed = window.confirm(
      `Delete ${row.subject} on ${row.day} Period ${row.period_number} (${row.branch} Y${row.year} Sec ${row.section})?`,
    );
    if (!confirmed) return;

    try {
      await deleteTimetableEntry(row.id);
      showToast("Timetable entry deleted successfully.");
      await load();
    } catch (err) {
      showToast("Failed to delete timetable entry", "error");
    }
  }

  // Never invent branch values: show what is already used, and let the
  // admin type a new code in the form when adding.
  const branchOptions = facets.branches.length > 0
    ? facets.branches
    : ["CSE", "ECE", "MECH", "CIVIL", "ISE"];
  const sectionOptions =
    facets.sections.length > 0
      ? [...new Set([...facets.sections, ...SECTIONS])]
      : SECTIONS;

  return (
    <AdminLayout
      title="Manage Timetable"
      subtitle="Create & publish class schedules"
    >
      {toast.message && (
        <div className={`toast-notification ${toast.type}`}>
          {toast.type === "success" ? "✓ " : "✕ "}
          {toast.message}
        </div>
      )}

      <div className="section-toolbar">
        <div className="search-filter-group">
          <select
            className="type-select-filter"
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
          >
            <option value="">All Years</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>Year {y}</option>
            ))}
          </select>

          <select
            className="type-select-filter"
            value={filters.branch}
            onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
          >
            <option value="">All Branches</option>
            {branchOptions.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <select
            className="type-select-filter"
            value={filters.section}
            onChange={(e) => setFilters({ ...filters, section: e.target.value })}
          >
            <option value="">All Sections</option>
            {sectionOptions.map((s) => (
              <option key={s} value={s}>Section {s}</option>
            ))}
          </select>

          <select
            className="type-select-filter"
            value={filters.semester}
            onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
          >
            <option value="">All Semesters</option>
            {SEMESTERS.map((s) => (
              <option key={s} value={s}>Sem {s}</option>
            ))}
          </select>

          <select
            className="type-select-filter"
            value={filters.day}
            onChange={(e) => setFilters({ ...filters, day: e.target.value })}
          >
            <option value="">All Days</option>
            {TIMETABLE_DAYS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {Object.values(filters).some(Boolean) && (
            <button
              className="clear-filters-btn"
              onClick={() =>
                setFilters({ year: "", branch: "", section: "", semester: "", day: "" })
              }
            >
              Clear filters
            </button>
          )}
        </div>

        <button className="btn-primary-add" onClick={openAddModal}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Period
        </button>
      </div>

      <div className="table-card">
        <div className="table-header-meta">
          <span className="total-badge">
            {rows.length} {rows.length === 1 ? "entry" : "entries"} listed
          </span>
          {filters.year && <span className="active-tag">Year {filters.year}</span>}
          {filters.branch && <span className="active-tag">{filters.branch}</span>}
          {filters.section && <span className="active-tag">Sec {filters.section}</span>}
          {filters.semester && <span className="active-tag">Sem {filters.semester}</span>}
          {filters.day && <span className="active-tag">{filters.day}</span>}
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading timetable...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>No timetable entries found</h3>
            <p>
              {Object.values(filters).some(Boolean)
                ? "Try clearing your filters."
                : 'Click "+ Add Period" to publish the first class slot.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive desktop-only">
            <table className="custom-data-table timetable-table">
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>ID</th>
                  <th style={{ width: "70px" }}>Period</th>
                  <th style={{ width: "110px" }}>Day</th>
                  <th style={{ width: "150px" }}>Time</th>
                  <th>Subject</th>
                  <th style={{ width: "150px" }}>Faculty</th>
                  <th style={{ width: "110px" }}>Room</th>
                  <th style={{ width: "180px" }}>Class</th>
                  <th style={{ width: "110px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="cell-id">{row.id}</td>
                    <td>
                      <span className="period-badge">{row.period_number}</span>
                    </td>
                    <td>{row.day}</td>
                    <td className="cell-time">
                      {toHHMM(row.start_time)} &ndash; {toHHMM(row.end_time)}
                    </td>
                    <td>
                      <span className="cell-subject">
                        <strong>{row.subject}</strong>
                        {row.subject_code && (
                          <span className="subject-meta">{row.subject_code}</span>
                        )}
                      </span>
                    </td>
                    <td className="cell-muted">{row.faculty}</td>
                    <td>
                      <span className="room-badge-plain">{row.room}</span>
                    </td>
                    <td>
                      <span className="class-tag">
                        Y{row.year} • {row.branch} • Sec {row.section} • Sem {row.semester}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="action-buttons">
                        <button
                          className="icon-action-btn edit-btn"
                          title="Edit Period"
                          onClick={() => openEditModal(row)}
                        >
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </svg>
                        </button>
                        <button
                          className="icon-action-btn delete-btn"
                          title="Delete Period"
                          onClick={() => handleDelete(row)}
                        >
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 2 0 1 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
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

        {!loading && rows.length > 0 && (
          <div className="classroom-cards mobile-only" style={{ padding: "14px 16px" }}>
            {rows.map((row) => (
              <div key={row.id} className="classroom-card">
                <div className="classroom-card-header">
                  <span className="period-badge">P{row.period_number}</span>
                  <span className="active-tag">{row.day}</span>
                </div>
                <div className="classroom-card-body">
                  <div className="classroom-card-row">
                    <strong>{row.subject}</strong>
                    <span className="room-badge-plain">{row.room}</span>
                  </div>
                  <div className="classroom-card-row">
                    <span className="cell-muted">
                      {toHHMM(row.start_time)} &ndash; {toHHMM(row.end_time)} • {row.faculty}
                    </span>
                  </div>
                  <div className="classroom-card-row">
                    <span className="class-tag">
                      Y{row.year} • {row.branch} • Sec {row.section} • Sem {row.semester}
                    </span>
                  </div>
                </div>
                <div className="classroom-card-actions">
                  <button
                    className="icon-action-btn edit-btn"
                    title="Edit Period"
                    onClick={() => openEditModal(row)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </button>
                  <button
                    className="icon-action-btn delete-btn"
                    title="Delete Period"
                    onClick={() => handleDelete(row)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 1 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-dialog timetable-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingRow ? "Edit Period" : "Add New Period"}</h3>
              <button className="modal-close-btn" onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Class *</label>
                  <div className="form-row form-row-3">
                    <select
                      value={formData.year}
                      onChange={(e) =>
                        setFormData({ ...formData, year: Number(e.target.value) })
                      }
                    >
                      {YEARS.map((y) => (
                        <option key={y} value={y}>Year {y}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      required
                      placeholder="Branch (e.g. CSE)"
                      value={formData.branch}
                      onChange={(e) =>
                        setFormData({ ...formData, branch: e.target.value.toUpperCase() })
                      }
                      list="branch-options"
                    />
                    <datalist id="branch-options">
                      {branchOptions.map((b) => (
                        <option key={b} value={b} />
                      ))}
                    </datalist>
                  </div>
                  <span className="field-hint">
                    Students see this timetable automatically based on their profile
                  </span>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Section *</label>
                    <select
                      value={formData.section}
                      onChange={(e) =>
                        setFormData({ ...formData, section: e.target.value })
                      }
                    >
                      {sectionOptions.map((s) => (
                        <option key={s} value={s}>Section {s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Semester *</label>
                    <select
                      value={formData.semester}
                      onChange={(e) =>
                        setFormData({ ...formData, semester: Number(e.target.value) })
                      }
                    >
                      {SEMESTERS.map((s) => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Day *</label>
                    <select
                      value={formData.day}
                      onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                    >
                      {TIMETABLE_DAYS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Period Number *</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      required
                      value={formData.period_number}
                      onChange={(e) =>
                        setFormData({ ...formData, period_number: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Start Time *</label>
                    <input
                      type="time"
                      required
                      value={formData.start_time}
                      onChange={(e) =>
                        setFormData({ ...formData, start_time: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>End Time *</label>
                    <input
                      type="time"
                      required
                      value={formData.end_time}
                      onChange={(e) =>
                        setFormData({ ...formData, end_time: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Subject *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Database Management Systems"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Subject Code</label>
                    <input
                      type="text"
                      placeholder="e.g. CS501"
                      value={formData.subject_code}
                      onChange={(e) =>
                        setFormData({ ...formData, subject_code: e.target.value.toUpperCase() })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Faculty *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Prof. Kishor Kumar"
                      value={formData.faculty}
                      onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Classroom / Room *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Room 204"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  />
                  <span className="field-hint">
                    Match the room number registered under Manage Classrooms so students
                    can navigate to it
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving
                    ? "Saving..."
                    : editingRow
                      ? "Update Period"
                      : "Add Period"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}