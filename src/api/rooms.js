// CampusGuide API - Rooms, Buildings, Floors, Navigation

import { supabase } from "../supabase";

// ============================================
// BUILDINGS
// ============================================
export async function getBuildings() {
  const { data, error } = await supabase
    .from("buildings")
    .select("*")
    .order("name");
  if (error) throw error;
  return data;
}

export async function getBuilding(code) {
  const { data, error } = await supabase
    .from("buildings")
    .select("*")
    .eq("code", code)
    .single();
  if (error) throw error;
  return data;
}

// ============================================
// FLOORS
// ============================================
export async function getFloors(buildingId) {
  const { data, error } = await supabase
    .from("floors")
    .select("*")
    .eq("building_id", buildingId)
    .order("level");
  if (error) throw error;
  return data;
}

export async function getFloor(floorId) {
  const { data, error } = await supabase
    .from("floors")
    .select("*")
    .eq("id", floorId)
    .single();
  if (error) throw error;
  return data;
}

// ============================================
// ROOMS
// ============================================
export async function getRooms(floorId) {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("floor_id", floorId)
    .order("room_number");
  if (error) throw error;
  return data;
}

export async function getAllRooms() {
  const { data, error } = await supabase
    .from("rooms")
    .select(`
      *,
      floor:floors(*, building:buildings(*))
    `)
    .order("room_number");
  if (error) throw error;
  return data;
}

export async function searchRooms(filters = {}) {
  let query = supabase.from("rooms").select(`
    *,
    floor:floors(*, building:buildings(*))
  `);

  if (filters.buildingId) {
    query = query.eq("floor.building_id", filters.buildingId);
  }
  if (filters.floorId) {
    query = query.eq("floor_id", filters.floorId);
  }
  if (filters.type) {
    query = query.eq("type", filters.type);
  }
  if (filters.capacity) {
    query = query.gte("capacity", filters.capacity);
  }
  if (filters.features?.length) {
    query = query.contains("features", filters.features);
  }
  if (filters.search) {
    query = query.or(`room_number.ilike.%${filters.search}%,name.ilike.%${filters.search}%`);
  }

  const { data, error } = await query.order("room_number");
  if (error) throw error;
  return data;
}

export async function getRoom(roomId) {
  const { data, error } = await supabase
    .from("rooms")
    .select(`
      *,
      floor:floors(*, building:buildings(*))
    `)
    .eq("id", roomId)
    .single();
  if (error) throw error;
  return data;
}

// ============================================
// ALLOCATIONS (Timetable)
// ============================================
export async function getAllocations(filters = {}) {
  let query = supabase.from("allocations").select(`
    *,
    room:rooms(*, floor:floors(*, building:buildings(*)))
  `);

  if (filters.roomId) query = query.eq("room_id", filters.roomId);
  if (filters.year) query = query.eq("year", filters.year);
  if (filters.section) query = query.eq("section", filters.section);
  if (filters.facultyId) query = query.eq("faculty_id", filters.facultyId);
  if (filters.dayOfWeek !== undefined) query = query.eq("day_of_week", filters.dayOfWeek);
  if (filters.semester) query = query.eq("semester", filters.semester);

  const { data, error } = await query.order("day_of_week").order("start_time");
  if (error) throw error;
  return data;
}

export async function getUserSchedule(userId, userRole, userYear, userSection) {
  if (userRole === "student") {
    return getAllocations({ year: userYear, section: userSection });
  } else if (userRole === "faculty") {
    return getAllocations({ facultyId: userId });
  }
  return getAllocations(); // admin sees all
}

// ============================================
// NOTIFICATIONS
// ============================================
export async function getNotifications(userId, role) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .or(`user_id.eq.${userId},and(user_id.is.null,role.in.(${role},all))`)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}

export async function markNotificationRead(notificationId) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId, role) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .or(`user_id.eq.${userId},and(user_id.is.null,role.in.(${role},all))`);
  if (error) throw error;
}

// ============================================
// NAVIGATION HELPERS
// ============================================

