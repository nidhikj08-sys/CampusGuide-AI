
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

  /**
   * Dijkstra shortest path.
   * @param {string} startId
   * @param {string} endId
   * @param {object} [options]
   * @param {boolean} [options.accessibleOnly] Skip stairs edges.
   * @param {Set<string>} [options.blocked] Node ids to avoid (e.g. under maintenance).
   */
  findShortestPath(startId, endId, options = {}) {
    const { accessibleOnly = false, blocked = null } = options;

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
        if (accessibleOnly && edge.accessibility === "stairs") continue;
        if (blocked && blocked.has(edge.node)) continue;
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

  /** Step-free route: never routes through stairs. */
  findAccessiblePath(startId, endId, options = {}) {
    return this.findShortestPath(startId, endId, { ...options, accessibleOnly: true });
  }

  /** Nodes on a given floor. */
  getFloorNodes(floor) {
    return Array.from(this.nodes.values()).filter((n) => n.floor === floor);
  }

  /** Edges that cross between floors. */
  getVerticalEdges() {
    const out = [];
    for (const [nodeId, list] of this.edges.entries()) {
      const a = this.nodes.get(nodeId);
      if (!a) continue;
      for (const e of list) {
        const b = this.nodes.get(e.node);
        if (b && b.floor !== a.floor) {
          out.push({ from: a, to: b, accessibility: e.accessibility, weight: e.weight });
        }
      }
    }
    return out;
  }
}
