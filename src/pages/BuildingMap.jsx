import { useState, useEffect } from "react";
import AppLayout from "../components/AppLayout";

const floorNames = ["Ground Floor", "First Floor", "Second Floor"];

const floorData = {
  0: { 
    label: "Ground Floor",
    rooms: [
      { id: "main_entrance", label: "Main Entrance", x: 270, y: 380, type: "entrance" },
      { id: "reception", label: "Reception", x: 270, y: 320, type: "office" },
      { id: "cafeteria", label: "Cafeteria", x: 420, y: 300, type: "landmark" },
      { id: "auditorium", label: "Auditorium", x: 120, y: 280, type: "seminar hall" },
      { id: "library", label: "Library", x: 120, y: 150, type: "landmark" },
      { id: "staircase_a", label: "Staircase A", x: 480, y: 200, type: "stairs" },
      { id: "elevator_a", label: "Elevator A", x: 440, y: 200, type: "elevator" },
      { id: "r_101", label: "Room 101", x: 80, y: 80, type: "classroom" },
      { id: "r_102", label: "Room 102", x: 180, y: 80, type: "classroom" },
      { id: "r_103", label: "Room 103", x: 360, y: 80, type: "classroom" },
      { id: "r_104", label: "Room 104", x: 460, y: 80, type: "classroom" },
    ]
  },
  1: { 
    label: "First Floor",
    rooms: [
      { id: "corridor_1", label: "Main Corridor", x: 270, y: 200, type: "corridor" },
      { id: "staff_room", label: "Staff Room", x: 120, y: 100, type: "staff room" },
      { id: "seminar_hall", label: "Seminar Hall", x: 420, y: 100, type: "seminar hall" },
      { id: "r_201", label: "Room 201", x: 80, y: 280, type: "classroom" },
      { id: "r_202", label: "Room 202", x: 180, y: 280, type: "classroom" },
      { id: "r_203", label: "Room 203", x: 280, y: 280, type: "classroom" },
      { id: "r_204", label: "Room 204", x: 380, y: 280, type: "classroom" },
      { id: "r_205", label: "Room 205", x: 460, y: 280, type: "classroom" },
      { id: "staircase_a", label: "Staircase A", x: 480, y: 200, type: "stairs" },
      { id: "elevator_a", label: "Elevator A", x: 440, y: 200, type: "elevator" },
    ]
  },
  2: { 
    label: "Second Floor",
    rooms: [
      { id: "corridor_2", label: "Main Corridor", x: 270, y: 200, type: "corridor" },
      { id: "lab_1", label: "Computer Lab 1", x: 120, y: 100, type: "lab" },
      { id: "lab_2", label: "Computer Lab 2", x: 420, y: 100, type: "lab" },
      { id: "lab_3", label: "Science Lab", x: 270, y: 100, type: "lab" },
      { id: "r_301", label: "Room 301", x: 80, y: 280, type: "classroom" },
      { id: "r_302", label: "Room 302", x: 180, y: 280, type: "classroom" },
      { id: "r_303", label: "Room 303", x: 380, y: 280, type: "classroom" },
      { id: "r_304", label: "Room 304", x: 460, y: 280, type: "classroom" },
      { id: "staircase_a", label: "Staircase A", x: 480, y: 200, type: "stairs" },
      { id: "elevator_a", label: "Elevator A", x: 440, y: 200, type: "elevator" },
    ]
  }
};

const typeColors = {
  classroom: "#e0e7ff",
  lab: "#fce7f3",
  office: "#fef3c7",
  "seminar hall": "#dcfce7",
  "staff room": "#f1f5f9",
  stairs: "#dcfce7",
  elevator: "#f1f5f9",
  entrance: "#fef3c7",
  corridor: "#f8fafc",
  landmark: "#fae8ff",
};

const typeIcons = {
  classroom: "🏫",
  lab: "🔬",
  office: "🏢",
  "seminar hall": "🎤",
  "staff room": "👔",
  stairs: "📶",
  elevator: "🛗",
  entrance: "🚪",
  corridor: "🚶",
  landmark: "📍",
};

