import { supabase } from "../supabase";

const LOCAL_KEY = "campusguide_locations_data";

const DEFAULT_NODES = [
  { id: "f1_entrance", label: "Main Entrance", floor: 1, x: 60, y: 400, isRoom: true, type: "entrance" },
  { id: "f1_stairs", label: "Stairs F1", floor: 1, x: 100, y: 240, isRoom: true, type: "stairs" },
  { id: "f1_elevator", label: "Elevator F1", floor: 1, x: 460, y: 240, isRoom: true, type: "elevator" },
  { id: "r_101", label: "Room 101", floor: 1, x: 100, y: 100, isRoom: true, type: "classroom" },
  { id: "r_102", label: "Room 102", floor: 1, x: 220, y: 100, isRoom: true, type: "classroom" },
  { id: "r_103", label: "Room 103", floor: 1, x: 340, y: 100, isRoom: true, type: "classroom" },
  { id: "r_104", label: "Room 104", floor: 1, x: 460, y: 100, isRoom: true, type: "classroom" },
  { id: "r_105", label: "Room 105", floor: 1, x: 100, y: 360, isRoom: true, type: "classroom" },
  { id: "r_106", label: "Room 106", floor: 1, x: 220, y: 360, isRoom: true, type: "classroom" },
  { id: "r_107", label: "Room 107", floor: 1, x: 340, y: 360, isRoom: true, type: "classroom" },
  { id: "f1_c_top", label: "Corridor Top", floor: 1, x: 280, y: 170, isRoom: false, type: "corridor" },
  { id: "f1_c_mid", label: "Corridor Mid", floor: 1, x: 280, y: 240, isRoom: false, type: "corridor" },
  { id: "f1_c_bot", label: "Corridor Bot", floor: 1, x: 280, y: 320, isRoom: false, type: "corridor" },
  { id: "f1_c_left", label: "Corridor Left", floor: 1, x: 100, y: 280, isRoom: false, type: "corridor" },
  { id: "f1_c_right", label: "Corridor Right", floor: 1, x: 460, y: 170, isRoom: false, type: "corridor" },
  { id: "f2_stairs", label: "Stairs F2", floor: 2, x: 100, y: 240, isRoom: true, type: "stairs" },
  { id: "f2_elevator", label: "Elevator F2", floor: 2, x: 460, y: 240, isRoom: true, type: "elevator" },
  { id: "r_201", label: "Room 201", floor: 2, x: 100, y: 100, isRoom: true, type: "classroom" },
  { id: "r_202", label: "Room 202", floor: 2, x: 220, y: 100, isRoom: true, type: "classroom" },
  { id: "r_203", label: "Room 203", floor: 2, x: 340, y: 100, isRoom: true, type: "classroom" },
  { id: "r_204", label: "Room 204", floor: 2, x: 460, y: 100, isRoom: true, type: "classroom" },
  { id: "r_205", label: "Room 205", floor: 2, x: 100, y: 360, isRoom: true, type: "classroom" },
  { id: "r_206", label: "Room 206", floor: 2, x: 220, y: 360, isRoom: true, type: "classroom" },
  { id: "r_207", label: "Room 207", floor: 2, x: 340, y: 360, isRoom: true, type: "classroom" },
  { id: "r_208", label: "Room 208", floor: 2, x: 460, y: 360, isRoom: true, type: "classroom" },
  { id: "f2_c_top", label: "Corridor Top", floor: 2, x: 280, y: 170, isRoom: false, type: "corridor" },
  { id: "f2_c_mid", label: "Corridor Mid", floor: 2, x: 280, y: 240, isRoom: false, type: "corridor" },
  { id: "f2_c_bot", label: "Corridor Bot", floor: 2, x: 280, y: 320, isRoom: false, type: "corridor" },
  { id: "f2_c_left", label: "Corridor Left", floor: 2, x: 100, y: 280, isRoom: false, type: "corridor" },
  { id: "f2_c_right", label: "Corridor Right", floor: 2, x: 460, y: 170, isRoom: false, type: "corridor" },
  { id: "f3_stairs", label: "Stairs F3", floor: 3, x: 100, y: 240, isRoom: true, type: "stairs" },
  { id: "f3_elevator", label: "Elevator F3", floor: 3, x: 460, y: 240, isRoom: true, type: "elevator" },
  { id: "r_301", label: "Room 301", floor: 3, x: 100, y: 100, isRoom: true, type: "classroom" },
  { id: "r_302", label: "Room 302", floor: 3, x: 220, y: 100, isRoom: true, type: "classroom" },
  { id: "r_303", label: "Room 303", floor: 3, x: 340, y: 100, isRoom: true, type: "classroom" },
  { id: "r_304", label: "Room 304", floor: 3, x: 460, y: 100, isRoom: true, type: "classroom" },
  { id: "r_305", label: "Room 305", floor: 3, x: 100, y: 360, isRoom: true, type: "classroom" },
  { id: "r_306", label: "Room 306", floor: 3, x: 220, y: 360, isRoom: true, type: "classroom" },
  { id: "r_307", label: "Room 307", floor: 3, x: 340, y: 360, isRoom: true, type: "classroom" },
  { id: "r_308", label: "Room 308", floor: 3, x: 460, y: 360, isRoom: true, type: "classroom" },
  { id: "f3_c_top", label: "Corridor Top", floor: 3, x: 280, y: 170, isRoom: false, type: "corridor" },
  { id: "f3_c_mid", label: "Corridor Mid", floor: 3, x: 280, y: 240, isRoom: false, type: "corridor" },
  { id: "f3_c_bot", label: "Corridor Bot", floor: 3, x: 280, y: 320, isRoom: false, type: "corridor" },
  { id: "f3_c_left", label: "Corridor Left", floor: 3, x: 100, y: 280, isRoom: false, type: "corridor" },
  { id: "f3_c_right", label: "Corridor Right", floor: 3, x: 460, y: 170, isRoom: false, type: "corridor" },
];

