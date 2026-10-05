/**
 * Build the 3D building geometry from the blueprint definition and floor images.
 *
 * Reads src/data/referenceBuilding.js (room layout, coordinates, vertical cores)
 * and generates public/building-geometry.json, the 3D model source used by
 * Map3D.jsx. If real floor photos exist in public/floorplans/ (ground-floor.jpg,
 * first-floor.jpg, second-floor.jpg) they are recorded as textures for each floor.
 *
 * Run: npm run build:geometry
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Blueprint units -> metres (config/buildingSpec PX_PER_METER)
const PX_PER_METER = 15;

// Map blueprint (x,y) to wall thickness / openings. Simple model:
// rooms are solid boxes; the shell wall is solid; cores have doors.
function buildRoomGeometry(node, floorHeight) {
  const { id, label, floor, type, isRoom } = node;
  const x = node.x / PX_PER_METER;
  const y = node.y / PX_PER_METER;
  // blueprint rects: rooms 110x90, stairs 90x44, elevator 90x56, entrance 150x45
  const sizes = {
    classroom: [110, 90],
    lab: [110, 90],
    office: [110, 90],
    "seminar hall": [140, 90],
    corridor: [110, 60],
    stairs: [90, 44],
    elevator: [90, 56],
    entrance: [150, 45],
    landmark: [40, 40],
  };
  const [wU, hU] = sizes[node.type] ?? [110, 90];
  const w = wU / PX_PER_METER;
  const h = hU / PX_PER_METER;

  const corners = [
    { x: x - w / 2, z: y - h / 2 },
    { x: x + w / 2, z: y - h / 2 },
    { x: x + w / 2, z: y + h / 2 },
    { x: x - w / 2, z: y + h / 2 },
  ];
  const wallHeight = floorHeight;

  // 4 wall boxes (thin, 0.2m)
  const walls = [
    { name: "wall_s", dir: "s", v: corners[0].z, h: w, p: corners[0].x, t: [0, wallHeight / 2, 0], r: [0, 0, 0] },
    { name: "wall_n", dir: "n", v: corners[2].z, h: w, p: corners[2].x, t: [0, wallHeight / 2, 0], r: [Math.PI, 0, 0] },
    { name: "wall_e", dir: "e", v: corners[2].x, h: h, p: corners[1].z, t: [wallHeight / 2, 0, 0], r: [0, Math.PI / 2, 0] },
    { name: "wall_w", dir: "w", v: corners[0].x, h: h, p: corners[3].z, t: [wallHeight / 2, 0, 0], r: [0, -Math.PI / 2, 0] },
  ].map((w) => ({
    id: `${id}_${w.name}`,
    type: "wall",
    bbox: { minX: 0, maxX: w.h, minY: 0, maxY: wallHeight, minZ: 0, maxZ: 0 },
    center: { x: w.p, y: w.t[1], z: w.v },
    rotation: { x: w.r[0], y: w.r[1], z: w.r[2] },
  }));

  return {
    id,
    label,
    type,
    floor,
    isRoom,
    position: { x, y, z: y },
    extent: { minX: x - w / 2, maxX: x + w / 2, minZ: y - h / 2, maxZ: y + h / 2 },
    walls,
  };
}

async function buildBuildingGeometry() {
  const { REFERENCE_FLOORS, buildReferenceBuildingData } = await import(
    pathToFileURL(path.join(ROOT, "src/data/referenceBuilding.js")).href
  );
  const { FLOOR_SPECS, BUILDING } = await import(
    pathToFileURL(path.join(ROOT, "src/config/buildingSpec.js")).href
  );

  const data = buildReferenceBuildingData();
  const floors = [];
  let totalVolume = 0;

  for (let floor = 1; floor <= REFERENCE_FLOORS; floor += 1) {
    const nodes = data.nodes.filter((n) => n.floor === floor);
    const floorHeight = FLOOR_SPECS[floor]?.heightMeters ?? 3.6;
    const roomGeos = nodes.map((n) => buildRoomGeometry(n, floorHeight));
    totalVolume += roomGeos.reduce((acc, g) => {
      const dx = g.extent.maxX - g.extent.minX;
      const dz = g.extent.maxZ - g.extent.minZ;
      return acc + dx * dz * floorHeight;
    }, 0);

    floors.push({
      id: floor,
      label: FLOOR_SPECS[floor]?.label || `Floor ${floor}`,
      height: floorHeight,
      geometry: roomGeos,
      cores: roomGeos.filter((g) => ["stairs", "elevator"].includes(g.type)),
    });
  }

  // Shell walls: outer footprint 520x440 blueprint units at 0.25m thickness
  const shellW = BUILDING.widthMeters;
  const shellH = BUILDING.depthMeters;
  floors.forEach((f) => {
    f.shell = [
      { id: `f${f.id}_wall_s`, type: "wall", bbox: { minX: 0, maxX: shellW, minY: 0, maxY: f.height, minZ: 0, maxZ: 0 }, center: { x: shellW / 2, y: f.height / 2, z: 0 }, rotation: { x: 0, y: 0, z: 0 } },
      { id: `f${f.id}_wall_n`, type: "wall", bbox: { minX: 0, maxX: shellW, minY: 0, maxY: f.height, minZ: 0, maxZ: 0 }, center: { x: shellW / 2, y: f.height / 2, z: shellH }, rotation: { x: Math.PI, y: 0, z: 0 } },
      { id: `f${f.id}_wall_e`, type: "wall", bbox: { minX: 0, maxX: f.height, minY: 0, maxY: f.height, minZ: 0, maxZ: 0 }, center: { x: shellW, y: f.height / 2, z: shellH / 2 }, rotation: { x: 0, y: Math.PI / 2, z: 0 } },
      { id: `f${f.id}_wall_w`, type: "wall", bbox: { minX: 0, maxX: f.height, minY: 0, maxY: f.height, minZ: 0, maxZ: 0 }, center: { x: 0, y: f.height / 2, z: shellH / 2 }, rotation: { x: 0, y: -Math.PI / 2, z: 0 } },
    ];
  });

  const model = {
    building: {
      name: BUILDING.name,
      campus: BUILDING.campus,
      floors: REFERENCE_FLOORS,
      shellSize: { widthMeters: shellW, depthMeters: shellH },
      totalVolumeCubicMeters: Math.round(totalVolume),
    },
    floors,
  };

  writeFileSync(path.join(ROOT, "public", "building-geometry.json"), JSON.stringify(model, null, 2));
  console.log(`Written public/building-geometry.json (${model.floors.length} floors, ${model.building.totalVolumeCubicMeters} m³)`);

  // Auto-detect real floor photos and record them (.png or .jpg)
  const detectedImages = {};
  const imageNames = { 1: "ground-floor", 2: "first-floor", 3: "second-floor" };
  const extensions = ["png", "jpg", "jpeg"];
  for (const f of model.floors) {
    const base = imageNames[f.id];
    for (const ext of extensions) {
      const name = `${base}.${ext}`;
      const imgPath = path.join(ROOT, "public", "floorplans", name);
      try {
        const stats = await import("node:fs").then((fs) => fs.promises.stat(imgPath));
        if (stats.isFile()) {
          detectedImages[f.id] = `/floorplans/${name}`;
          break;
        }
      } catch {
        // file absent
      }
    }
  }
  model.building.floors = Object.keys(detectedImages).map((k) => ({ floor: Number(k), image: detectedImages[Number(k)] }));
  console.log("Detected floor photos:", Object.keys(detectedImages).length ? JSON.stringify(detectedImages) : "none (using blueprint colors)");

  return model;
}

buildBuildingGeometry().catch((err) => {
  console.error("Failed to build building geometry:", err);
  process.exit(1);
});
