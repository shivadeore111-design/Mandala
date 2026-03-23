const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let crc = i;
    for (let j = 0; j < 8; j += 1) {
      crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
    }
    table[i] = crc;
  }
  return table;
}

const CRC_TABLE = makeCrcTable();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ 0xffffffff;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])) >>> 0, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function createPNG(width, height, red, green, blue) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 2;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const row = Buffer.alloc(1 + width * 3);
  row[0] = 0;
  for (let x = 0; x < width; x += 1) {
    row[1 + x * 3] = red;
    row[2 + x * 3] = green;
    row[3 + x * 3] = blue;
  }

  const rows = [];
  for (let y = 0; y < height; y += 1) {
    rows.push(row);
  }
  const rawData = Buffer.concat(rows);
  const compressedData = zlib.deflateSync(rawData);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdrData),
    chunk('IDAT', compressedData),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const imagesDir = path.join(__dirname, '..', 'assets', 'images');
fs.mkdirSync(imagesDir, { recursive: true });

fs.writeFileSync(path.join(imagesDir, 'icon.png'), createPNG(1024, 1024, 255, 107, 53));
fs.writeFileSync(path.join(imagesDir, 'adaptive-icon.png'), createPNG(1024, 1024, 255, 107, 53));
fs.writeFileSync(path.join(imagesDir, 'splash.png'), createPNG(2048, 2048, 15, 15, 26));
fs.writeFileSync(path.join(imagesDir, 'favicon.png'), createPNG(48, 48, 255, 107, 53));

console.log('✅ Assets generated successfully');
