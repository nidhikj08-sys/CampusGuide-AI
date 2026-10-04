import {
  buildReferenceBuildingData,
  VERTICAL_CONNECTIONS,
  FLOOR_PLANS,
} from "../data/referenceBuilding";

const LOCAL_KEY = "campusguide_locations_data";

/* ──────────────────────────────────────────────
   Persistence
   ────────────────────────────────────────────── */

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function seedData() {
  return buildReferenceBuildingData();
}

function readRaw() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeRaw(data) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Location save error:", err);
  }
  return data;
}

/**
 * Load the editable location graph. Seeds from the reference building the
 * first time, then always reflects admin edits.
 */
export async function getLocationGraph() {
  const existing = readRaw();
  if (existing) return existing;
  return writeRaw(seedData());
}

export async function saveLocationGraph(data) {
  return writeRaw(data);
}

/** Discard admin edits and restore the reference building. */
export async function resetToReferenceBuilding() {
  return writeRaw(seedData());
}

/* ──────────────────────────────────────────────
   Node CRUD
   ────────────────────────────────────────────── */

export async function addLocationNode(node) {
  const data = await getLocationGraph();
  const newNode = { ...node, id: node.id || `loc_${Date.now()}` };
  if (data.nodes.some((n) => n.id === newNode.id)) {
    throw new Error(`A location with id "${newNode.id}" already exists.`);
  }
  data.nodes.push(newNode);
  writeRaw(data);
  return newNode;
}

export async function updateLocationNode(id, updates) {
  const data = await getLocationGraph();
  const index = data.nodes.findIndex((n) => n.id === id);
  if (index === -1) throw new Error("Node not found");
  data.nodes[index] = { ...data.nodes[index], ...updates, id };
  writeRaw(data);
  return data.nodes[index];
}

export async function deleteLocationNode(id) {
  const data = await getLocationGraph();
  data.nodes = data.nodes.filter((n) => n.id !== id);
  data.edges = data.edges.filter((e) => e.from !== id && e.to !== id);
  writeRaw(data);
  return true;
}

/* ──────────────────────────────────────────────
   Edge CRUD
   ────────────────────────────────────────────── */

export async function addLocationEdge(edge) {
  const data = await getLocationGraph();
  const from = data.nodes.find((n) => n.id === edge.from);
  const to = data.nodes.find((n) => n.id === edge.to);

  if (!from || !to) throw new Error("Both locations must exist before linking them.");
  if (edge.from === edge.to) throw new Error("A location cannot link to itself.");

  const duplicate = data.edges.some(
    (e) => (e.from === edge.from && e.to === edge.to) || (e.from === edge.to && e.to === edge.from)
  );
  if (duplicate) throw new Error("These locations are already linked.");

  const newEdge = {
    id: edge.id || `edge_${Date.now()}`,
    from: edge.from,
    to: edge.to,
    weight: Number(edge.weight) || 5,
    accessibility: edge.accessibility || "walk",
  };
  data.edges.push(newEdge);
  writeRaw(data);
  return newEdge;
}

export async function deleteLocationEdge(id) {
  const data = await getLocationGraph();
  data.edges = data.edges.filter((e) => e.id !== id);
  writeRaw(data);
  return true;
}

/* ──────────────────────────────────────────────
   Floor plans
   ────────────────────────────────────────────── */

/**
 * Floor plan metadata. `image` is null until a real PNG/JPG is dropped in —
 * callers should fall back to `file` (the vector blueprint) in that case.
 */
export async function getFloorPlans() {
  return clone(FLOOR_PLANS);
}

export async function getFloorPlan(floor) {
  return FLOOR_PLANS[floor] ?? null;
}

/** Best available artwork for a floor: real image if set, else vector plan. */
export function resolveFloorPlanSource(floor) {
  const plan = FLOOR_PLANS[floor];
  if (!plan) return null;
  return plan.image || plan.file;
}

/* ──────────────────────────────────────────────
   Vertical connections (stairs / elevators)
   ────────────────────────────────────────────── */

