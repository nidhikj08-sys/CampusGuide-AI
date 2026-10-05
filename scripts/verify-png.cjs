const fs = require("fs");

function decodePNG(buffer) {
  const offset = 8;
  let width, height, colorType, channels;
  let idat = null;
  let pos = offset;
  while (pos < buffer.length) {
    const len = buffer.readUInt32BE(pos);
    const type = buffer.slice(pos + 4, pos + 8).toString("ascii");
    const data = buffer.slice(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      width = buffer.readUInt32BE(pos + 8);
      height = buffer.readUInt32BE(pos + 12);
      colorType = buffer[pos + 17];
      channels = 6 === colorType ? 4 : 3;
      console.log(`  IHDR w=${width} h=${height} bitDepth=${buffer[pos+12]} colorType=${colorType} compression=${buffer[pos+14]} filter=${buffer[pos+15]} interlace=${buffer[pos+16]}`);
    }
    if (type === "IDAT") idat = data;
    pos += 12 + len;
  }
  const { inflateRawSync } = require("zlib");
  const raw = inflateRawSync(idat);
  return { width, height, raw, channels };
}

const files = ["ground-floor.png", "first-floor.png", "second-floor.png"];
for (const f of files) {
  const p = `public/floorplans/${f}`;
  if (!fs.existsSync(p)) { console.log(`${f} MISSING`); continue; }
  const buf = fs.readFileSync(p);
  const { width, height, raw, channels } = decodePNG(buf);
  console.log(`  ${f} size=${raw.length} expected=${width*height*channels}`);
  const px = (x, y) => {
    const i = (y * width + x) * channels;
    return [raw[i], raw[i + 1], raw[i + 2]];
  };
  const room1 = px(100, 151);
  const room2 = px(221, 151);
  const corridor = px(281, 241);
  const stairs = px(100, 231);
  const lift = px(460, 231);
  const outside = px(530, 241);
  console.log(`${f} (${width}x${height}) room1=${JSON.stringify(room1)} room2=${JSON.stringify(room2)} corridor=${JSON.stringify(corridor)} stairs=${JSON.stringify(stairs)} lift=${JSON.stringify(lift)} outside=${JSON.stringify(outside)}`);
}