// Get all navigable spaces (corridors, rooms with entrances) for a floor
export async function getNavigableGraph(floorId) {
  const { data: rooms, error } = await supabase
    .from("rooms")
    .select("id, room_number, name, type, geometry, entrances, is_navigable")
    .eq("floor_id", floorId)
    .eq("is_navigable", true);
  if (error) throw error;

  // Build adjacency graph from room entrances
  const nodes = [];
  const edges = [];

  rooms.forEach((room) => {
    if (room.entrances?.length) {
      room.entrances.forEach((entrance, i) => {
        const nodeId = `${room.id}-entrance-${i}`;
        nodes.push({
          id: nodeId,
          roomId: room.id,
          roomNumber: room.room_number,
          roomName: room.name,
          roomType: room.type,
          x: entrance.x,
          y: entrance.y,
        });
      });
    }
    // Also add room center as node for "go to room" targets
    if (room.geometry?.coordinates?.[0]?.[0]) {
      const coords = room.geometry.coordinates[0];
      const cx = coords.reduce((sum, p) => sum + p[0], 0) / coords.length;
      const cy = coords.reduce((sum, p) => sum + p[1], 0) / coords.length;
      nodes.push({
        id: `${room.id}-center`,
        roomId: room.id,
        roomNumber: room.room_number,
        roomName: room.name,
        roomType: room.type,
        x: cx,
        y: cy,
        isCenter: true,
      });
    }
  });

  // Connect entrances within same room (distance 0 - same room)
  rooms.forEach((room) => {
    if (room.entrances?.length > 1) {
      for (let i = 0; i < room.entrances.length; i++) {
        for (let j = i + 1; j < room.entrances.length; j++) {
          edges.push({
            from: `${room.id}-entrance-${i}`,
            to: `${room.id}-entrance-${j}`,
            weight: 1, // minimal cost within room
          });
        }
      }
    }
    // Connect entrance to room center
    if (room.entrances?.length) {
      room.entrances.forEach((_, i) => {
        edges.push({
          from: `${room.id}-entrance-${i}`,
          to: `${room.id}-center`,
          weight: 5,
        });
      });
    }
  });

  // Connect adjacent rooms (corridors) - simplified: connect centers of rooms of type 'corridor'
  // In production, you'd use actual corridor geometry
  const corridors = rooms.filter(r => r.type === 'corridor');
  corridors.forEach((corridor) => {
    if (corridor.entrances?.length) {
      corridor.entrances.forEach((_, i) => {
        // Connect corridor entrances to nearby room entrances
        rooms.forEach((room) => {
          if (room.id !== corridor.id && room.entrances?.length) {
            room.entrances.forEach((_, j) => {
              // Simple distance check - in reality use spatial index
              const dx = corridor.entrances[i].x - room.entrances[j].x;
              const dy = corridor.entrances[i].y - room.entrances[j].y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 100) { // threshold
                edges.push({
                  from: `${corridor.id}-entrance-${i}`,
                  to: `${room.id}-entrance-${j}`,
                  weight: dist,
                });
              }
            });
          }
        });
      });
    }
  });

  return { nodes, edges };
}

// A* Pathfinding
export function findPath(nodes, edges, startNodeId, endNodeId) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const adj = new Map();
  edges.forEach(e => {
    if (!adj.has(e.from)) adj.set(e.from, []);
    adj.get(e.from).push({ to: e.to, weight: e.weight });
    if (!adj.has(e.to)) adj.set(e.to, []);
    adj.get(e.to).push({ to: e.from, weight: e.weight });
  });

  const start = nodeMap.get(startNodeId);
  const end = nodeMap.get(endNodeId);
  if (!start || !end) return null;

  // Heuristic: Euclidean distance
  const heuristic = (a, b) => {
    const na = nodeMap.get(a);
    const nb = nodeMap.get(b);
    if (!na || !nb) return 0;
    return Math.sqrt((na.x - nb.x) ** 2 + (na.y - nb.y) ** 2);
  };

  const openSet = new Set([startNodeId]);
  const cameFrom = new Map();
  const gScore = new Map([[startNodeId, 0]]);
  const fScore = new Map([[startNodeId, heuristic(startNodeId, endNodeId)]]);

  while (openSet.size > 0) {
    let current = null;
    let lowestF = Infinity;
    for (const nodeId of openSet) {
      const f = fScore.get(nodeId) || Infinity;
      if (f < lowestF) {
        lowestF = f;
        current = nodeId;
      }
    }

    if (current === endNodeId) {
      // Reconstruct path
      const path = [current];
      while (cameFrom.has(current)) {
        current = cameFrom.get(current);
        path.unshift(current);
      }
      return path.map(id => nodeMap.get(id));
    }

    openSet.delete(current);
    const neighbors = adj.get(current) || [];
    for (const { to, weight } of neighbors) {
      const tentativeG = (gScore.get(current) || Infinity) + weight;
      if (tentativeG < (gScore.get(to) || Infinity)) {
        cameFrom.set(to, current);
        gScore.set(to, tentativeG);
        fScore.set(to, tentativeG + heuristic(to, endNodeId));
        openSet.add(to);
      }
    }
  }
  return null; // No path found
}