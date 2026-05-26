#!/usr/bin/env node
'use strict';
const fs   = require('fs');
const zlib = require('zlib');
const path = require('path');

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf  = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length);
  const crcBuf  = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

// "A" lettermark on a 9×7 grid
const GLYPH = [
  '   AAA   ',
  '  A   A  ',
  ' A     A ',
  'AAAAAAAAA',
  'A       A',
  'A       A',
  'A       A',
];

function makeIcon(size) {
  const BG = [0x0a, 0x0c, 0x10, 0xff];
  const FG = [0x4f, 0xc3, 0xf7, 0xff];

  const gH = GLYPH.length, gW = GLYPH[0].length;
  const scale = Math.max(1, Math.floor(size * 0.72 / Math.max(gW, gH)));
  const drawW = gW * scale, drawH = gH * scale;
  const ox = Math.floor((size - drawW) / 2);
  const oy = Math.floor((size - drawH) / 2);

  const pixels = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    pixels[i*4] = BG[0]; pixels[i*4+1] = BG[1];
    pixels[i*4+2] = BG[2]; pixels[i*4+3] = BG[3];
  }

  for (let gy = 0; gy < gH; gy++) {
    for (let gx = 0; gx < gW; gx++) {
      if (GLYPH[gy][gx] !== 'A') continue;
      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
          const x = ox + gx * scale + sx;
          const y = oy + gy * scale + sy;
          if (x < 0 || x >= size || y < 0 || y >= size) continue;
          const idx = (y * size + x) * 4;
          pixels[idx] = FG[0]; pixels[idx+1] = FG[1];
          pixels[idx+2] = FG[2]; pixels[idx+3] = FG[3];
        }
      }
    }
  }

  // Raw PNG data: 1 filter byte + RGBA per row
  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 4)] = 0; // None filter
    pixels.copy(raw, y * (1 + size * 4) + 1, y * size * 4, (y + 1) * size * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA

  return Buffer.concat([
    PNG_SIG,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

const dir = path.join(__dirname, 'icons');
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

for (const size of [16, 48, 128]) {
  const png = makeIcon(size);
  fs.writeFileSync(path.join(dir, `icon-${size}.png`), png);
  console.log(`✓ icon-${size}.png  (${png.length} bytes)`);
}
