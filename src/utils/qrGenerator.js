export async function generateQRForLocation(locationId, label, baseUrl = window.location.origin) {
  const url = `${baseUrl}/student/map?from=${locationId}`;
  
  try {
    const QRCode = (await import("qrcode")).default;
    const dataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: {
        dark: "#1e293b",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    });
    
    return {
      url,
      dataUrl,
      label,
      locationId,
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error("QR generation failed:", err);
    return null;
  }
}

export async function generateAllQRCodes(graph, baseUrl = window.location.origin) {
  const qrCodes = [];
  const locations = Array.from(graph.nodes.values()).filter((n) => n.isRoom || n.label.includes("Stairs") || n.label.includes("Elevator") || n.label.includes("Entrance"));
  
  for (const loc of locations) {
    const qr = await generateQRForLocation(loc.id, loc.label, baseUrl);
    if (qr) qrCodes.push(qr);
  }
  
  return qrCodes;
}
