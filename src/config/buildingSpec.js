/**
 * Building specification — single source of truth for the reference building.
 *
 * All geometry in the app (SVG floor plans, navigation graph nodes, QR print
 * sizes) derives from the values here. Change a dimension once and the floor
 * plans, routing coordinates and print scale all follow.
 *
 * COORDINATE SYSTEM
 *   Blueprint space is a top-left origin SVG user-space grid.
 *   PX_PER_METER converts blueprint units to real-world metres so the plan is
 *   roughly to scale. 1 metre === PX_PER_METER blueprint units.
 */

export const PX_PER_METER = 15;

/** Outer footprint of the main block, in blueprint units. */
export const BUILDING = {
  name: "KVG College of Engineering — Main Block",
  campus: "Sullia, Karnataka",
  floors: 3,
  viewBox: { x: 0, y: 0, width: 560, height: 480 },
  widthMeters: 560 / PX_PER_METER,
  depthMeters: 480 / PX_PER_METER,
};

/** Physical dimensions per floor. Kept uniform for the reference block. */
export const FLOOR_SPECS = {
  1: { id: 1, label: "Ground Floor", heightMeters: 4.2, hasEntrance: true },
  2: { id: 2, label: "First Floor", heightMeters: 3.6, hasEntrance: false },
  3: { id: 3, label: "Second Floor", heightMeters: 3.6, hasEntrance: false },
};

/**
 * Vertical circulation cores. Every floor references the same core IDs, which
 * is what makes stair/elevator routing work: the graph links f1↔f2↔f3 through
 * these IDs.
 */
export const VERTICAL_CORES = {
  stairs: {
    key: "stairs",
    label: "Stairs",
    icon: "stairs",
    // Wheelchair users must not be routed through stairs.
    wheelchairAccessible: false,
  },
  elevator: {
    key: "elevator",
    label: "Elevator",
    icon: "lift",
    wheelchairAccessible: true,
  },
};

/**
 * QR code print specification.
 *
 * PRINT_DPI is the target output resolution. Pixels = mm / 25.4 * DPI.
 * Error correction "Q" is used for physical signage because stickers get
 * scuffed, dusty and partially covered — "M" loses too much contrast before a
 * code becomes unreadable.
 */
export const QR_PRINT_SPEC = {
  PRINT_DPI: 300,
  errorCorrectionLevel: "Q",
  marginModules: 4, // quiet zone; required by spec, do not reduce below 4
  formats: ["png", "svg"],
  color: { dark: "#0f172a", light: "#ffffff" },

  /**
   * Standard signage sizes. `widthMm` is the printed edge length of the code
   * itself (quiet zone included in the generated image).
   */
  sizes: {
    door_sticker: {
      key: "door_sticker",
      label: "Door Sticker",
      widthMm: 100,
      note: "Standard laminated sticker beside each classroom door.",
    },
    compact: {
      key: "compact",
      label: "Compact Tag",
      widthMm: 60,
      note: "Small tags for lift panels, stair rails and temporary signage.",
    },
    poster: {
      key: "poster",
      label: "A4 Poster",
      widthMm: 180,
      note: "A4 portrait poster for lobbies and corridor ends.",
    },
  },
};

/** Convert a printed width in millimetres to pixel dimensions at print DPI. */
export function mmToPixels(mm, dpi = QR_PRINT_SPEC.PRINT_DPI) {
  return Math.round((mm / 25.4) * dpi);
}

/** Convert blueprint units to metres. */
export function unitsToMeters(units) {
  return units / PX_PER_METER;
}

/** Convert metres to blueprint units. */
export function metersToUnits(meters) {
  return meters * PX_PER_METER;
}

/** Minimum scannable printed size per QR error-correction level (ISO/IEC 18004). */
export const MIN_PRINT_MM = {
  L: 19,
  M: 21,
  Q: 25,
  H: 29,
};

/**
 * Warn when a chosen print size would produce a code too small to scan
 * reliably for its error-correction level.
 */
export function validatePrintSize(widthMm, errorCorrectionLevel = QR_PRINT_SPEC.errorCorrectionLevel) {
  const min = MIN_PRINT_MM[errorCorrectionLevel] ?? MIN_PRINT_MM.Q;
  if (widthMm < min) {
    return {
      ok: false,
      min,
      message: `${widthMm}mm is below the ${min}mm minimum for error correction "${errorCorrectionLevel}". Use a larger size or lower the correction level.`,
    };
  }
  return { ok: true, min };
}