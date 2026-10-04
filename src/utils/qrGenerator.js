import {
  QR_PRINT_SPEC,
  mmToPixels,
  validatePrintSize,
} from "../config/buildingSpec";

/**
 * Build the deep link a QR code points at. Kept in one place so printed codes
 * and in-app links can never drift apart.
 */
export function buildLocationUrl(locationId, baseUrl = window.location.origin) {
  return `${baseUrl}/student/map?from=${encodeURIComponent(locationId)}`;
}

/**
 * Generate a print-ready QR code for one location.
 *
 * @param {string} locationId  Node id, e.g. "r_204".
 * @param {string} label       Human label printed under the code.
 * @param {object} [options]
 * @param {string} [options.baseUrl]
 * @param {string} [options.sizeKey]      Key from QR_PRINT_SPEC.sizes.
 * @param {number} [options.widthMm]      Explicit width; overrides sizeKey.
 * @param {"png"|"svg"} [options.format]
 * @returns {Promise<object|null>} Metadata + `dataUrl` (png) or `svg` string.
 */
export async function generateQRForLocation(locationId, label, options = {}) {
  const {
    baseUrl = window.location.origin,
    sizeKey = "door_sticker",
    format = "png",
  } = options;

  const sizeDef = QR_PRINT_SPEC.sizes[sizeKey];
  const widthMm = options.widthMm ?? sizeDef?.widthMm ?? 100;

  const validation = validatePrintSize(widthMm);
  if (!validation.ok) {
    console.warn(`[qr] ${locationId}: ${validation.message}`);
  }

  const url = buildLocationUrl(locationId, baseUrl);
  const pixelWidth = mmToPixels(widthMm);

  try {
    const QRCode = (await import("qrcode")).default;

    const shared = {
      // `scale` is ignored by the library, but width in px is honoured and is
      // what actually controls raster output size.
      margin: QR_PRINT_SPEC.marginModules,
      errorCorrectionLevel: QR_PRINT_SPEC.errorCorrectionLevel,
      color: QR_PRINT_SPEC.color,
    };

    if (format === "svg") {
      const svg = await QRCode.toString(url, { ...shared, type: "svg" });
      return {
        url,
        svg,
        label,
        locationId,
        widthMm,
        pixelWidth,
        sizeKey,
        format,
        validation,
        generatedAt: new Date().toISOString(),
      };
    }

    const dataUrl = await QRCode.toDataURL(url, { ...shared, width: pixelWidth });
    return {
      url,
      dataUrl,
      label,
      locationId,
      widthMm,
      pixelWidth,
      sizeKey,
      format,
      validation,
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error("QR generation failed:", err);
    return null;
  }
}

/** Node types that should get a printed code. */
const QR_ELIGIBLE_TYPES = new Set([
  "classroom",
  "lab",
  "office",
  "seminar hall",
  "staff room",
  "stairs",
  "elevator",
  "entrance",
]);

export function isQrEligible(node) {
  return QR_ELIGIBLE_TYPES.has(node?.type);
}

/**
 * Generate codes for every eligible node in a graph.
 * Accepts either a CampusGraph instance or a plain { nodes, edges } object.
 */
export async function generateAllQRCodes(graph, options = {}) {
  const nodes =
    graph instanceof Map
      ? Array.from(graph.nodes.values())
      : Array.isArray(graph?.nodes)
        ? graph.nodes
        : [];

  const eligible = nodes.filter(isQrEligible);
  const results = [];

  // Sequential on purpose: the qrcode bundle is lazily imported once and large
  // batches in parallel cause visible jank on low-end phones.
  for (const node of eligible) {
    const qr = await generateQRForLocation(node.id, node.label, options);
    if (qr) results.push(qr);
  }

  return results;
}

/**
 * Render codes into a print-ready HTML document at true physical size.
 * Each sticker is sized in millimetres via CSS `mm` units, so the browser
 * prints at real dimensions instead of a scaled bitmap.
 */
export function buildPrintSheet(qrCodes, { sizeKey = "door_sticker", title = "CampusGuide QR Codes" } = {}) {
  const sizeDef = QR_PRINT_SPEC.sizes[sizeKey];
  const widthMm = sizeDef?.widthMm ?? 100;
  const validation = validatePrintSize(widthMm);

  const cells = qrCodes
    .map(
      (qr) => `
      <figure class="sticker">
        ${qr.dataUrl ? `<img src="${qr.dataUrl}" alt="QR code for ${escapeHtml(qr.label)}" />` : ""}
        <figcaption>
          <strong>${escapeHtml(qr.label)}</strong>
          <span>${escapeHtml(qr.locationId)} &middot; Floor ${escapeHtml(String(qr.floor ?? ""))}</span>
        </figcaption>
      </figure>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  @page { margin: 10mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    color: #0f172a;
  }
  h1 { font-size: 14pt; margin: 0 0 2mm; }
  .meta { font-size: 8pt; color: #64748b; margin: 0 0 6mm; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5mm; }
  .sticker {
    margin: 0;
    padding: 4mm;
    border: 0.3mm dashed #cbd5e1;
    border-radius: 3mm;
    text-align: center;
    break-inside: avoid;
  }
  .sticker img { width: ${widthMm}mm; height: ${widthMm}mm; display: block; margin: 0 auto 2mm; image-rendering: pixelated; }
  figcaption strong { display: block; font-size: 9pt; }
  figcaption span { display: block; font-size: 7pt; color: #64748b; margin-top: 0.5mm; }
  .warn { padding: 3mm; margin-bottom: 5mm; background: #fef2f2; border: 0.3mm solid #fecaca; border-radius: 2mm; font-size: 8pt; color: #b91c1c; }
</style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="meta">${widthMm}mm square &middot; error correction "${QR_PRINT_SPEC.errorCorrectionLevel}" &middot; ${QR_PRINT_SPEC.PRINT_DPI} DPI source &middot; ${qrCodes.length} codes</p>
  ${validation.ok ? "" : `<p class="warn">${escapeHtml(validation.message)}</p>`}
  <div class="grid">${cells}</div>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Open the print sheet in a new window and trigger the browser print dialog. */
export function openPrintSheet(qrCodes, options = {}) {
  const html = buildPrintSheet(qrCodes, options);
  const win = window.open("", "_blank");
  if (!win) {
    console.warn("[qr] Pop-up blocked; cannot open print sheet.");
    return false;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  return true;
}