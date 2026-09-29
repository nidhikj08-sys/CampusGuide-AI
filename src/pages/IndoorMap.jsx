import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { getCampusMapGraph } from "../services/navigationGraph";

export default function IndoorMap() {
  const [searchParams] = useSearchParams();
  const graph = getCampusMapGraph();

  const [fromNode, setFromNode] = useState("main_entrance");
  const [toNode, setToNode] = useState("r_205");
  const [activeFloor, setActiveFloor] = useState(2);
  const [routePath, setRoutePath] = useState([]);
  const [distanceInfo, setDistanceInfo] = useState(null);

  // Read URL query parameter ?dest=r_204 to auto-target room from timetable
  useEffect(() => {
    const dest = searchParams.get("dest");
    if (dest && graph.nodes.has(dest)) {
      setToNode(dest);
      calculateRoute("main_entrance", dest);
    } else {
      calculateRoute("main_entrance", "r_205");
    }
  }, [searchParams]);

  function calculateRoute(start, end) {
    const path = graph.findShortestPath(start, end);
    setRoutePath(path);

    if (path.length > 1) {
      // Calculate approximate distance
      let totalMeters = 0;
      for (let i = 0; i < path.length - 1; i++) {
        const dx = path[i + 1].x - path[i].x;
        const dy = path[i + 1].y - path[i].y;
        totalMeters += Math.round(Math.hypot(dx, dy) * 0.25);
      }
      setDistanceInfo({
        meters: Math.max(12, totalMeters),
        timeSec: Math.max(30, Math.round(totalMeters * 1.2)),
      });
    } else {
      setDistanceInfo(null);
    }
  }

  function handleShowRoute() {
    calculateRoute(fromNode, toNode);
  }

  // Quick QR Scan Simulator (simulates scanning a physical QR code at Entrance or Room)
  function handleScanQR() {
    setFromNode("r_stairs");
    calculateRoute("r_stairs", toNode);
  }

  const startCoords = graph.nodes.get(fromNode);
  const endCoords = graph.nodes.get(toNode);

  // SVG points for polyline
  const polylinePoints = routePath.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <AppLayout>
      <div className="indoor-nav-page">
        {/* Top Breadcrumb & Title */}
        <div className="map-top-bar">
          <Link to="/student" className="back-link">
            ← Back to Dashboard
          </Link>
          <h1 className="nav-page-title">Find Your Classroom</h1>
        </div>

        {/* Route Selector Controls Bar (Matching Screen 4) */}
        <div className="route-controls-card">
          <div className="select-col">
            <label>From</label>
            <select value={fromNode} onChange={(e) => setFromNode(e.target.value)}>
              <option value="main_entrance">Main Entrance</option>
              <option value="r_stairs">Stairs</option>
              <option value="r_201">Room 201</option>
              <option value="r_202">Room 202</option>
              <option value="r_203">Room 203</option>
              <option value="r_204">Room 204</option>
              <option value="r_205">Room 205</option>
              <option value="r_206">Room 206</option>
              <option value="r_207">Room 207</option>
            </select>
          </div>

          <div className="select-col">
            <label>To</label>
            <select value={toNode} onChange={(e) => setToNode(e.target.value)}>
              <option value="r_205">Room 205</option>
              <option value="r_201">Room 201</option>
              <option value="r_202">Room 202</option>
              <option value="r_203">Room 203</option>
              <option value="r_204">Room 204</option>
              <option value="r_206">Room 206</option>
              <option value="r_207">Room 207</option>
              <option value="r_stairs">Stairs</option>
            </select>
          </div>

          <button className="btn-show-route" onClick={handleShowRoute}>
            Show Route
          </button>

          <button className="btn-qr-scan" onClick={handleScanQR} title="Simulate scanning a QR location badge">
            📷 Scan QR
          </button>
        </div>

        {/* Distance guidance banner if route found */}
        {distanceInfo && (
          <div className="route-info-banner">
            <div className="route-metric">
              <span className="metric-label">Estimated Walking Distance:</span>
              <strong className="metric-value">~{distanceInfo.meters} meters</strong>
            </div>
            <div className="route-metric">
              <span className="metric-label">Time to Reach:</span>
              <strong className="metric-value">~{Math.round(distanceInfo.timeSec / 60) || 1} min</strong>
            </div>
            <div className="route-metric">
              <span className="metric-label">Shortest Path Algorithm:</span>
              <span className="algo-badge">Dijkstra's Algorithm (Active)</span>
            </div>
          </div>
        )}

        {/* Main Map & Sidebar Container */}
        <div className="map-view-split">
          {/* Left Column: Floor Switcher & Legend (Matching Screen 4) */}
          <div className="map-left-sidebar">
            <div className="floor-selector-box">
              <button 
                className={`floor-nav-btn ${activeFloor === 1 ? "active" : ""}`}
                onClick={() => setActiveFloor(1)}
              >
                Floor 1
              </button>
              <button 
                className={`floor-nav-btn ${activeFloor === 2 ? "active" : ""}`}
                onClick={() => setActiveFloor(2)}
              >
                Floor 2
              </button>
              <button 
                className={`floor-nav-btn ${activeFloor === 3 ? "active" : ""}`}
                onClick={() => setActiveFloor(3)}
              >
                Floor 3
              </button>
            </div>

            <div className="legend-card">
              <h4>Legend</h4>
              <ul className="legend-list">
                <li>
                  <span className="legend-icon circle-blue"></span>
                  <span>Your Location</span>
                </li>
                <li>
                  <span className="legend-icon pin-red">📍</span>
                  <span>Destination</span>
                </li>
                <li>
                  <span className="legend-icon line-blue"></span>
                  <span>Path</span>
                </li>
                <li>
                  <span className="legend-icon box-room"></span>
                  <span>Room</span>
                </li>
                <li>
                  <span className="legend-icon stairs-green">📶</span>
                  <span>Stairs</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: 2D Blueprint Floor Map (Matching Screen 4) */}
          <div className="map-canvas-wrapper">
            <svg 
              viewBox="0 0 540 440" 
              className="indoor-svg-blueprint"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer Building Footprint */}
              <rect x="20" y="20" width="500" height="400" rx="6" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2.5" />

              {/* Central Courtyard / Void */}
              <rect x="180" y="180" width="160" height="100" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
              <text x="260" y="235" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="600">Open Courtyard</text>

              {/* TOP ROOMS (Room 201, 202, 203) */}
              <g className="map-room" onClick={() => { setToNode("r_201"); calculateRoute(fromNode, "r_201"); }}>
                <rect x="40" y="35" width="110" height="90" rx="3" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1.5" />
                <text x="95" y="85" textAnchor="middle" fill="#1e1b4b" fontSize="12" fontWeight="700">Room 201</text>
              </g>

              <g className="map-room" onClick={() => { setToNode("r_202"); calculateRoute(fromNode, "r_202"); }}>
                <rect x="160" y="35" width="110" height="90" rx="3" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1.5" />
                <text x="215" y="85" textAnchor="middle" fill="#1e1b4b" fontSize="12" fontWeight="700">Room 202</text>
              </g>

              <g className="map-room" onClick={() => { setToNode("r_203"); calculateRoute(fromNode, "r_203"); }}>
                <rect x="280" y="35" width="110" height="90" rx="3" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1.5" />
                <text x="335" y="85" textAnchor="middle" fill="#1e1b4b" fontSize="12" fontWeight="700">Room 203</text>
              </g>

              {/* WEST SIDE: STAIRS (Green block) */}
              <g className="map-stairs" onClick={() => { setToNode("r_stairs"); calculateRoute(fromNode, "r_stairs"); }}>
                <rect x="40" y="160" width="100" height="110" rx="4" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
                <text x="90" y="210" textAnchor="middle" fill="#14532d" fontSize="12" fontWeight="700">📶 Stairs</text>
                <text x="90" y="228" textAnchor="middle" fill="#166534" fontSize="9">To Fl 1 / 3</text>
              </g>

              {/* EAST SIDE: Room 204 */}
              <g className="map-room" onClick={() => { setToNode("r_204"); calculateRoute(fromNode, "r_204"); }}>
                <rect x="400" y="160" width="105" height="140" rx="3" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1.5" />
                <text x="452" y="235" textAnchor="middle" fill="#1e1b4b" fontSize="12" fontWeight="700">Room 204</text>
              </g>

              {/* BOTTOM ROOMS (Room 205, 206, 207) */}
              <g className="map-room" onClick={() => { setToNode("r_205"); calculateRoute(fromNode, "r_205"); }}>
                <rect x="85" y="315" width="105" height="90" rx="3" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1.5" />
                <text x="137" y="365" textAnchor="middle" fill="#1e1b4b" fontSize="12" fontWeight="700">Room 205</text>
              </g>

              <g className="map-room" onClick={() => { setToNode("r_206"); calculateRoute(fromNode, "r_206"); }}>
                <rect x="200" y="315" width="105" height="90" rx="3" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1.5" />
                <text x="252" y="365" textAnchor="middle" fill="#1e1b4b" fontSize="12" fontWeight="700">Room 206</text>
              </g>

              <g className="map-room" onClick={() => { setToNode("r_207"); calculateRoute(fromNode, "r_207"); }}>
                <rect x="315" y="315" width="105" height="90" rx="3" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1.5" />
                <text x="367" y="365" textAnchor="middle" fill="#1e1b4b" fontSize="12" fontWeight="700">Room 207</text>
              </g>

              {/* Main Entrance Marker */}
              <g className="entrance-label">
                <rect x="25" y="340" width="50" height="40" rx="3" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
                <text x="50" y="362" textAnchor="middle" fill="#92400e" fontSize="9" fontWeight="700">Entrance</text>
              </g>

              {/* Dijkstra Shortest Path Dynamic Polyline */}
              {routePath.length > 1 && (
                <polyline
                  points={polylinePoints}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="5"
                  strokeDasharray="8 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="route-animated-path"
                />
              )}

              {/* Start Node Pin (Your Location) */}
              {startCoords && (
                <g transform={`translate(${startCoords.x}, ${startCoords.y})`}>
                  <circle cx="0" cy="0" r="10" fill="#3b82f6" fillOpacity="0.3" className="pulse-pin" />
                  <circle cx="0" cy="0" r="6" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                </g>
              )}

              {/* Destination Red Pin */}
              {endCoords && (
                <g transform={`translate(${endCoords.x}, ${endCoords.y - 10})`}>
                  <path 
                    d="M0 -14 C-7 -14 -10 -9 -10 -3 C-10 4 0 14 0 14 C0 14 10 4 10 -3 C10 -9 7 -14 0 -14 Z" 
                    fill="#ef4444" 
                    stroke="#ffffff" 
                    strokeWidth="1.5" 
                  />
                  <circle cx="0" cy="-4" r="3" fill="#ffffff" />
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