/**
 * Stair and elevator links that currently exist in the editable graph.
 * Falls back to the declared reference connections when the graph has none,
 * so the admin view is never empty.
 */
export async function getVerticalConnections() {
  const data = await getLocationGraph();
  const ids = new Set(data.nodes.map((n) => n.id));

  // Only genuine cross-floor links count. Stairwell and lift *approach* edges
  // on the same floor also carry stairs/lift accessibility, so filter on the
  // floors actually differing rather than on the accessibility tag alone.
  const live = data.edges.filter((e) => {
    if (e.accessibility !== "stairs" && e.accessibility !== "lift") return false;
    const from = data.nodes.find((n) => n.id === e.from);
    const to = data.nodes.find((n) => n.id === e.to);
    return from && to && from.floor !== to.floor;
  });

  const rows = live.map((e) => {
    const from = data.nodes.find((n) => n.id === e.from);
    const to = data.nodes.find((n) => n.id === e.to);
    return {
      from: e.from,
      to: e.to,
      connection: e.accessibility === "lift" ? "elevator" : "stairs",
      accessible: e.accessibility === "lift",
      fromFloor: from?.floor ?? null,
      toFloor: to?.floor ?? null,
      live: true,
    };
  });

  if (rows.length > 0) return rows;

  return VERTICAL_CONNECTIONS.filter((v) => ids.has(v.from) && ids.has(v.to)).map((v) => {
    const from = data.nodes.find((n) => n.id === v.from);
    const to = data.nodes.find((n) => n.id === v.to);
    return {
      ...v,
      fromFloor: from?.floor ?? null,
      toFloor: to?.floor ?? null,
      live: false,
    };
  });
}

/**
 * Which floors can be reached from `floor` using only step-free circulation.
 * Used by IndoorMap to warn when an accessible route is impossible.
 */
export async function getStepFreeFloors() {
  const connections = await getVerticalConnections();
  const data = await getLocationGraph();
  const floorsOf = (nodeId) => data.nodes.find((n) => n.id === nodeId)?.floor;

  const stepFree = connections.filter((c) => c.accessible);
  if (stepFree.length === 0) return [1];

  const reachable = new Set([1]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const c of stepFree) {
      const a = floorsOf(c.from);
      const b = floorsOf(c.to);
      if (a == null || b == null) continue;
      if (reachable.has(a) && !reachable.has(b)) { reachable.add(b); changed = true; }
      if (reachable.has(b) && !reachable.has(a)) { reachable.add(a); changed = true; }
    }
  }
  return [...reachable].sort((x, y) => x - y);
}

/* ──────────────────────────────────────────────
   CSV import helpers
   ────────────────────────────────────────────── */

/** Minimal RFC-4180 CSV parser (handles quoted fields and embedded commas). */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; }
        else inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') { inQuotes = true; continue; }
    if (char === ",") { row.push(field); field = ""; continue; }
    if (char === "\r") continue;
    if (char === "\n") { row.push(field); rows.push(row); row = []; field = ""; continue; }
    field += char;
  }

  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/** Parse rooms.csv text into row objects keyed by header. */
export function parseRoomsCsv(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim());

  return rows.slice(1).map((cells) => {
    const record = {};
    headers.forEach((header, i) => {
      record[header] = (cells[i] ?? "").trim();
    });
    return record;
  });
}

/** Fetch the shipped room list. Network-only; safe to call when offline. */
export async function fetchRoomList() {
  try {
    const res = await fetch("/data/rooms.csv");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parseRoomsCsv(await res.text());
  } catch (err) {
    console.warn("Could not load rooms.csv:", err.message);
    return [];
  }
}

/** Fetch the shipped vertical connection list. */
export async function fetchVerticalConnectionCsv() {
  try {
    const res = await fetch("/data/vertical-connections.csv");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parseRoomsCsv(await res.text());
  } catch (err) {
    console.warn("Could not load vertical-connections.csv:", err.message);
    return [];
  }
}