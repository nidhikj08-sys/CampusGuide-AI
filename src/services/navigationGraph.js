export class CampusGraph {
  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
  }

  addNode(id, label, floor, x, y, isRoom = false, type = "classroom") {
    this.nodes.set(id, { id, label, floor, x, y, isRoom, type });
    if (!this.edges.has(id)) {
      this.edges.set(id, []);
    }
  }

  addEdge(nodeA, nodeB, weight, accessibility = "walk") {
    if (!this.edges.has(nodeA)) this.edges.set(nodeA, []);
    if (!this.edges.has(nodeB)) this.edges.set(nodeB, []);
    this.edges.get(nodeA).push({ node: nodeB, weight, accessibility });
    this.edges.get(nodeB).push({ node: nodeA, weight, accessibility });
  }

  getEdge(a, b) {
    const list = this.edges.get(a) || [];
    return list.find((e) => e.node === b);
  }

  findShortestPath(startId, endId) {
    if (!this.nodes.has(startId) || !this.nodes.has(endId)) {
      return [];
    }

    const distances = {};
    const previous = {};
    const unvisited = new Set(this.nodes.keys());

    for (const nodeId of this.nodes.keys()) {
      distances[nodeId] = Infinity;
      previous[nodeId] = null;
    }
    distances[startId] = 0;

    while (unvisited.size > 0) {
      let current = null;
      let minDistance = Infinity;

      for (const nodeId of unvisited) {
        if (distances[nodeId] < minDistance) {
          minDistance = distances[nodeId];
          current = nodeId;
        }
      }

      if (current === null || distances[current] === Infinity || current === endId) {
        break;
      }

      unvisited.delete(current);

      const neighbors = this.edges.get(current) || [];
      for (const edge of neighbors) {
        if (unvisited.has(edge.node)) {
          const alt = distances[current] + edge.weight;
          if (alt < distances[edge.node]) {
            distances[edge.node] = alt;
            previous[edge.node] = current;
          }
        }
      }
    }

    const path = [];
    let curr = endId;
    while (curr) {
      const nodeObj = this.nodes.get(curr);
      if (nodeObj) path.unshift(nodeObj);
      curr = previous[curr];
    }

    return path.length > 0 && path[0].id === startId ? path : [];
  }

  findAccessiblePath(startId, endId) {
    if (!this.nodes.has(startId) || !this.nodes.has(endId)) {
      return [];
    }

    const distances = {};
    const previous = {};
    const unvisited = new Set(this.nodes.keys());

    for (const nodeId of this.nodes.keys()) {
      distances[nodeId] = Infinity;
      previous[nodeId] = null;
    }
    distances[startId] = 0;

    while (unvisited.size > 0) {
      let current = null;
      let minDistance = Infinity;

      for (const nodeId of unvisited) {
        if (distances[nodeId] < minDistance) {
          minDistance = distances[nodeId];
          current = nodeId;
        }
      }

      if (current === null || distances[current] === Infinity || current === endId) {
        break;
      }

      unvisited.delete(current);

      const neighbors = this.edges.get(current) || [];
      for (const edge of neighbors) {
        if (unvisited.has(edge.node) && edge.accessibility !== "stairs") {
          const alt = distances[current] + edge.weight;
          if (alt < distances[edge.node]) {
            distances[edge.node] = alt;
            previous[edge.node] = current;
          }
        }
      }
    }

    const path = [];
    let curr = endId;
    while (curr) {
      const nodeObj = this.nodes.get(curr);
      if (nodeObj) path.unshift(nodeObj);
      curr = previous[curr];
    }

    return path.length > 0 && path[0].id === startId ? path : [];
  }
}

