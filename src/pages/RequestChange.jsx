import { useState } from "react";
import AppLayout from "../components/AppLayout";
import { submitShiftRequest } from "../services/timetableService";

export default function RequestChange() {
  const [selectedClass] = useState({
    subject: "DBMS",
    currentRoom: "Room 204",
    time: "09:00 - 10:00",
  });

  const [newRoom, setNewRoom] = useState("Room 203");
  const [reason, setReason] = useState("");
  const [toast, setToast] = useState({ message: "", type: "" });
  const [isSubmitted, setIsSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    submitShiftRequest({
      subject: selectedClass.subject,
      oldRoom: selectedClass.currentRoom,
      newRoom: newRoom,
      time: selectedClass.time,
      reason: reason || "Classroom shift requested by faculty",
    });

    setIsSubmitted(true);
    setToast({
      message: `Shift request submitted! Room ${selectedClass.currentRoom} → ${newRoom} for ${selectedClass.subject}.`,
      type: "success",
    });
  }

  return (
    <AppLayout title="Request Classroom Change">
      {toast.message && (
        <div className={`toast-notification ${toast.type}`}>
          ✓ {toast.message}
        </div>
      )}

      <div className="request-change-container">
        {/* Current Class Details Card (Matching Screen 6) */}
        <div className="current-class-card">
          <div className="card-badge-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>Current Class Details</span>
          </div>

          <div className="details-grid">
            <div className="detail-row">
              <span className="detail-label">Subject</span>
              <span className="detail-value">: {selectedClass.subject}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Current Room</span>
              <span className="detail-value">: {selectedClass.currentRoom}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Time</span>
              <span className="detail-value">: {selectedClass.time}</span>
            </div>
          </div>
        </div>

        {/* Change Request Form (Matching Screen 6) */}
        <form onSubmit={handleSubmit} className="shift-form-card">
          <div className="form-group">
            <label className="field-title">Select New Room <span className="field-sub">(from available rooms)</span></label>
            <select 
              value={newRoom} 
              onChange={(e) => setNewRoom(e.target.value)}
              className="styled-room-select"
            >
              <option value="Room 203">Room 203 (Floor 2 - Vacant)</option>
              <option value="Room 201">Room 201 (Floor 2 - Vacant)</option>
              <option value="Room 205">Room 205 (Floor 2 - Vacant)</option>
              <option value="Room 206">Room 206 (Floor 2 - Vacant)</option>
              <option value="Room 102">Room 102 (Floor 1 - Vacant)</option>
              <option value="Lab 2">Lab 2 (Floor 2 - Vacant)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="field-title">Reason <span className="field-sub">(optional)</span></label>
            <textarea
              rows="4"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Room 204 is not available due to maintenance."
              className="styled-textarea"
            />
          </div>

          <button type="submit" className="submit-request-btn">
            {isSubmitted ? "Submit Another Request" : "Submit Request"}
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
