const LOCAL_KEY = "campusguide_scan_logs";

export function getLocalScanLogs() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalScanLogs(logs) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(logs));
  } catch (err) {
    console.error("Scan log save error:", err);
  }
}

export async function recordScan({ nodeId, nodeLabel, routeFrom, routeTo, accessibilityUsed }) {
  const logs = getLocalScanLogs();
  const entry = {
    id: `scan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    nodeId,
    nodeLabel,
    routeFrom: routeFrom || null,
    routeTo: routeTo || null,
    accessibilityUsed: !!accessibilityUsed,
    timestamp: new Date().toISOString(),
  };
  logs.unshift(entry);
  if (logs.length > 500) logs.length = 500;
  saveLocalScanLogs(logs);
  return entry;
}

export async function getScanStats() {
  const logs = getLocalScanLogs();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  
  const todayLogs = logs.filter((l) => l.timestamp >= today);
  const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const weekLogs = logs.filter((l) => l.timestamp >= last7);

  const nodeCounts = {};
  const routeCounts = {};
  logs.forEach((l) => {
    nodeCounts[l.nodeId] = (nodeCounts[l.nodeId] || 0) + 1;
    if (l.routeFrom && l.routeTo) {
      const key = `${l.routeFrom}→${l.routeTo}`;
      routeCounts[key] = (routeCounts[key] || 0) + 1;
    }
  });

  const topNodes = Object.entries(nodeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([nodeId, count]) => ({ nodeId, count }));

  const topRoutes = Object.entries(routeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([route, count]) => ({ route, count }));

  return {
    totalScans: logs.length,
    todayScans: todayLogs.length,
    weekScans: weekLogs.length,
    topNodes,
    topRoutes,
    accessibilityUsed: logs.filter((l) => l.accessibilityUsed).length,
  };
}