const DEFAULT_EDGES = [
  { id: "e1", from: "f1_entrance", to: "f1_c_left", weight: 5 },
  { id: "e2", from: "f1_stairs", to: "f1_c_left", weight: 3 },
  { id: "e3", from: "f1_elevator", to: "f1_c_right", weight: 3 },
  { id: "e4", from: "r_101", to: "f1_c_left", weight: 4 },
  { id: "e5", from: "r_102", to: "f1_c_top", weight: 4 },
  { id: "e6", from: "r_103", to: "f1_c_top", weight: 4 },
  { id: "e7", from: "r_104", to: "f1_c_right", weight: 4 },
  { id: "e8", from: "r_105", to: "f1_c_bot", weight: 4 },
  { id: "e9", from: "r_106", to: "f1_c_bot", weight: 4 },
  { id: "e10", from: "r_107", to: "f1_c_bot", weight: 4 },
  { id: "e11", from: "f1_c_top", to: "f1_c_mid", weight: 8 },
  { id: "e12", from: "f1_c_mid", to: "f1_c_bot", weight: 8 },
  { id: "e13", from: "f1_c_left", to: "f1_c_mid", weight: 10 },
  { id: "e14", from: "f1_c_mid", to: "f1_c_right", weight: 10 },
  { id: "e15", from: "f1_stairs", to: "f2_stairs", weight: 3 },
  { id: "e16", from: "f1_elevator", to: "f2_elevator", weight: 3 },
  { id: "e17", from: "f2_stairs", to: "f2_c_left", weight: 3 },
  { id: "e18", from: "f2_elevator", to: "f2_c_right", weight: 3 },
  { id: "e19", from: "r_201", to: "f2_c_left", weight: 4 },
  { id: "e20", from: "r_202", to: "f2_c_top", weight: 4 },
  { id: "e21", from: "r_203", to: "f2_c_top", weight: 4 },
  { id: "e22", from: "r_204", to: "f2_c_right", weight: 4 },
  { id: "e23", from: "r_205", to: "f2_c_bot", weight: 4 },
  { id: "e24", from: "r_206", to: "f2_c_bot", weight: 4 },
  { id: "e25", from: "r_207", to: "f2_c_bot", weight: 4 },
  { id: "e26", from: "r_208", to: "f2_c_bot", weight: 4 },
  { id: "e27", from: "f2_c_top", to: "f2_c_mid", weight: 8 },
  { id: "e28", from: "f2_c_mid", to: "f2_c_bot", weight: 8 },
  { id: "e29", from: "f2_c_left", to: "f2_c_mid", weight: 10 },
  { id: "e30", from: "f2_c_mid", to: "f2_c_right", weight: 10 },
  { id: "e31", from: "f2_stairs", to: "f3_stairs", weight: 3 },
  { id: "e32", from: "f2_elevator", to: "f3_elevator", weight: 3 },
  { id: "e33", from: "f3_stairs", to: "f3_c_left", weight: 3 },
  { id: "e34", from: "f3_elevator", to: "f3_c_right", weight: 3 },
  { id: "e35", from: "r_301", to: "f3_c_left", weight: 4 },
  { id: "e36", from: "r_302", to: "f3_c_top", weight: 4 },
  { id: "e37", from: "r_303", to: "f3_c_top", weight: 4 },
  { id: "e38", from: "r_304", to: "f3_c_right", weight: 4 },
  { id: "e39", from: "r_305", to: "f3_c_bot", weight: 4 },
  { id: "e40", from: "r_306", to: "f3_c_bot", weight: 4 },
  { id: "e41", from: "r_307", to: "f3_c_bot", weight: 4 },
  { id: "e42", from: "r_308", to: "f3_c_bot", weight: 4 },
  { id: "e43", from: "f3_c_top", to: "f3_c_mid", weight: 8 },
  { id: "e44", from: "f3_c_mid", to: "f3_c_bot", weight: 8 },
  { id: "e45", from: "f3_c_left", to: "f3_c_mid", weight: 10 },
  { id: "e46", from: "f3_c_mid", to: "f3_c_right", weight: 10 },
];

