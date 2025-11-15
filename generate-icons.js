#!/usr/bin/env node

/**
 * Generate Extension Icons
 * Creates 16x16, 48x48, and 128x128 PNG icons
 * Run with: node generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Create canvas-like drawing for Node.js
function createIconPNG(size) {
  // For now, create a simple colored square as placeholder
  // This creates a minimal valid PNG

  const width = size;
  const height = size;

  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk (image header)
  const ihdr = createChunk('IHDR', Buffer.concat([
    Buffer.from([
      (width >> 24) & 0xff, (width >> 16) & 0xff, (width >> 8) & 0xff, width & 0xff,
      (height >> 24) & 0xff, (height >> 16) & 0xff, (height >> 8) & 0xff, height & 0xff,
      8, // bit depth
      2, // color type (RGB)
      0, // compression
      0, // filter
      0  // interlace
    ])
  ]));

  // Create image data (simple gradient)
  const imageData = [];
  for (let y = 0; y < height; y++) {
    imageData.push(0); // filter type
    for (let x = 0; x < width; x++) {
      // Create purple gradient for target icon
      const centerX = width / 2;
      const centerY = height / 2;
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));
      const ratio = distance / maxDistance;

      // Purple gradient (#667eea to #764ba2)
      const r = Math.floor(102 + ratio * (118 - 102));
      const g = Math.floor(126 + ratio * (75 - 126));
      const b = Math.floor(234 + ratio * (162 - 234));

      imageData.push(r, g, b);
    }
  }

  // Compress image data (simplified - just use raw for now)
  const idat = createChunk('IDAT', zlibDeflate(Buffer.from(imageData)));

  // IEND chunk (end of image)
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = calculateCRC(Buffer.concat([typeBuffer, data]));
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function calculateCRC(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    crc = crcTable[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ 0xffffffff;
}

// CRC table
const crcTable = (() => {
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function zlibDeflate(data) {
  // Simplified: use Node.js zlib
  const zlib = require('zlib');
  return zlib.deflateSync(data);
}

// Generate icons
console.log('🎨 Generating extension icons...\n');

const sizes = [16, 48, 128];
const iconsDir = path.join(__dirname, 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

sizes.forEach(size => {
  const filename = `icon${size}.png`;
  const filepath = path.join(iconsDir, filename);

  console.log(`Creating ${filename}...`);
  const png = createIconPNG(size);
  fs.writeFileSync(filepath, png);
  console.log(`✓ Created ${filename} (${png.length} bytes)`);
});

console.log('\n✨ All icons generated successfully!');
console.log('\nNext steps:');
console.log('1. Go to chrome://extensions/');
console.log('2. Enable "Developer mode"');
console.log('3. Click "Load unpacked"');
console.log('4. Select this directory');
console.log('\nEnjoy your Lead Generator Pro extension! 🎯');
