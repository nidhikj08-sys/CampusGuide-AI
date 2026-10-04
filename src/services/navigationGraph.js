import { getLocationGraph } from "./locationService";
import { CampusGraph } from "./campusGraph";

export { CampusGraph };

/**
 * Build the runtime graph from the admin-editable location data.
 *
 * Reads through locationService (localStorage, seeded from the reference
 * building) so edits made in Manage Locations are immediately reflected in the
 * student-facing map. Previously this returned a freshly hardcoded graph, which
 * meant admin edits never reached the map students saw.
 */
export async function getCampusMapGraph() {
  const data = await getLocationGraph();
  const graph = new CampusGraph();

  for (const node of data.nodes) {
    graph.addNode(
      node.id,
      node.label,
      node.floor,
      node.x,
      node.y,
      !!node.isRoom,
      node.type || "classroom"
    );
  }

  for (const edge of data.edges) {
    // Skip links whose endpoints were deleted, otherwise addEdge would create
    // orphan adjacency entries.
    if (!graph.nodes.has(edge.from) || !graph.nodes.has(edge.to)) continue;
    graph.addEdge(edge.from, edge.to, Number(edge.weight) || 5, edge.accessibility || "walk");
  }

  return graph;
}