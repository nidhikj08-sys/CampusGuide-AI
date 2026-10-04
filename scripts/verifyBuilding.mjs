/**
 * Sanity check for the reference building seed + routing.
 * Run with: node scripts/verifyBuilding.mjs
 */
import { buildReferenceBuildingData, VERTICAL_CONNECTIONS, listQrLocations } from "../src/data/referenceBuilding.js";
import { CampusGraph } from "../src/services/campusGraph.js";
import { readFileSync } from "node:fs";

/* Local copies of the pure helpers under test, imported from source by
   stripping the module specifier so Node's ESM resolver is not involved. */
const locationServiceSrc = readFileSync(
  new URL("../src/services/locationService.js", import.meta.url),
  "utf8"
);
const pureHelpers = locationServiceSrc.slice(
  locationServiceSrc.indexOf("/** Minimal RFC-4180"),
  locationServiceSrc.indexOf("/** Fetch the shipped room list")
);
const helpers = await import(
  `data:text/javascript,${encodeURIComponent(pureHelpers)}`
);
const { parseCsv, parseRoomsCsv } = helpers;

let failures = 0;
function check(label, condition, detail = "") {
  const ok = !!condition;
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` -> ${detail}` : ""}`);
}

const data = buildReferenceBuildingData();

// ---- structure ----
// 23 rooms (7+8+8) + 15 corridors (5x3) + 3 stairs + 3 lifts + 1 entrance = 45
const rooms = data.nodes.filter((n) => n.isRoom && !["stairs", "elevator", "entrance"].includes(n.type));
check("room count is 23", rooms.length === 23, `got ${rooms.length}`);
check("total nodes is 45", data.nodes.length === 45, `got ${data.nodes.length}`);

const ids = new Set(data.nodes.map((n) => n.id));
check("node ids are unique", ids.size === data.nodes.length, `${ids.size} unique of ${data.nodes.length}`);

// every edge endpoint must exist
const dangling = data.edges.filter((e) => !ids.has(e.from) || !ids.has(e.to));
check("no dangling edges", dangling.length === 0, dangling.map((e) => `${e.from}->${e.to}`).join(", "));

// no duplicate undirected edges
const seen = new Set();
const dupes = [];
for (const e of data.edges) {
  const k = [e.from, e.to].sort().join("|");
  if (seen.has(k)) dupes.push(k);
  seen.add(k);
}
check("no duplicate edges", dupes.length === 0, dupes.join(", "));

// ---- graph connectivity ----
const g = new CampusGraph();
for (const n of data.nodes) g.addNode(n.id, n.label, n.floor, n.x, n.y, !!n.isRoom, n.type);
for (const e of data.edges) g.addEdge(e.from, e.to, e.weight, e.accessibility);

// BFS from entrance must reach every node
const start = "f1_entrance";
const reached = new Set([start]);
const queue = [start];
while (queue.length) {
  const cur = queue.shift();
  for (const e of g.edges.get(cur) || []) {
    if (!reached.has(e.node)) { reached.add(e.node); queue.push(e.node); }
  }
}
const unreachable = data.nodes.filter((n) => !reached.has(n.id));
check("graph is fully connected", unreachable.length === 0, unreachable.map((n) => n.id).join(", "));

// ---- routing ----
const p1 = g.findShortestPath("f1_entrance", "r_101");
check("routes entrance -> 101", p1.length > 1, `${p1.length} nodes`);

// cross-floor route must use stairs or lift
const p2 = g.findShortestPath("f1_entrance", "r_302");
const crossOk = p2.length > 1 && p2.some((n) => n.floor !== 1);
check("routes entrance -> 302 across floors", crossOk, `floors: ${[...new Set(p2.map((n) => n.floor))].join(",")}`);

// accessible route must never use a stairs edge
const p3 = g.findAccessiblePath("f1_entrance", "r_302");
let usedStairs = false;
for (let i = 0; i < p3.length - 1; i += 1) {
  const e = g.getEdge(p3[i].id, p3[i + 1].id);
  if (e && e.accessibility === "stairs") usedStairs = true;
}
check("accessible route avoids stairs", p3.length > 1 && !usedStairs, `${p3.length} nodes, usedStairs=${usedStairs}`);

// ---- vertical connections ----
check("declares 4 vertical connections", VERTICAL_CONNECTIONS.length === 4);

// Cross-floor links only. Stairwell/lift *approach* edges carry the same
// accessibility tag but stay on one floor, so they must not be counted.
const nodeFloor = new Map(data.nodes.map((n) => [n.id, n.floor]));
const crossFloor = data.edges.filter(
  (e) => (e.accessibility === "stairs" || e.accessibility === "lift") &&
    nodeFloor.get(e.from) !== nodeFloor.get(e.to)
);
check("graph has 4 cross-floor edges", crossFloor.length === 4, `got ${crossFloor.length}`);
const sameFloorTagged = data.edges.filter(
  (e) => (e.accessibility === "stairs" || e.accessibility === "lift") &&
    nodeFloor.get(e.from) === nodeFloor.get(e.to)
);
check("same-floor stairs/lift approach edges exist", sameFloorTagged.length === 6, `got ${sameFloorTagged.length}`);
const vertIdsOk = VERTICAL_CONNECTIONS.every((v) => ids.has(v.from) && ids.has(v.to));
check("declared vertical nodes exist in graph", vertIdsOk);

// ---- QR eligibility ----
const qrLocs = listQrLocations(data);
check("QR covers all rooms + cores", qrLocs.length === 30, `got ${qrLocs.length}`);
check("QR excludes corridors", qrLocs.every((n) => n.type !== "corridor"));

// ---- CSV files ----
const roomsCsv = parseRoomsCsv(readFileSync("public/data/rooms.csv", "utf8"));
check("rooms.csv parses", roomsCsv.length > 0, `${roomsCsv.length} rows`);
check("rooms.csv has required columns", ["room_id", "label", "floor", "type"].every((c) => c in roomsCsv[0]));
const csvFloors = new Set(roomsCsv.filter((r) => r.room_id.startsWith("r_")).map((r) => r.floor));
check("rooms.csv covers 3 floors", csvFloors.size === 3, [...csvFloors].sort().join(","));

// every CSV room must exist in the graph
const csvIds = roomsCsv.filter((r) => r.room_id.startsWith("r_")).map((r) => r.room_id);
const missing = csvIds.filter((id) => !ids.has(id));
check("every CSV room exists in graph", missing.length === 0, missing.join(", "));

// quoted-field CSV handling
const tricky = parseCsv('a,b\n"x,1","he said ""hi"""\n');
check("CSV parser handles quotes+commas", tricky[1][0] === "x,1" && tricky[1][1] === 'he said "hi"', JSON.stringify(tricky[1]));

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);