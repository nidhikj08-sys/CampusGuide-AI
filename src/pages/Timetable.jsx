import { useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { STUDENT_SCHEDULE } from "../services/timetableService";

export default function Timetable() {
  const [currentDateIndex, setCurrentDateIndex] = useState(0);

  const dates = [
    "Monday, 28 April 2025",
    "Tuesday, 29 April 2025",
    "Wednesday, 30 April 2025",
    "Thursday, 1 May 2025",
    "Friday, 2 May 2025",
  ];

  function handlePrev() {
    setCurrentDateIndex((prev) => (prev > 0 ? prev - 1 : dates.length - 1));
  }

  function handleNext() {
    setCurrentDateIndex((prev) => (prev < dates.length - 1 ? prev + 1 : 0));
  }

  return (
    <AppLayout title="My Timetable">
      <div className="timetable-container">
        {/* Date Selector Switcher (Matching Screen 3) */}
        <div className="date-switcher-card">
          <button className="date-nav-btn" onClick={handlePrev} aria-label="Previous Day">
            ‹
          </button>
          <span className="current-date-label">{dates[currentDateIndex]}</span>
          <button className="date-nav-btn" onClick={handleNext} aria-label="Next Day">
            ›
          </button>
        </div>

        {/* Timetable Table (Matching Screen 3) */}
        <div className="table-card">
          <div className="table-responsive">
            <table className="custom-data-table timetable-table">
              <thead>
                <tr>
                  <th style={{ width: "180px" }}>Time</th>
                  <th>Subject</th>
                  <th style={{ width: "140px" }}>Room</th>
                  <th style={{ width: "120px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {STUDENT_SCHEDULE.map((item) => (
                  <tr key={item.id}>
                    <td className="cell-time">{item.time}</td>
                    <td className="cell-subject">
                      <strong>{item.subject}</strong>
                      <span className="subject-meta">{item.code} • {item.faculty}</span>
                    </td>
                    <td className="cell-room">
                      <span className="room-badge-plain">Room {item.room}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Link 
                        to={`/student/map?dest=r_${item.room}`}
                        className="btn-navigate-sm"
                      >
                        🧭 Navigate
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