export default function BuildingMap() {
  const [activeFloor, setActiveFloor] = useState(0);

  const currentFloor = floorData[activeFloor];

  return (
    <AppLayout title="Map & Navigation" subtitle="Complete campus building view — 3 floors">
      <div className="building-map-page">
        {/* Floor Selector */}
        <div className="floor-selector">
          {Object.keys(floorData).map((floorIdx) => (
            <button
              key={floorIdx}
              className={`floor-btn ${activeFloor === parseInt(floorIdx) ? "active" : ""}`}
              onClick={() => setActiveFloor(parseInt(floorIdx))}
            >
              {floorNames[floorIdx]}
            </button>
          ))}
        </div>

        {/* Building Map Canvas */}
        <div className="map-canvas-container">
          <svg
            viewBox="0 0 540 440"
            className="map-canvas"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Building Outline */}
            <rect x="20" y="20" width="500" height="400" rx="6" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2.5" />
            
            {/* Open Courtyard */}
            <rect x="180" y="180" width="160" height="100" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
            <text x="260" y="235" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="600">Open Courtyard</text>

            {/* Corridor lines */}
            <line x1="60" y1="200" x2="480" y2="200" stroke="#cbd5e1" strokeWidth="3" strokeDasharray="8 4" />
            <line x1="270" y1="60" x2="270" y2="360" stroke="#cbd5e1" strokeWidth="3" strokeDasharray="8 4" />

            {/* Rooms */}
            {currentFloor.rooms.map((room) => (
              <g key={room.id} className="map-node">
                <rect
                  x={room.x - 55}
                  y={room.y - 35}
                  width="110"
                  height="70"
                  rx="4"
                  fill={typeColors[room.type] || "#f8fafc"}
                  stroke="#6366f1"
                  strokeWidth="1.5"
                />
                <text
                  x={room.x}
                  y={room.y - 8}
                  textAnchor="middle"
                  fill="#6366f1"
                  fontSize="16"
                >
                  {typeIcons[room.type] || "📍"}
                </text>
                <text
                  x={room.x}
                  y={room.y + 14}
                  textAnchor="middle"
                  fill="#1e293b"
                  fontSize="10"
                  fontWeight="500"
                >
                  {room.label}
                </text>
              </g>
            ))}

            {/* Staircase/Elevator indicators between floors */}
            {activeFloor < 2 && (
              <g transform="translate(460, 200)">
                <circle cx="0" cy="0" r="18" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" />
                <text x="0" y="5" textAnchor="middle" fontSize="10" fill="#166534" fontWeight="700">↑</text>
                <text x="0" y="30" textAnchor="middle" fontSize="9" fill="#166534">To Floor {activeFloor + 2}</text>
              </g>
            )}
            {activeFloor > 0 && (
              <g transform="translate(460, 200)">
                <circle cx="0" cy="0" r="18" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
                <text x="0" y="5" textAnchor="middle" fontSize="10" fill="#92400e" fontWeight="700">↓</text>
                <text x="0" y="30" textAnchor="middle" fontSize="9" fill="#92400e">To Floor {activeFloor}</text>
              </g>
            )}
          </svg>
        </div>

        {/* Legend */}
        <div className="map-legend">
          <div className="legend-section">
            <div className="legend-item">
              <span className="legend-color" style={{ background: typeColors.classroom }} />
              <span>Classrooms</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: typeColors.lab }} />
              <span>Labs</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: typeColors.office }} />
              <span>Offices</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: typeColors["seminar hall"] }} />
              <span>Seminar Halls</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: typeColors["staff room"] }} />
              <span>Staff Rooms</span>
            </div>
            <div className="legend-divider" />
            <div className="legend-item">
              <span className="legend-color" style={{ background: typeColors.entrance }} />
              <span>Entrances</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: typeColors.stairs }} />
              <span>Stairs</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: typeColors.elevator }} />
              <span>Elevators</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: typeColors.landmark }} />
              <span>Landmarks</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}