import { useEffect, useMemo, useState, useRef } from "react";
import { Canvas, useLoader, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html, useTexture } from "@react-three/drei";
import * as THREE from "three";

const GEOMETRY_URL = "/building-geometry.json";

let _geometryCache = null;
async function loadGeometry() {
  if (_geometryCache) return _geometryCache;
  const res = await fetch(GEOMETRY_URL);
  if (!res.ok) throw new Error("Could not load building 3D model");
  _geometryCache = await res.json();
  return _geometryCache;
}

/** Move camera smoothly to the selected floor. */
function CameraFocus({ activeFloor }) {
  const { camera } = useThree();
  const startPos = useRef(new THREE.Vector3());
  const targetVec = useRef(new THREE.Vector3(0, 1.8, 0));
  const isMoving = useRef(false);
  const startTime = useRef(0);

  useEffect(() => {
    const floorIndex = Math.max(0, activeFloor - 1);
    const newY = -floorIndex * 3.6 + 1.8;
    targetVec.current.set(0, newY, 0);
    startPos.current.copy(camera.position);
    startTime.current = performance.now();
    isMoving.current = true;
  }, [activeFloor]);

  useFrame(() => {
    if (!isMoving.current) return;
    const t = Math.min((performance.now() - startTime.current) / 600, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    const floorIndex = Math.max(0, activeFloor - 1);
    const camY = -floorIndex * 3.6 + 12;
    const endPos = new THREE.Vector3(18 * Math.cos(0.5), camY, 18 * Math.sin(0.5));
    camera.position.lerpVectors(startPos.current, endPos, ease);
    camera.lookAt(targetVec.current);
    if (t >= 1) {
      isMoving.current = false;
    }
  });

  return null;
}

/** Single room: 4 extruded walls + floor + ceiling. */
function Room({ geometry, floorIndex, photoUrls, highlighted, onClick }) {
  const img = useTexture(photoUrls[geometry.floor] || null);
  const hasImage = !!photoUrls[geometry.floor];

  const wallMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: hasImage ? 0xffffff : 0xf4f6f9,
        map: img,
        transparent: hasImage,
        opacity: hasImage ? 0.85 : 1,
        roughness: 0.7,
        metalness: 0.1,
      }),
    [hasImage, img]
  );
  const floorMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: highlighted ? 0xffedd2 : 0xe8f0fe, roughness: 0.9 }),
    [highlighted]
  );
  const ceilingMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: highlighted ? 0xffc999 : 0xd6e4f7, roughness: 0.9, transparent: true, opacity: 0.9 }),
    [highlighted]
  );

  const yBase = -floorIndex * 3.6;

  return (
    <>
      {geometry.walls.map((w) => (
        <mesh key={w.id} position={w.center} rotation={w.rotation} castShadow receiveShadow>
          <boxGeometry args={[w.bbox.maxX, w.bbox.maxY, w.bbox.maxZ]} />
          <primitive object={wallMat} attach="material" />
        </mesh>
      ))}
      <mesh position={[geometry.position.x, yBase, geometry.position.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[geometry.extent.maxX - geometry.extent.minX, geometry.extent.maxZ - geometry.extent.minZ]} />
        <primitive object={floorMat} attach="material" />
      </mesh>
      <mesh position={[geometry.position.x, yBase + geometry.walls[0].bbox.maxY, geometry.position.z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <planeGeometry args={[geometry.extent.maxX - geometry.extent.minX, geometry.extent.maxZ - geometry.extent.minZ]} />
        <primitive object={ceilingMat} attach="material" />
      </mesh>
      {geometry.isRoom && (
        <Html position={[geometry.position.x, yBase + geometry.walls[0].bbox.maxY + 0.12, geometry.position.z]} center>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onClick({ id: geometry.id, label: geometry.label, floor: geometry.floor });
            }}
            style={{
              background: highlighted ? "#f59e0b" : "#1e293b",
              color: "#fff",
              padding: "2px 6px",
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 600,
              pointerEvents: "auto",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
              whiteSpace: "nowrap",
            }}
          >
            {geometry.label}
          </div>
        </Html>
      )}
    </>
  );
}

/** Outside envelope wall + ground plane. */
function Shell({ floorIndex }) {
  const yBase = -floorIndex * 3.6;
  return (
    <>
      {floorIndex === 0 && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[13.87, 11.73]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.95} />
        </mesh>
      )}
      {floorIndex > 0 && (
        <>
          <mesh position={[0, -floorIndex * 3.6 + 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[13.87, 11.73]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.95} />
          </mesh>
          {floor.shell.map((w) => (
            <mesh key={w.id} position={w.center} rotation={w.rotation} receiveShadow>
              <boxGeometry args={[w.bbox.maxX, w.bbox.maxY, w.bbox.maxZ]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.8} />
            </mesh>
          ))}
        </>
      )}
    </>
  );
}

