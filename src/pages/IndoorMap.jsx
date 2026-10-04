import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { getCampusMapGraph } from "../services/navigationGraph";
import { recordScan } from "../services/scanLogService";
import { unitsToMeters } from "../config/buildingSpec";

export default function IndoorMap() {
  const [searchParams] = useSearchParams();

  const [graph, setGraph] = useState(null);
  const [graphError, setGraphError] = useState("");

  const [fromNode, setFromNode] = useState("f1_entrance");
  const [toNode, setToNode] = useState("r_101");
  const [activeFloor, setActiveFloor] = useState(1);
  const [routePath, setRoutePath] = useState([]);
  const [distanceInfo, setDistanceInfo] = useState(null);
  const [directions, setDirections] = useState([]);
  const [accessibleOnly, setAccessibleOnly] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // The graph now reads admin-editable data, which is loaded asynchronously.
  useEffect(() => {
    let cancelled = false;
    getCampusMapGraph()
      .then((g) => {
        if (!cancelled) setGraph(g);
      })
      .catch((err) => {
        console.error("Could not load campus graph:", err);
        if (!cancelled) setGraphError("Could not load the campus map.");
      });
    return () => {
      cancelled = true;
    };
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
      for (let i = 0; i < path.length - 1; i++) {
        const dx = path[i + 1].x - path[i].x;
        const dy = path[i + 1].y - path[i].y;
        const seg = Math.round(unitsToMeters(Math.hypot(dx, dy)));
        totalMeters += seg;

        const edge = graph.getEdge(path[i].id, path[i + 1].id);
        if (edge && (edge.accessibility === "lift" || edge.accessibility === "ramp")) {
          steps.push({ action: `Use ${edge.accessibility === "lift" ? "elevator" : "ramp"}`, from: path[i].label, to: path[i + 1].label });
        } else if (i === 0) {
          steps.push({ action: "Start", from: path[i].label, to: path[i + 1].label });
        } else if (i === path.length - 2) {
          steps.push({ action: "Arrive", from: path[i].label, to: path[i + 1].label });
        } else {
          steps.push({ action: "Walk", from: path[i].label, to: path[i + 1].label, distance: seg });
        }
      }
      setDirections(steps);
      setDistanceInfo({
        meters: Math.max(12, totalMeters),
        timeSec: Math.max(30, Math.round(totalMeters * 1.2)),
      });
    } else {
      setDistanceInfo(null);
      setDirections([]);
    }
  }

  // Initial route once the graph and any ?dest=/?from= params are both ready.
  useEffect(() => {
    if (!graph) return;

    const dest = searchParams.get("dest");
    const fromParam = searchParams.get("from");
    const start = fromParam && graph.nodes.has(fromParam) ? fromParam : "f1_entrance";
    const end = dest && graph.nodes.has(dest) ? dest : "r_101";

    setToNode(end);
    calculateRoute(start, end);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, searchParams]);

  function handleShowRoute() {
    calculateRoute(fromNode, toNode);
  }

  function handleFromChange(e) {
    const newFrom = e.target.value;
    setFromNode(newFrom);
    calculateRoute(newFrom, toNode);
  }

  function handleToChange(e) {
    const newTo = e.target.value;
    setToNode(newTo);
    calculateRoute(fromNode, newTo);
  }

  async function startQRScanner() {
    setCameraError("");
    setShowScanner(true);
    setScanning(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
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
      const text = result.getText();
      handleQRResult(text);
    } catch (err) {
      console.error("QR decode error:", err);
      alert("Could not read QR code. Try again.");
    }
  }

  function handleQRResult(text) {
    if (!graph) return;

    try {
      const url = new URL(text);
      const from = url.searchParams.get("from");
      const dest = url.searchParams.get("dest");
      
      if (from && graph.nodes.has(from)) {
        setFromNode(from);
        if (dest && graph.nodes.has(dest)) {
          setToNode(dest);
          calculateRoute(from, dest);
        } else {
          calculateRoute(from, toNode);
        }
        stopQRScanner();
      } else {
        alert("Invalid QR code for this campus.");
      }
    } catch (err) {
      alert("Invalid QR code format.");
    }
  }

  useEffect(() => {
    return () => stopQRScanner();
  }, []);

  if (graphError) {
    return (
      <AppLayout>
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
      <AppLayout>
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
    <AppLayout>
      <div className="indoor-nav-page mobile-nav">
        {/* Top Bar */}
        <div className="map-top-bar">
          <Link to="/student" className="back-link">← Back</Link>
          <h1 className="nav-page-title">Find Your Classroom</h1>
        </div>

        {/* Route Controls */}
        <div className="route-controls-card">
          <div className="select-col">
            <label>From</label>
            <select value={fromNode} onChange={handleFromChange}>
              {Array.from(graph.nodes.values())
                .filter((n) => n.isRoom || n.type === "entrance")
                .map((n) => (
                  <option key={n.id} value={n.id}>{n.label}</option>
                ))}
            </select>
          </div>

          <div className="select-col">
            <label>To</label>
            <select value={toNode} onChange={handleToChange}>
              {Array.from(graph.nodes.values())
                .filter((n) => n.isRoom)
                .map((n) => (
                  <option key={n.id} value={n.id}>{n.label}</option>
                ))}
            </select>
          </div>

          <button className="btn-show-route" onClick={handleShowRoute}>
            Go
          </button>

          <button className="btn-qr-scan" onClick={startQRScanner} title="Scan QR code">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="3" height="3" />
              <rect x="18" y="14" width="3" height="3" />
              <rect x="14" y="18" width="3" height="3" />
              <rect x="18" y="18" width="3" height="3" />
            </svg>
          </button>
        </div>

        {/* Accessibility Toggle */}
        <div className="accessibility-toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={accessibleOnly}
              onChange={(e) => {
                setAccessibleOnly(e.target.checked);
                handleShowRoute();
              }}
            />
            <span className="toggle-switch"></span>
            <span className="toggle-text">Accessible route (no stairs)</span>
          </label>
        </div>

        {/* Distance Banner */}
        {distanceInfo && (
          <div className="route-info-banner">
            <div className="route-metric">
              <span className="metric-label">Distance</span>
              <strong className="metric-value">~{distanceInfo.meters}m</strong>
            </div>
            <div className="route-metric">
              <span className="metric-label">Walking time</span>
              <strong className="metric-value">~{Math.round(distanceInfo.timeSec / 60)} min</strong>
            </div>
            <div className="route-metric">
              <span className="metric-label">Algorithm</span>
              <span className="algo-badge">Dijkstra</span>
            </div>
          </div>
        )}

        {/* Turn-by-Turn Directions */}
        {directions.length > 0 && (
          <div className="directions-card">
            <h3 className="directions-title">Directions</h3>
            <div className="directions-list">
              {directions.map((step, idx) => (
                <div key={idx} className="direction-step">
                  <div className="step-number">{idx + 1}</div>
                  <div className="step-content">
                    <strong>{step.action}</strong>
                    <span className="step-route">
                      {step.from} → {step.to}
                      {step.distance ? ` (${step.distance}m)` : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Floor Map */}
        <div className="map-floor-section">
          <div className="floor-indicator">
            <span className="floor-label">Floor {activeFloor}</span>
            <div className="floor-dots">
              {[1, 2, 3].map((f) => (
                <button
                  key={f}
                  className={`floor-dot ${activeFloor === f ? "active" : ""}`}
                  onClick={() => setActiveFloor(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="map-canvas-wrapper">
            <svg
              viewBox="0 0 540 440"
              className="indoor-svg-blueprint"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="20" y="20" width="500" height="400" rx="6" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2.5" />
              <rect x="180" y="180" width="160" height="100" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
              <text x="260" y="235" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="600">Open Courtyard</text>

              {Array.from(graph.nodes.values())
                .filter((n) => n.floor === activeFloor)
                .map((node) => {
                  const isSelected = node.id === fromNode || node.id === toNode;
                  const fill = typeColors[node.type] || "#f8fafc";
                  return (
                    <g
                      key={node.id}
                      className={`map-node ${isSelected ? "selected" : ""}`}
                      onClick={() => {
                        if (node.isRoom || node.type === "entrance") {
                          setToNode(node.id);
                          calculateRoute(fromNode, node.id);
                        }
                      }}
                    >
                      {node.isRoom || node.type === "entrance" ? (
                        <rect
                          x={node.x - 55}
                          y={node.y - 35}
                          width="110"
                          height="70"
                          rx="4"
                          fill={fill}
                          stroke={isSelected ? "#2563eb" : "#6366f1"}
                          strokeWidth={isSelected ? "2.5" : "1.5"}
                        />
                      ) : (
                        <circle cx={node.x} cy={node.y} r="6" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
                      )}
                      <text
                        x={node.x}
                        y={node.y + (node.isRoom ? 5 : 15)}
                        textAnchor="middle"
                        fill="#1e293b"
                        fontSize="11"
                        fontWeight={isSelected ? "700" : "500"}
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}

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

              {startCoords && (
                <g transform={`translate(${startCoords.x}, ${startCoords.y})`}>
                  <circle cx="0" cy="0" r="12" fill="#3b82f6" fillOpacity="0.2" className="pulse-pin" />
                  <circle cx="0" cy="0" r="7" fill="#2563eb" stroke="#fff" strokeWidth="2.5" />
                </g>
              )}

              {endCoords && (
                <g transform={`translate(${endCoords.x}, ${endCoords.y - 12})`}>
                  <path
                    d="M0 -14 C-7 -14 -10 -9 -10 -3 C-10 4 0 14 0 14 C0 14 10 4 10 -3 C10 -9 7 -14 0 -14 Z"
                    fill="#ef4444"
                    stroke="#fff"
                    strokeWidth="1.5"
                  />
                  <circle cx="0" cy="-4" r="3" fill="#fff" />
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* QR Scanner Modal */}
        {showScanner && (
          <div className="scanner-overlay" onClick={stopQRScanner}>
            <div className="scanner-modal" onClick={(e) => e.stopPropagation()}>
              <div className="scanner-header">
                <h3>Scan QR Code</h3>
                <button className="modal-close-btn" onClick={stopQRScanner}>✕</button>
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