function getLocalLocations() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) {
      const initial = { nodes: DEFAULT_NODES, edges: DEFAULT_EDGES };
      localStorage.setItem(LOCAL_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Location storage error:", err);
    return { nodes: DEFAULT_NODES, edges: DEFAULT_EDGES };
  }
}

function saveLocalLocations(data) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Location save error:", err);
  }
}

export async function getLocationGraph() {
  return getLocalLocations();
}

export async function saveLocationGraph(data) {
  saveLocalLocations(data);
  return data;
}

export async function addLocationNode(node) {
  const data = getLocalLocations();
  const newNode = {
    ...node,
    id: node.id || `loc_${Date.now()}`,
  };
  data.nodes.push(newNode);
  saveLocalLocations(data);
  return newNode;
}

export async function updateLocationNode(id, updates) {
  const data = getLocalLocations();
  const idx = data.nodes.findIndex((n) => n.id === id);
  if (idx === -1) throw new Error("Node not found");
  data.nodes[idx] = { ...data.nodes[idx], ...updates };
  saveLocalLocations(data);
  return data.nodes[idx];
}

export async function deleteLocationNode(id) {
  const data = getLocalLocations();
  data.nodes = data.nodes.filter((n) => n.id !== id);
  data.edges = data.edges.filter((e) => e.from !== id && e.to !== id);
  saveLocalLocations(data);
  return true;
}

export async function addLocationEdge(edge) {
  const data = getLocalLocations();
  const newEdge = {
    ...edge,
    id: edge.id || `edge_${Date.now()}`,
  };
  data.edges.push(newEdge);
  saveLocalLocations(data);
  return newEdge;
}

export async function deleteLocationEdge(id) {
  const data = getLocalLocations();
  data.edges = data.edges.filter((e) => e.id !== id);
  saveLocalLocations(data);
  return true;
}