/** Start (blue) and end (red) pins along the route. */
function RoutePins({ routePath }) {
  if (!routePath || routePath.length < 2) return null;
  const start = routePath[0];
  const end = routePath[routePath.length - 1];
  return (
    <>
      <group position={[start.x / 15, 0.6, start.y / 15]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.4, 16]} />
          <meshBasicMaterial color="#2563eb" />
        </mesh>
        <mesh position={[0, 0.9, 0]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color="#2563eb" />
        </mesh>
      </group>
      <group position={[end.x / 15, 0.6, end.y / 15]}>
        <mesh>
          <coneGeometry args={[0.4, 1, 16]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      </group>
    </>
  );
}

/** Core scene rendering all floors at once. */
function BuildingScene({ geometry, photoUrls, highlightedRoom, onRoomClick, routePath }) {
  return (
    <>
      {geometry.floors.map((floor, i) => (
        <group key={floor.id} position={[0, -i * 3.6, 0]}>
          <Shell floorIndex={i} />
          {floor.geometry.map((g) => {
            const isHighlighted = highlightedRoom?.id === g.id;
            return (
              <mesh
                key={g.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onRoomClick({ id: g.id, label: g.label, floor: g.floor });
                }}
              >
                <Room
                  geometry={g}
                  floorIndex={i}
                  photoUrls={photoUrls}
                  highlighted={isHighlighted}
                  onClick={onRoomClick}
                />
              </mesh>
            );
          })}
        </group>
      ))}
      {routePath && routePath.length > 1 && <RoutePins routePath={routePath} />}
      <ambientLight intensity={0.5} />
      <directionalLight position={[30, 40, 20]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-20, 20, -10]} intensity={0.35} />
    </>
  );
}

/** Catch errors and show them visibly instead of a blank screen. */
function ErrorDisplay({ message }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(255,255,255,0.98)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#dc2626",
        padding: 24,
        textAlign: "center",
        zIndex: 100,
      }}
    >
      <h3 style={{ marginBottom: 8 }}>3D view failed to load</h3>
      <pre style={{ fontSize: 12, overflow: "auto", maxWidth: 600, whiteSpace: "pre-wrap", marginBottom: 16 }}>
        {message}
      </pre>
      <button
        onClick={() => window.location.reload()}
        style={{ padding: "8px 16px", fontSize: 14, cursor: "pointer" }}
      >
        Reload page
      </button>
    </div>
  );
}

/** Interactive 3D campus map viewer. */
export default function Map3D({ activeFloor, setFloorFocus, highlightedRoom, onRoomClick, routePath }) {
  const [geometry, setGeometry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGeometry()
      .then(setGeometry)
      .catch(() => setGeometry(null))
      .finally(() => setLoading(false));
  }, []);

  const photoUrls = useMemo(() => {
    const out = {};
    if (geometry?.building?.floors) {
      for (const f of geometry.building.floors) {
        out[f.floor] = f.image;
      }
    }
    return out;
  }, [geometry]);

  if (loading) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div className="loading-state">
          <div className="spinner" />
          <p className="muted">Loading 3D map…</p>
        </div>
      </div>
    );
  }

  if (!geometry) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <p className="muted">3D model missing — run <code>npm run build:geometry</code> and refresh</p>
      </div>
    );
  }

  return (
    <>
      <Canvas shadows camera={{ position: [18, 16, 18], fov: 45 }} gl={{ preserveDrawingBuffer: true }}>
        <CameraFocus activeFloor={activeFloor} />
        <BuildingScene
          geometry={geometry}
          photoUrls={photoUrls}
          highlightedRoom={highlightedRoom}
          onRoomClick={onRoomClick}
          routePath={routePath}
        />
        <OrbitControls makeDefault target={[0, 1.8, 0]} minDistance={8} maxDistance={50} />
      </Canvas>
      <div style={{ position: "absolute", left: 12, bottom: 12, display: "flex", gap: 8 }}>
        {geometry.floors.map((f) => (
          <button
            key={f.id}
            onClick={() => setFloorFocus?.(f.id)}
            style={{
              padding: "6px 14px",
              border: "none",
              borderRadius: 6,
              background: activeFloor === f.id ? "#2563eb" : "rgba(255,255,255,0.7)",
              color: activeFloor === f.id ? "#fff" : "#334155",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 13,
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.92)", padding: "8px 12px", borderRadius: 8, fontSize: 12, color: "#475569" }}>
        {geometry.building.name} · {geometry.building.floors.length} floors · drag to orbit
      </div>
    </>
  );
}
