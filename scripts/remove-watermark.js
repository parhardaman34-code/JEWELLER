const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const framesDir = path.join(__dirname, '..', 'assets', 'frames');
  const frame1Path = path.join(framesDir, 'ezgif-frame-001.jpg');
  
  if (!fs.existsSync(frame1Path)) {
    console.error('Frame 1 not found at', frame1Path);
    process.exit(1);
  }

  console.log('Extracting watermark mask from Frame 1...');
  const PATCH_LEFT = 1125;
  const PATCH_TOP = 550;
  const PATCH_WIDTH = 70;
  const PATCH_HEIGHT = 85;

  const f1Patch = await sharp(frame1Path)
    .extract({ left: PATCH_LEFT, top: PATCH_TOP, width: PATCH_WIDTH, height: PATCH_HEIGHT })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const W = PATCH_WIDTH;
  const H = PATCH_HEIGHT;

  // Mask: 1 where star exists (f1 brightness > 3), dilated by 2px
  const mask = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const val = (f1Patch.data[i*3] + f1Patch.data[i*3+1] + f1Patch.data[i*3+2]) / 3;
    if (val > 3) mask[i] = 1;
  }

  const dilated = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (mask[y * W + x]) {
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const ny = y + dy, nx = x + dx;
            if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
              dilated[ny * W + nx] = 1;
            }
          }
        }
      }
    }
  }

  // Pre-calculate boundary pixels
  const borderPixels = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!dilated[y * W + x]) {
        borderPixels.push(y * W + x);
      }
    }
  }

  function inpaint(rawBuffer) {
    const img = Buffer.from(rawBuffer);
    
    // Average border initialization
    let rSum = 0, gSum = 0, bSum = 0;
    for (let i = 0; i < borderPixels.length; i++) {
      const idx = borderPixels[i] * 3;
      rSum += img[idx];
      gSum += img[idx+1];
      bSum += img[idx+2];
    }
    const rInit = borderPixels.length ? rSum / borderPixels.length : 0;
    const gInit = borderPixels.length ? gSum / borderPixels.length : 0;
    const bInit = borderPixels.length ? bSum / borderPixels.length : 0;

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (dilated[y * W + x]) {
          const idx = (y * W + x) * 3;
          img[idx] = rInit;
          img[idx+1] = gInit;
          img[idx+2] = bInit;
        }
      }
    }

    // Gauss-Seidel harmonic relaxation
    for (let iter = 0; iter < 120; iter++) {
      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          if (dilated[y * W + x]) {
            const idx = (y * W + x) * 3;
            for (let c = 0; c < 3; c++) {
              const top = img[((y - 1) * W + x) * 3 + c];
              const bottom = img[((y + 1) * W + x) * 3 + c];
              const left = img[(y * W + (x - 1)) * 3 + c];
              const right = img[(y * W + (x + 1)) * 3 + c];
              img[idx + c] = Math.round((top + bottom + left + right) * 0.25);
            }
          }
        }
      }
    }
    return img;
  }

  const files = fs.readdirSync(framesDir)
    .filter(f => /^ezgif-frame-\d{3}\.jpg$/i.test(f))
    .sort();

  console.log(`Processing ${files.length} frames...`);
  sharp.cache(false);
  const startTime = Date.now();

  const BATCH_SIZE = 10;
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async file => {
      const filePath = path.join(framesDir, file);
      const inputBuffer = fs.readFileSync(filePath);
      
      // Extract patch
      const patch = await sharp(inputBuffer)
        .extract({ left: PATCH_LEFT, top: PATCH_TOP, width: PATCH_WIDTH, height: PATCH_HEIGHT })
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Inpaint
      const cleanedPatch = inpaint(patch.data);

      // Composite back and save in-place
      const outputBuffer = await sharp(inputBuffer)
        .composite([{
          input: cleanedPatch,
          raw: { width: PATCH_WIDTH, height: PATCH_HEIGHT, channels: 3 },
          left: PATCH_LEFT,
          top: PATCH_TOP
        }])
        .jpeg({ quality: 88 })
        .toBuffer();

      fs.writeFileSync(filePath, outputBuffer);
    }));

    const progress = Math.min(100, Math.round(((i + batch.length) / files.length) * 100));
    process.stdout.write(`\rProgress: ${progress}% (${i + batch.length}/${files.length} frames)`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nDone! All ${files.length} frames processed in ${elapsed}s.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
