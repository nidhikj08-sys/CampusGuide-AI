import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import {
  getLocationGraph,
  addLocationNode,
  updateLocationNode,
  deleteLocationNode,
  addLocationEdge,
  deleteLocationEdge,
} from "../services/locationService";
import { generateQRForLocation } from "../utils/qrGenerator";

export default function ManageLocations() {
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [activeFloor, setActiveFloor] = useState(1);
  const [selectedNode, setSelectedNode] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);

  // Modal states
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
  const [isEdgeModalOpen, setIsEdgeModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState(null);
  const [formData, setFormData] = useState({
    id: "",
    label: "",
    floor: 1,
    x: 200,
    y: 200,
    isRoom: true,
    type: "classroom",
  });
  const [edgeForm, setEdgeForm] = useState({ from: "", to: "", weight: 5 });
  const [toast, setToast] = useState({ message: "", type: "" });

  useEffect(() => {
    loadGraph();
  }, []);

  async function loadGraph() {
    setLoading(true);
    const data = await getLocationGraph();
    setGraph(data);
    setLoading(false);
  }

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3500);
  }

  function openAddNodeModal() {
    setEditingNode(null);
    setFormData({
      id: "",
      label: "",
      floor: activeFloor,
      x: 200,
      y: 200,
      isRoom: true,
      type: "classroom",
    });
    setIsNodeModalOpen(true);
  }

  function openEditNodeModal(node) {
    setEditingNode(node);
    setFormData({
      id: node.id,
      label: node.label,
      floor: node.floor,
      x: node.x,
      y: node.y,
      isRoom: node.isRoom,
      type: node.type || "classroom",
    });
    setIsNodeModalOpen(true);
  }

  function closeNodeModal() {
    setIsNodeModalOpen(false);
    setEditingNode(null);
  }

  async function handleNodeSubmit(e) {
    e.preventDefault();
    if (!formData.label.trim()) {
      showToast("Please enter a label", "error");
      return;
    }

    try {
      if (editingNode) {
        await updateLocationNode(editingNode.id, formData);
        showToast("Location updated successfully!");
      } else {
        await addLocationNode(formData);
        showToast("Location added successfully!");
      }
      closeNodeModal();
      await loadGraph();
    } catch (err) {
      showToast(err.message || "Failed to save location", "error");
    }
  }

  async function handleDeleteNode(node) {
    const confirmed = window.confirm(
      `Delete "${node.label}" and all its connected edges?`
    );
    if (!confirmed) return;

    try {
      await deleteLocationNode(node.id);
      showToast("Location deleted.");
      await loadGraph();
    } catch (err) {
      showToast("Failed to delete location", "error");
    }
  }

  function openAddEdgeModal() {
    setEdgeForm({ from: "", to: "", weight: 5 });
    setIsEdgeModalOpen(true);
  }

  async function handleEdgeSubmit(e) {
    e.preventDefault();
    if (!edgeForm.from || !edgeForm.to) {
      showToast("Please select both locations", "error");
      return;
    }

    try {
      await addLocationEdge(edgeForm);
      showToast("Path added successfully!");
      setIsEdgeModalOpen(false);
      await loadGraph();
    } catch (err) {
      showToast(err.message || "Failed to add path", "error");
    }
  }

  async function handleDeleteEdge(edgeId) {
    try {
      await deleteLocationEdge(edgeId);
      showToast("Path removed.");
      await loadGraph();
    } catch (err) {
      showToast("Failed to remove path", "error");
    }
  }

  async function handleGenerateQR(nodeId) {
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const qr = await generateQRForLocation(nodeId, node.label);
    if (qr) {
      setQrPreview(qr);
    }
  }

  const floorNodes = graph.nodes.filter((n) => n.floor === activeFloor);
  const floorEdges = graph.edges.filter(
    (e) => {
      const fromNode = graph.nodes.find((n) => n.id === e.from);
      const toNode = graph.nodes.find((n) => n.id === e.to);
      return fromNode?.floor === activeFloor && toNode?.floor === activeFloor;
    }
  );

  const typeIcons = {
    classroom: "🏫",
    lab: "🔬",
    office: "🏢",
    "seminar hall": "🎤",
    "staff room": "👔",
    entrance: "🚪",
    stairs: "📶",
    elevator: "🛗",
    corridor: "🚶",
    default: "📍",
  };

  return (
    <AdminLayout
      title="Manage Locations"
      subtitle="Configure rooms, corridors, stairs, and navigation paths for indoor routing."
    >
      {toast.message && (
        <div className={`toast-notification ${toast.type}`}>
          {toast.type === "success" ? "✓ " : "✕ "}
          {toast.message}
        </div>
      )}

      {/* Floor Switcher + Actions */}
      <div className="section-toolbar">
        <div className="floor-filter-pills">
          {[1, 2, 3].map((floor) => (
            <button
              key={floor}
              className={`pill-btn ${activeFloor === floor ? "active" : ""}`}
              onClick={() => setActiveFloor(floor)}
            >
              Floor {floor}
            </button>
          ))}
        </div>

        <div className="action-buttons-row">
          <button className="btn-primary-add" onClick={openAddNodeModal}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Location
          </button>
          <button className="btn btn-outline" onClick={openAddEdgeModal}>
            + Add Path
          </button>
        </div>
      </div>

      {/* Locations List - Mobile Cards */}
      <div className="locations-list">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading locations...</p>
          </div>
        ) : floorNodes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📍</div>
            <h3>No locations on Floor {activeFloor}</h3>
            <p>Click "+ Add Location" to create your first node.</p>
          </div>
        ) : (
          floorNodes.map((node) => (
            <div
              key={node.id}
              className={`location-card ${selectedNode?.id === node.id ? "selected" : ""}`}
              onClick={() => setSelectedNode(node)}
            >
              <div className="location-card-header">
                <div className="location-icon">
                  {typeIcons[node.type] || typeIcons.default}
                </div>
                <div className="location-info">
                  <h4>{node.label}</h4>
                  <span className="location-meta">
                    {node.isRoom ? "Room" : "Waypoint"} · ({node.x}, {node.y})
                  </span>
                </div>
                <span className="floor-badge-sm">F{node.floor}</span>
              </div>

              <div className="location-card-actions">
                <button
                  className="icon-btn qr-btn"
                  title="Generate QR Code"
                  onClick={(e) => { e.stopPropagation(); handleGenerateQR(node.id); }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="3" height="3" />
                    <rect x="18" y="14" width="3" height="3" />
                    <rect x="14" y="18" width="3" height="3" />
                    <rect x="18" y="18" width="3" height="3" />
                  </svg>
                </button>
                <button
                  className="icon-btn edit-btn"
                  title="Edit"
                  onClick={(e) => { e.stopPropagation(); openEditNodeModal(node); }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </button>
                <button
                  className="icon-btn delete-btn"
                  title="Delete"
                  onClick={(e) => { e.stopPropagation(); handleDeleteNode(node); }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Connected Paths Section */}
      <div className="dashboard-section">
        <h2 className="section-title">Paths on Floor {activeFloor}</h2>
        {floorEdges.length === 0 ? (
          <p className="text-muted">No paths defined on this floor yet.</p>
        ) : (
          <div className="edges-list">
            {floorEdges.map((edge) => {
              const fromNode = graph.nodes.find((n) => n.id === edge.from);
              const toNode = graph.nodes.find((n) => n.id === edge.to);
              return (
                <div key={edge.id} className="edge-card">
                  <div className="edge-route">
                    <span className="edge-node-name">{fromNode?.label || edge.from}</span>
                    <span className="edge-arrow">→</span>
                    <span className="edge-node-name">{toNode?.label || edge.to}</span>
                  </div>
                  <div className="edge-meta">
                    <span className="edge-weight">{edge.weight}m</span>
                    <button
                      className="icon-btn delete-btn"
                      onClick={() => handleDeleteEdge(edge.id)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Node Modal */}
      {isNodeModalOpen && (
        <div className="modal-overlay" onClick={closeNodeModal}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingNode ? "Edit Location" : "Add New Location"}</h3>
              <button className="modal-close-btn" onClick={closeNodeModal}>✕</button>
            </div>

            <form onSubmit={handleNodeSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Label *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Room 301, Stairs, Library"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Node ID (unique, no spaces)</label>
                  <input
                    type="text"
                    placeholder="e.g. r_301, stairs_f2"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    disabled={!!editingNode}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Floor *</label>
                    <select
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: Number(e.target.value) })}
                    >
                      <option value={1}>Floor 1</option>
                      <option value={2}>Floor 2</option>
                      <option value={3}>Floor 3</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="classroom">Classroom</option>
                      <option value="lab">Lab</option>
                      <option value="office">Office</option>
                      <option value="seminar hall">Seminar Hall</option>
                      <option value="stairs">Stairs</option>
                      <option value="elevator">Elevator</option>
                      <option value="entrance">Entrance</option>
                      <option value="corridor">Corridor</option>
                      <option value="landmark">Landmark</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>X Coordinate</label>
                    <input
                      type="number"
                      value={formData.x}
                      onChange={(e) => setFormData({ ...formData, x: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Y Coordinate</label>
                    <input
                      type="number"
                      value={formData.y}
                      onChange={(e) => setFormData({ ...formData, y: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isRoom}
                      onChange={(e) => setFormData({ ...formData, isRoom: e.target.checked })}
                    />
                    Is Room / Navigable Point
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeNodeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingNode ? "Update Location" : "Add Location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Edge Modal */}
      {isEdgeModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEdgeModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Navigation Path</h3>
              <button className="modal-close-btn" onClick={() => setIsEdgeModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleEdgeSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>From Location *</label>
                  <select
                    required
                    value={edgeForm.from}
                    onChange={(e) => setEdgeForm({ ...edgeForm, from: e.target.value })}
                  >
                    <option value="">Select start point</option>
                    {graph.nodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.label} (F{node.floor})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>To Location *</label>
                  <select
                    required
                    value={edgeForm.to}
                    onChange={(e) => setEdgeForm({ ...edgeForm, to: e.target.value })}
                  >
                    <option value="">Select end point</option>
                    {graph.nodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.label} (F{node.floor})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Distance (meters)</label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={edgeForm.weight}
                    onChange={(e) => setEdgeForm({ ...edgeForm, weight: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsEdgeModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Path
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Preview Modal */}
      {qrPreview && (
        <div className="modal-overlay" onClick={() => setQrPreview(null)}>
          <div className="modal-dialog qr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>QR Code - {qrPreview.label}</h3>
              <button className="modal-close-btn" onClick={() => setQrPreview(null)}>✕</button>
            </div>
            <div className="modal-body qr-preview-body">
              <img src={qrPreview.dataUrl} alt={`QR for ${qrPreview.label}`} className="qr-preview-img" />
              <p className="qr-url-text">{qrPreview.url}</p>
              <a href={qrPreview.dataUrl} download={`qr-${qrPreview.locationId}.png`} className="btn btn-primary">
                Download QR Code
              </a>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
