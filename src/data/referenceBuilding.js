/**
 * Reference building seed — the canonical 3-floor Main Block layout.
 *
 * This is the single geometric definition of the building. Both the runtime
 * graph (navigationGraph) and the admin editor's initial state
 * (locationService) seed from here, so the map students see and the map admins
 * edit can no longer drift apart.
 *
 * Geometry is in blueprint units, 15 units = 1 metre (see config/buildingSpec).
 */

export const REFERENCE_FLOORS = 3;

/** Per-floor room table shared by all three floors. */
function floorRooms(prefix, floor) {
  const counts = { 1: 7, 2: 8, 3: 8 };
  const rooms = [];
  for (let i = 1; i <= counts[floor]; i += 1) {
    const num = `${floor}0${i}`;
    const col = i <= 4 ? i : i - 4;
    const row = i <= 4 ? "top" : "bottom";
    rooms.push({
      id: `r_${num}`,
      label: `Room ${num}`,
      floor,
      x: 100 + (col - 1) * 120,
      y: row === "top" ? 100 : 360,
      isRoom: true,
      type: "classroom",
    });
  }
  void prefix;
  return rooms;
}

function floorCorridors(floor) {
  return [
    { id: `f${floor}_c_top`, label: "Corridor Top", floor, x: 280, y: 170, isRoom: false, type: "corridor" },
    { id: `f${floor}_c_mid`, label: "Corridor Mid", floor, x: 280, y: 240, isRoom: false, type: "corridor" },
    { id: `f${floor}_c_bot`, label: "Corridor Bot", floor, x: 280, y: 320, isRoom: false, type: "corridor" },
    { id: `f${floor}_c_left`, label: "Corridor Left", floor, x: 100, y: 280, isRoom: false, type: "corridor" },
    { id: `f${floor}_c_right`, label: "Corridor Right", floor, x: 460, y: 170, isRoom: false, type: "corridor" },
  ];
}

/**
 * Build the reference building as plain data.
 * @returns {{ nodes: object[], edges: object[] }}
 */
export function buildReferenceBuildingData() {
  const nodes = [];
  const edges = [];
  const seen = new Set();

  const addEdge = (from, to, weight, accessibility = "walk") => {
    // Deduplicate: the same pair can be requested from both floors' builders.
    const key = [from, to].sort().join("|");
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ id: `e_${edges.length + 1}`, from, to, weight, accessibility });
  };

  for (let floor = 1; floor <= REFERENCE_FLOORS; floor += 1) {
    const rooms = floorRooms("", floor);
    nodes.push(...rooms, ...floorCorridors(floor));

    nodes.push({
      id: `f${floor}_stairs`,
      label: `Stairs F${floor}`,
      floor,
      x: 100,
      y: 240,
      isRoom: true,
      type: "stairs",
    });
    nodes.push({
      id: `f${floor}_elevator`,
      label: `Elevator F${floor}`,
      floor,
      x: 460,
      y: 240,
      isRoom: true,
      type: "elevator",
    });

    if (floor === 1) {
      nodes.push({
        id: "f1_entrance",
        label: "Main Entrance",
        floor: 1,
        x: 60,
        y: 400,
        isRoom: true,
        type: "entrance",
      });
    }

    // Attach each room to its nearest corridor.
    for (const room of rooms) {
      if (room.x < 200) addEdge(room.id, `f${floor}_c_left`, 4);
      else if (room.x > 400) addEdge(room.id, `f${floor}_c_right`, 4);
      else if (room.y < 200) addEdge(room.id, `f${floor}_c_top`, 4);
      else addEdge(room.id, `f${floor}_c_bot`, 4);
    }

    addEdge(`f${floor}_stairs`, `f${floor}_c_left`, 3, "stairs");
    addEdge(`f${floor}_elevator`, `f${floor}_c_right`, 3, "lift");

    addEdge(`f${floor}_c_top`, `f${floor}_c_mid`, 8);
    addEdge(`f${floor}_c_mid`, `f${floor}_c_bot`, 8);
    addEdge(`f${floor}_c_left`, `f${floor}_c_mid`, 10);
    addEdge(`f${floor}_c_mid`, `f${floor}_c_right`, 10);
  }

  addEdge("f1_entrance", "f1_c_left", 5);

  // Vertical circulation: these four links are what make multi-floor routing work.
  addEdge("f1_stairs", "f2_stairs", 3, "stairs");
  addEdge("f2_stairs", "f3_stairs", 3, "stairs");
  addEdge("f1_elevator", "f2_elevator", 3, "lift");
  addEdge("f2_elevator", "f3_elevator", 3, "lift");

  return { nodes, edges };
}

/**
 * Vertical connections declared as data, mirroring
 * public/data/vertical-connections.csv. Used by the admin editor to render the
 * "which rooms connect floors" view and to validate stair/elevator links.
 */
export const VERTICAL_CONNECTIONS = [
  { from: "f1_stairs", to: "f2_stairs", connection: "stairs", accessible: false },
  { from: "f2_stairs", to: "f3_stairs", connection: "stairs", accessible: false },
  { from: "f1_elevator", to: "f2_elevator", connection: "elevator", accessible: true },
  { from: "f2_elevator", to: "f3_elevator", connection: "elevator", accessible: true },
];

/**
 * Floor plan assets. Swap `file` for your own PNG/JPG when the real drawings
 * arrive — the blueprint SVG is used as the fallback and as the route overlay.
 */
export const FLOOR_PLANS = {
  1: { floor: 1, label: "Ground Floor", file: "/floorplans/floor-1.svg", image: null, scale: true },
  2: { floor: 2, label: "First Floor", file: "/floorplans/floor-2.svg", image: null, scale: true },
  3: { floor: 3, label: "Second Floor", file: "/floorplans/floor-3.svg", image: null, scale: true },
};

/** Rooms eligible for a printed QR code, by node id. Derived from the seed. */
export function listQrLocations(data = buildReferenceBuildingData()) {
  const types = new Set([
    "classroom", "lab", "office", "seminar hall",
    "staff room", "stairs", "elevator", "entrance",
  ]);
  return data.nodes.filter((n) => types.has(n.type));
}