export function buildReferenceBuilding() {
  const graph = new CampusGraph();

  // ===== FLOOR 1 =====
  const f1Rooms = [
    ["r_101", "Room 101", 1, 100, 100],
    ["r_102", "Room 102", 1, 220, 100],
    ["r_103", "Room 103", 1, 340, 100],
    ["r_104", "Room 104", 1, 460, 100],
    ["r_105", "Room 105", 1, 100, 360],
    ["r_106", "Room 106", 1, 220, 360],
    ["r_107", "Room 107", 1, 340, 360],
  ];
  f1Rooms.forEach(([id, label, floor, x, y]) => graph.addNode(id, label, floor, x, y, true));

  graph.addNode("f1_entrance", "Main Entrance", 1, 60, 400, true, "entrance");
  graph.addNode("f1_stairs", "Stairs F1", 1, 100, 240, true, "stairs");
  graph.addNode("f1_elevator", "Elevator", 1, 460, 240, true, "elevator");

  const f1Corridors = [
    ["f1_c_top", "Corridor Top", 1, 280, 170],
    ["f1_c_mid", "Corridor Mid", 1, 280, 240],
    ["f1_c_bot", "Corridor Bot", 1, 280, 320],
    ["f1_c_left", "Corridor Left", 1, 100, 280],
    ["f1_c_right", "Corridor Right", 1, 460, 170],
  ];
  f1Corridors.forEach(([id, label, floor, x, y]) => graph.addNode(id, label, floor, x, y, false, "corridor"));

  f1Rooms.forEach(([id]) => {
    const node = graph.nodes.get(id);
    if (node.x < 200) graph.addEdge(id, "f1_c_left", 4);
    else if (node.x > 400) graph.addEdge(id, "f1_c_right", 4);
    else if (node.y < 200) graph.addEdge(id, "f1_c_top", 4);
    else graph.addEdge(id, "f1_c_bot", 4);
  });
  graph.addEdge("f1_entrance", "f1_c_left", 5);
  graph.addEdge("f1_stairs", "f1_c_left", 3, "stairs");
  graph.addEdge("f1_elevator", "f1_c_right", 3, "lift");
  graph.addEdge("f1_c_top", "f1_c_mid", 8);
  graph.addEdge("f1_c_mid", "f1_c_bot", 8);
  graph.addEdge("f1_c_left", "f1_c_mid", 10);
  graph.addEdge("f1_c_mid", "f1_c_right", 10);

  // ===== FLOOR 2 =====
  const f2Rooms = [
    ["r_201", "Room 201", 2, 100, 100],
    ["r_202", "Room 202", 2, 220, 100],
    ["r_203", "Room 203", 2, 340, 100],
    ["r_204", "Room 204", 2, 460, 100],
    ["r_205", "Room 205", 2, 100, 360],
    ["r_206", "Room 206", 2, 220, 360],
    ["r_207", "Room 207", 2, 340, 360],
    ["r_208", "Room 208", 2, 460, 360],
  ];
  f2Rooms.forEach(([id, label, floor, x, y]) => graph.addNode(id, label, floor, x, y, true));

  graph.addNode("f2_stairs", "Stairs F2", 2, 100, 240, true, "stairs");
  graph.addNode("f2_elevator", "Elevator", 2, 460, 240, true, "elevator");

  const f2Corridors = [
    ["f2_c_top", "Corridor Top", 2, 280, 170],
    ["f2_c_mid", "Corridor Mid", 2, 280, 240],
    ["f2_c_bot", "Corridor Bot", 2, 280, 320],
    ["f2_c_left", "Corridor Left", 2, 100, 280],
    ["f2_c_right", "Corridor Right", 2, 460, 170],
  ];
  f2Corridors.forEach(([id, label, floor, x, y]) => graph.addNode(id, label, floor, x, y, false, "corridor"));

  f2Rooms.forEach(([id]) => {
    const node = graph.nodes.get(id);
    if (node.x < 200) graph.addEdge(id, "f2_c_left", 4);
    else if (node.x > 400) graph.addEdge(id, "f2_c_right", 4);
    else if (node.y < 200) graph.addEdge(id, "f2_c_top", 4);
    else graph.addEdge(id, "f2_c_bot", 4);
  });
  graph.addEdge("f2_stairs", "f2_c_left", 3, "stairs");
  graph.addEdge("f2_elevator", "f2_c_right", 3, "lift");
  graph.addEdge("f2_c_top", "f2_c_mid", 8);
  graph.addEdge("f2_c_mid", "f2_c_bot", 8);
  graph.addEdge("f2_c_left", "f2_c_mid", 10);
  graph.addEdge("f2_c_mid", "f2_c_right", 10);

  // ===== FLOOR 3 =====
  const f3Rooms = [
    ["r_301", "Room 301", 3, 100, 100],
    ["r_302", "Room 302", 3, 220, 100],
    ["r_303", "Room 303", 3, 340, 100],
    ["r_304", "Room 304", 3, 460, 100],
    ["r_305", "Room 305", 3, 100, 360],
    ["r_306", "Room 306", 3, 220, 360],
    ["r_307", "Room 307", 3, 340, 360],
    ["r_308", "Room 308", 3, 460, 360],
  ];
  f3Rooms.forEach(([id, label, floor, x, y]) => graph.addNode(id, label, floor, x, y, true));

  graph.addNode("f3_stairs", "Stairs F3", 3, 100, 240, true, "stairs");
  graph.addNode("f3_elevator", "Elevator", 3, 460, 240, true, "elevator");

  const f3Corridors = [
    ["f3_c_top", "Corridor Top", 3, 280, 170],
    ["f3_c_mid", "Corridor Mid", 3, 280, 240],
    ["f3_c_bot", "Corridor Bot", 3, 280, 320],
    ["f3_c_left", "Corridor Left", 3, 100, 280],
    ["f3_c_right", "Corridor Right", 3, 460, 170],
  ];
  f3Corridors.forEach(([id, label, floor, x, y]) => graph.addNode(id, label, floor, x, y, false, "corridor"));

  f3Rooms.forEach(([id]) => {
    const node = graph.nodes.get(id);
    if (node.x < 200) graph.addEdge(id, "f3_c_left", 4);
    else if (node.x > 400) graph.addEdge(id, "f3_c_right", 4);
    else if (node.y < 200) graph.addEdge(id, "f3_c_top", 4);
    else graph.addEdge(id, "f3_c_bot", 4);
  });
  graph.addEdge("f3_stairs", "f3_c_left", 3, "stairs");
  graph.addEdge("f3_elevator", "f3_c_right", 3, "lift");
  graph.addEdge("f3_c_top", "f3_c_mid", 8);
  graph.addEdge("f3_c_mid", "f3_c_bot", 8);
  graph.addEdge("f3_c_left", "f3_c_mid", 10);
  graph.addEdge("f3_c_mid", "f3_c_right", 10);

  // ===== VERTICAL CONNECTIONS =====
  graph.addEdge("f1_stairs", "f2_stairs", 3, "stairs");
  graph.addEdge("f2_stairs", "f3_stairs", 3, "stairs");
  graph.addEdge("f1_elevator", "f2_elevator", 3, "lift");
  graph.addEdge("f2_elevator", "f3_elevator", 3, "lift");

  return graph;
}

export function getCampusMapGraph() {
  return buildReferenceBuilding();
}
