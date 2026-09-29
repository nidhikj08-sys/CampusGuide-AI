// Graph and Dijkstra Implementation for Campus Navigation (Floor 1, 2, 3)

export class CampusGraph {
  constructor() {
    this.nodes = new Map(); // id -> { id, label, floor, x, y, isRoom }
    this.edges = new Map(); // id -> [{ node, weight }]
  }

  addNode(id, label, floor, x, y, isRoom = false) {
    this.nodes.set(id, { id, label, floor, x, y, isRoom });
    if (!this.edges.has(id)) {
      this.edges.set(id, []);
    }
  }

  addEdge(nodeA, nodeB, weight) {
    if (!this.edges.has(nodeA)) this.edges.set(nodeA, []);
    if (!this.edges.has(nodeB)) this.edges.set(nodeB, []);
    this.edges.get(nodeA).push({ node: nodeB, weight });
    this.edges.get(nodeB).push({ node: nodeA, weight });
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

    // Reconstruct path
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

// Build Floor 2 Graph (Matching Screen 4)
export function getCampusMapGraph() {
  const graph = new CampusGraph();

  // --- FLOOR 2 NODES ---
  // Rooms:
  graph.addNode("r_201", "Room 201", 2, 100, 80, true);
  graph.addNode("r_202", "Room 202", 2, 210, 80, true);
  graph.addNode("r_203", "Room 203", 2, 320, 80, true);
  graph.addNode("r_stairs", "Stairs", 2, 100, 220, true);
  graph.addNode("r_204", "Room 204", 2, 450, 240, true);
  graph.addNode("r_205", "Room 205", 2, 140, 360, true);
  graph.addNode("r_206", "Room 206", 2, 250, 360, true);
  graph.addNode("r_207", "Room 207", 2, 360, 360, true);
  graph.addNode("main_entrance", "Main Entrance", 2, 60, 360, true);

  // Corridor Waypoints on Floor 2:
  // Top Hallway
  graph.addNode("w_top_left", "Corridor 201", 2, 100, 150);
  graph.addNode("w_top_mid", "Corridor 202", 2, 210, 150);
  graph.addNode("w_top_right", "Corridor 203", 2, 320, 150);
  graph.addNode("w_top_far", "East Junction Top", 2, 410, 150);

  // Vertical East Corridor
  graph.addNode("w_east_mid", "Corridor 204", 2, 410, 240);
  graph.addNode("w_east_bot", "East Junction Bot", 2, 410, 320);

  // Bottom Hallway
  graph.addNode("w_bot_207", "Corridor 207", 2, 360, 320);
  graph.addNode("w_bot_206", "Corridor 206", 2, 250, 320);
  graph.addNode("w_bot_205", "Corridor 205", 2, 140, 320);
  graph.addNode("w_bot_left", "South West Turn", 2, 60, 320);

  // West Mid Hallway (by Stairs)
  graph.addNode("w_mid_stairs", "Corridor Stairs", 2, 100, 220);

  // Edges (Distances in meters)
  // Connect rooms to hallway waypoints
  graph.addEdge("r_201", "w_top_left", 3);
  graph.addEdge("r_202", "w_top_mid", 3);
  graph.addEdge("r_203", "w_top_right", 3);
  graph.addEdge("r_stairs", "w_mid_stairs", 2);
  graph.addEdge("r_204", "w_east_mid", 4);
  graph.addEdge("r_205", "w_bot_205", 3);
  graph.addEdge("r_206", "w_bot_206", 3);
  graph.addEdge("r_207", "w_bot_207", 3);
  graph.addEdge("main_entrance", "w_bot_left", 3);

  // Connect Top Corridor
  graph.addEdge("w_top_left", "w_top_mid", 10);
  graph.addEdge("w_top_mid", "w_top_right", 10);
  graph.addEdge("w_top_right", "w_top_far", 8);

  // Connect East Corridor
  graph.addEdge("w_top_far", "w_east_mid", 8);
  graph.addEdge("w_east_mid", "w_east_bot", 8);

  // Connect Bottom Corridor
  graph.addEdge("w_east_bot", "w_bot_207", 5);
  graph.addEdge("w_bot_207", "w_bot_206", 10);
  graph.addEdge("w_bot_206", "w_bot_205", 10);
  graph.addEdge("w_bot_205", "w_bot_left", 7);

  // Connect West Corridor / Stairs link
  graph.addEdge("w_bot_left", "w_mid_stairs", 9);
  graph.addEdge("w_mid_stairs", "w_top_left", 7);

  // Central Cross link
  graph.addEdge("w_top_mid", "w_bot_206", 16);

  return graph;
}
