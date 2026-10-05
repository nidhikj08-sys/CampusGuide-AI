/**
 * Generate placeholder floor-plan images (top-down blueprint style) for each floor.
 * These serve as textures for the 3D building view until you add your real photos.
 *
 * Replace with real photos at:
 *   public/floorplans/ground-floor.png   (or .jpg)
 *   public/floorplans/first-floor.png
 *   public/floorplans/second-floor.png
 *
 * Usage: npm run build:placeholders
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { deflateRawSync } from "node:zlib";
import path from "node:path";

const ROOT = process.cwd();
const outDir = path.join(ROOT, "public", "floorplans");
mkdirSync(outDir, { recursive: true });

// CRC32 table
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  const crcSrc = Buffer.concat([typeBuf, data]);
  crc.writeUInt32BE(crc32(crcSrc), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function pngFromRGBA(width, height, data) {
  const raw = Buffer.from(data);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // color type 6 = RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const idat = makeChunk("IDAT", deflateRawSync(raw));
  const iend = makeChunk("IEND", Buffer.alloc(0));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    makeChunk("IHDR", ihdrData),
    idat,
    iend,
  ]);
}

// Pixel helper
function r(g, b, a) {
  return { r, g, b, a };
}

// Canvas draw
function drawFloor(label, floorNum, hasEntrance) {
  const W = 560, H = 480;
  const data = new Uint8Array(W * H * 4);

  const BG = [255, 255, 255];      // white outside
  const GRID = [238, 247, 252];    // #eef3fc
  const GRIDL = [226, 232, 240];   // #e2e8f0
  const ROOM = [239, 246, 255];    // #eff6ff
  const SHELL = [15, 23, 42];      // #0f172a
  const CORE = [254, 243, 199];    // #fef3c7
  const LIFT = [237, 233, 254];    // #ede9fe
  const ENTR = [220, 252, 231];    // #dcfce7

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let px = GRID.slice();
      let a = 255;

      if (x < 20 || x > 539 || y < 20 || y > 479) px = BG.slice();
      else if (x % 15 === 0 || y % 15 === 0) px = GRIDL.slice();
      else if (x >= 240 && x <= 320 && y >= 150 && y <= 340) px = [226, 232, 240]; // central corridor
      else if (y >= 260 && y <= 300 && x >= 60 && x <= 240) px = [226, 232, 240]; // west arm
      else if (y >= 150 && y <= 190 && x >= 320 && x <= 500) px = [226, 232, 240]; // east arm
      else if (x >= 55 && x <= 145 && y >= 212 && y <= 256) px = CORE.slice(); // stairs
      else if (x >= 415 && x <= 505 && y >= 212 && y <= 268) px = LIFT.slice(); // elevator
      else if (hasEntrance && x >= 30 && x <= 180 && y >= 415 && y <= 460) px = ENTR.slice(); // entrance

      // rooms: 8 rooms, 4 per side
      const colGroup = x <= 200 ? 0 : 1;
      let roomCol = -1;
      if (colGroup === 0) roomCol = Math.floor((x - 45) / 120);
      else roomCol = Math.floor((x - 165) / 120);

      if (roomCol >= 0 && roomCol < 4) {
        const ry = y < 230 ? 100 : 360;
        if (x >= (colGroup === 0 ? 45 : 165) + roomCol * 120 &&
            x <= (colGroup === 0 ? 155 : 275) + roomCol * 120 &&
            y >= ry && y <= ry + 90) px = ROOM.slice();
      }

      const i = (y * W + x) * 4;
      data[i] = px[0];
      data[i + 1] = px[1];
      data[i + 2] = px[2];
      data[i + 3] = a;
    }
  }

  return pngFromRGBA(W, H, data);
}

const config = [
  { floor: 1, name: "ground-floor", label: "Ground Floor", entrance: true },
  { floor: 2, name: "first-floor", label: "First Floor", entrance: false },
  { floor: 3, name: "second-floor", label: "Second Floor", entrance: false },
];

for (const c of config) {
  const img = drawFloor(c.label, c.floor, c.entrance);
  const p = path.join(outDir, `${c.name}.png`);
  writeFileSync(p, img);
  console.log(`Generated ${p} (${img.length} bytes)`);
}
