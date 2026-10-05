import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { getCampusMapGraph } from "../services/navigationGraph";
import { unitsToMeters } from "../config/buildingSpec";

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

export default function FindClassroom() {
  const [graph, setGraph] = useState(null);
  const [graphError, setGraphError] = useState("");
  const [step, setStep] = useState(1); // Card 1 or Card 2

  // Card 1 inputs
  const [fromNode, setFromNode] = useState("");
  const [toNode, setToNode] = useState("");
  const [accessibleOnly, setAccessibleOnly] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [qrScanned, setQrScanned] = useState(false);
  const [currentLocation, setCurrentLocation] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Card 2 route result
  const [routePath, setRoutePath] = useState([]);
  const [distanceInfo, setDistanceInfo] = useState(null);
  const [directions, setDirections] = useState([]);

  const sourceOptions = graph
    ? Array.from(graph.nodes.values()).filter(n => n.isRoom || ["entrance", "stairs", "elevator", "landmark"].includes(n.type))
    : [];

  const destinationOptions = graph
    ? Array.from(graph.nodes.values()).filter(n => n.isRoom || ["entrance", "stairs", "elevator", "landmark"].includes(n.type))
    : [];

  useEffect(() => {
    let cancelled = false;
    getCampusMapGraph()
      .then((g) => { if (!cancelled) setGraph(g); })
      .catch((err) => { if (!cancelled) setGraphError("Could not load the campus map."); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    return () => { stopQRScanner(); };
  }, []);

  function calculateRoute(start, end) {
    if (!graph) return;

    const path = accessibleOnly
      ? graph.findAccessiblePath(start, end)
      : graph.findShortestPath(start, end);

    setRoutePath(path);

    if (path.length > 1) {
      let totalMeters = 0;
      const steps = [];
      const floorChanges = [];

      for (let i = 0; i < path.length - 1; i++) {
        const dx = path[i + 1].x - path[i].x;
        const dy = path[i + 1].y - path[i].y;
        const seg = Math.round(unitsToMeters(Math.hypot(dx, dy)));
        totalMeters += seg;

        const edge = graph.getEdge(path[i].id, path[i + 1].id);

        if (edge && (edge.accessibility === "lift" || edge.accessibility === "ramp")) {
          steps.push({
            action: `Use ${edge.accessibility === "lift" ? "Elevator" : "Ramp"}`,
            from: path[i].label,
            to: path[i + 1].label,
            distance: seg,
          });
          floorChanges.push({
            from: path[i].label,
            to: path[i + 1].label,
            connection: edge.accessibility === "lift" ? "elevator" : "ramp",
            fromFloor: path[i].floor,
            toFloor: path[i + 1].floor,
            accessible: edge.accessibility === "lift",
          });
        } else if (i === 0) {
          steps.push({ action: "Start", from: path[i].label, to: path[i + 1].label, distance: seg });
        } else if (i === path.length - 2) {
          steps.push({ action: "Arrive at destination", from: path[i].label, to: path[i + 1].label, distance: seg });
        } else {
          const currNode = path[i];
          const nextNode = path[i + 1];
          const prevNode = path[i - 1];
          const angle = Math.atan2(nextNode.y - currNode.y, nextNode.x - currNode.x) * 180 / Math.PI;
          const prevAngle = Math.atan2(currNode.y - prevNode.y, currNode.x - prevNode.x) * 180 / Math.PI;
          const angleDiff = ((angle - prevAngle + 540) % 360) - 180;

          let turnDirection = "Continue straight";
          if (Math.abs(angleDiff) > 150) turnDirection = "Turn around";
          else if (angleDiff > 30 && angleDiff < 150) turnDirection = "Turn right";
          else if (angleDiff > -150 && angleDiff < -30) turnDirection = "Turn left";

          const isFloorChange = path[i].floor !== path[i + 1].floor;
          steps.push({
            action: turnDirection,
            from: path[i].label,
            to: path[i + 1].label,
            distance: seg,
            floorChange: isFloorChange,
            fromFloor: path[i].floor,
            toFloor: path[i + 1].floor,
          });

          if (isFloorChange && edge && (edge.accessibility === "stairs" || edge.accessibility === "lift")) {
            floorChanges.push({
              from: path[i].label,
              to: path[i + 1].label,
              connection: edge.accessibility === "lift" ? "elevator" : "stairs",
              fromFloor: path[i].floor,
              toFloor: path[i + 1].floor,
              accessible: edge.accessibility === "lift",
            });
          }
        }
      }

      setDirections(steps);
      setDistanceInfo({
        meters: Math.max(12, totalMeters),
        timeSec: Math.max(30, Math.round(totalMeters * 1.2)),
        floorChanges,
      });
      setStep(2);
    } else {
      setDistanceInfo(null);
      setDirections([]);
      alert("No route found between selected locations.");
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!fromNode || !toNode) return;
    if (fromNode === toNode) {
      alert("Source and destination cannot be the same.");
      return;
    }
    calculateRoute(fromNode, toNode);
  }

  function handleBackToSearch() {
    setStep(1);
    setRoutePath([]);
    setDistanceInfo(null);
    setDirections([]);
  }

  async function startQRScanner() {
    setCameraError("");
    setShowScanner(true);
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError("Camera permission denied. Use manual select or upload a QR image.");
      setScanning(false);
    }
  }

  function stopQRScanner() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowScanner(false);
    setScanning(false);
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const reader = new BrowserQRCodeReader();
      const result = await reader.decodeFromFile(file);
      handleQRResult(result.getText());
    } catch (err) {
      console.error("QR decode error:", err);
      alert("Could not read QR code. Try again.");
    }
  }

  function handleQRResult(text) {
    if (!graph) return;
    try {
      let locationId = text.trim();
      if (text.includes("http")) {
        const url = new URL(text);
        locationId = url.searchParams.get("from") || url.searchParams.get("dest") || url.searchParams.get("loc");
      }
      if (locationId && graph.nodes.has(locationId)) {
        const node = graph.nodes.get(locationId);
        setFromNode(locationId);
        setCurrentLocation(node.label);
        setQrScanned(true);
        stopQRScanner();
      } else {
        alert(`Unknown location: ${text}. Please use a valid campus QR code.`);
      }
    } catch (err) {
      alert("Invalid QR code format.");
    }
  }

  if (graphError) {
    return (
      <AppLayout title="Find Classroom" subtitle="Get turn-by-turn directions">
        <div className="center-screen">
          <div className="card" style={{ textAlign: "center", maxWidth: 420 }}>
            <h2>Map unavailable</h2>
            <p className="muted">{graphError}</p>
            <button className="btn" onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!graph) {
    return (
      <AppLayout title="Find Classroom" subtitle="Get turn-by-turn directions">
        <div className="center-screen">
          <div className="loading-state">
            <div className="spinner" />
            <p className="muted">Loading campus map…</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const startCoords = graph.nodes.get(fromNode);
  const endCoords = graph.nodes.get(toNode);
  const polylinePoints = routePath.map((p) => `${p.x},${p.y}`).join(" ");

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

  return (
    <AppLayout title="Find Classroom" subtitle="Get turn-by-turn directions">
      <div className="find-classroom-page">
        {step === 1 && (
          /* ========== CARD 1: Source & Destination + QR Scanner ========== */
          <div className="nav-input-section">
            <form onSubmit={handleSubmit}>
              <div className="nav-input-grid">
                {/* Source */}
                <div className="nav-input-group">
                  <label className="nav-input-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10h-4a4 4 0 0 0-8 0" />
                      <path d="M1 10h2" />
                      <path d="M9 10l1-4" />
                      <path d="M9 10l1 4" />
                    </svg>
                    <span>SOURCE</span>
                  </label>
                  {qrScanned ? (
                    <div className="nav-source-scanned">
                      <span className="nav-source-location">{currentLocation}</span>
                      <button type="button" className="nav-clear-qr" onClick={() => { setQrScanned(false); setCurrentLocation(""); setFromNode(""); }}>
                        Change
                      </button>
                    </div>
                  ) : (
                    <select
                      className="nav-select"
                      value={fromNode}
                      onChange={(e) => setFromNode(e.target.value)}
                      style={fromNode ? { background: "#eff6ff", borderColor: "#2563eb" } : {}}
                    >
                      <option value="">Enter your current location</option>
                      {sourceOptions.map((node) => (
                        <option key={node.id} value={node.id}>
                          {node.label} (Floor {node.floor})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Destination */}
                <div className="nav-input-group">
                  <label className="nav-input-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4l2 2" />
                    </svg>
                    <span>DESTINATION</span>
                  </label>
                  <select
                    className="nav-select"
                    value={toNode}
                    onChange={(e) => setToNode(e.target.value)}
                    style={toNode ? { background: "#dcfce7", borderColor: "#16a34a" } : {}}
                  >
                    <option value="">Enter classroom or destination</option>
                    {destinationOptions.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.label} (Floor {node.floor})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Accessibility Toggle */}
              <div className="nav-accessibility">
                <label className="toggle-label">
                  <input type="checkbox" checked={accessibleOnly} onChange={(e) => setAccessibleOnly(e.target.checked)} />
                  <span className="toggle-switch"></span>
                  <span className="toggle-text">Accessible route (no stairs, elevator only)</span>
                </label>
              </div>

              {/* Start Navigation Button */}
              <button type="submit" className="btn-start-nav" disabled={!fromNode || !toNode}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
                Start Navigation
              </button>
            </form>

            {/* QR Scanner Button */}
            <button type="button" className="btn btn-outline nav-qr-btn" onClick={startQRScanner} title="Scan QR code to set source location" style={{ marginTop: "12px", width: "100%" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="3" height="3" />
                <rect x="18" y="14" width="3" height="3" />
                <rect x="14" y="18" width="3" height="3" />
                <rect x="18" y="18" width="3" height="3" />
              </svg>
              <span>Scan QR Code</span>
            </button>
          </div>
        )}

        {step === 2 && (
          /* ========== CARD 2: Route Guide + Map + Distance ========== */
          <div className="nav-result-section">
            {/* Route Info Banner */}
            {distanceInfo && (
              <div className="route-info-banner-compact">
                <div className="route-metric">
                  <span className="metric-label">Distance</span>
                  <strong className="metric-value">~{distanceInfo.meters}m</strong>
                </div>
                <div className="route-metric">
                  <span className="metric-label">Walking time</span>
                  <strong className="metric-value">~{Math.round(distanceInfo.timeSec / 60)} min</strong>
                </div>
                <div className="route-metric">
                  <span className="metric-label">Floor changes</span>
                  <strong className="metric-value">{distanceInfo.floorChanges.length}</strong>
                </div>
              </div>
            )}

            {/* Route Map */}
            <div className="nav-map-container">
              <div className="map-wrapper">
                <svg viewBox="0 0 540 440" className="indoor-svg-blueprint" xmlns="http://www.w3.org/2000/svg">
                  <rect x="20" y="20" width="500" height="400" rx="6" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2.5" />
                  <rect x="180" y="180" width="160" height="100" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
                  <text x="260" y="235" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="600">Open Courtyard</text>

                  {Object.keys(typeColors).map((type) => (
                    <g key={type}>
                      {Array.from(graph.nodes.values())
                        .filter((n) => n.type === type)
                        .map((node) => {
                          const isSelected = node.id === fromNode || node.id === toNode;
                          const onRoute = routePath.some(p => p.id === node.id);
                          return (
                            <g key={node.id} className="map-node">
                              <rect
                                x={node.x - 55}
                                y={node.y - 35}
                                width="110"
                                height="70"
                                rx="4"
                                fill={typeColors[node.type] || "#f8fafc"}
                                stroke={onRoute ? "#2563eb" : isSelected ? "#2563eb" : "#6366f1"}
                                strokeWidth={onRoute ? "2.5" : "1.5"}
                              />
                              <text x={node.x} y={node.y + 5} textAnchor="middle" fill="#1e293b" fontSize="10" fontWeight={isSelected ? "700" : "500"}>
                                {node.label}
                              </text>
                            </g>
                          );
                        })}
                    </g>
                  ))}

                  {/* Route Path */}
                  {routePath.length > 1 && (
                    <polyline
                      points={polylinePoints}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="route-animated-path"
                    />
                  )}

                  {/* Start */}
                  {startCoords && (
                    <g transform={`translate(${startCoords.x}, ${startCoords.y})`}>
                      <circle cx="0" cy="0" r="8" fill="#22c55e" stroke="#fff" strokeWidth="2" />
                      <text x="0" y="-16" textAnchor="middle" fontSize="10" fill="#16a34a" fontWeight="600">START</text>
                    </g>
                  )}

                  {/* End */}
                  {endCoords && (
                    <g transform={`translate(${endCoords.x}, ${endCoords.y - 12})`}>
                      <path d="M0 -14 C-7 -14 -10 -9 -10 -3 C-10 4 0 14 0 14 C0 14 10 4 10 -3 C10 -9 7 -14 0 -14 Z" fill="#ef4444" stroke="#fff" strokeWidth="1.5" />
                      <text x="0" y="20" textAnchor="middle" fontSize="10" fill="#dc2626" fontWeight="600">END</text>
                    </g>
                  )}
                </svg>
              </div>
            </div>

            {/* Turn-by-Turn Directions */}
            <div className="directions-section">
              <h3 className="directions-title">Turn-by-Turn Directions</h3>
              <div className="directions-list">
                {directions.map((step, idx) => {
                  const isFloorChange = step.floorChange || (step.action && (step.action.includes("Elevator") || step.action.includes("Ramp")));
                  return (
                    <div key={idx} className={`direction-step ${isFloorChange ? "floor-change" : ""}`}>
                      <div className="step-number">{idx + 1}</div>
                      <div className="step-content">
                        <div className="step-action">
                          {step.action}
                          {isFloorChange && distanceInfo?.floorChanges && (
                            <span className="floor-change-badge">
                              {distanceInfo.floorChanges.find(fc => fc.from === step.from && fc.to === step.to)?.connection === "elevator" ? "🛗 Elevator" : "📶 Stairs"}
                              {step.fromFloor !== step.toFloor && ` (Floor ${step.fromFloor} → ${step.toFloor})`}
                            </span>
                          )}
                        </div>
                        <div className="step-route">
                          {step.from} → {step.to}
                          {step.distance && <span className="step-distance">({step.distance}m)</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Floor Change Guide */}
              {distanceInfo?.floorChanges.length > 0 && (
                <div className="floor-change-guide">
                  <h4>Multi-Floor Navigation Guide</h4>
                  <p>
                    {distanceInfo.floorChanges.map(fc => 
                      `${fc.connection === "elevator" ? "Take the elevator" : "Use the stairs"} from Floor ${fc.fromFloor} to Floor ${fc.toFloor} at ${fc.from}`
                    ).join(" · ")}
                  </p>
                </div>
              )}

              {/* Simple Guidance */}
              <div className="simple-guidance">
                <h4>In Simple Terms:</h4>
                <p>
                  From <strong>{startCoords?.label || "your location"}</strong> to <strong>{endCoords?.label || "your destination"}</strong>
                  {distanceInfo ? (
                    <> — walk <strong>{distanceInfo.meters} meters</strong> (<strong>{Math.round(distanceInfo.timeSec / 60)} minutes</strong>)</>
                  ) : null}
                </p>
                {distanceInfo?.floorChanges.length > 0 && (
                  <p>
                    You'll need to change floors. Use the {distanceInfo.floorChanges[0]?.connection === "elevator" ? "elevator" : "stairs"} at {distanceInfo.floorChanges[0]?.from} to get to Floor {distanceInfo.floorChanges[0]?.toFloor}.
                  </p>
                )}
              </div>

              {/* Back Button */}
              <button className="btn btn-outline" onClick={handleBackToSearch} style={{ marginTop: "16px", width: "100%" }}>
                ← Back to Search
              </button>
            </div>
          </div>
        )}

        {/* QR Scanner Modal */}
        {showScanner && (
          <div className="scanner-overlay" onClick={stopQRScanner}>
            <div className="scanner-modal" onClick={(e) => e.stopPropagation()}>
              <div className="scanner-header">
                <h3>Scan QR Code</h3>
                <button type="button" className="modal-close-btn" onClick={stopQRScanner}>✕</button>
              </div>
              <div className="scanner-body">
                {cameraError ? (
                  <div className="scanner-error">
                    <p>{cameraError}</p>
                    <label className="btn btn-primary">
                      Upload QR Image
                      <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} hidden />
                    </label>
                  </div>
                ) : (
                  <>
                    <video ref={videoRef} className="qr-video" playsInline muted />
                    <div className="scanner-frame"></div>
                    <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#64748b", marginTop: "8px" }}>Point camera at a location QR code</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}