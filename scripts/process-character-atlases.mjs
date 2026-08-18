import fs from "node:fs/promises";
import path from "node:path";
import sharp from "../node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js";

const projectRoot = path.resolve(import.meta.dirname, "..");
const atlasRoot = path.join(projectRoot, "public", "game-assets", "characters-v2", "atlases");
const outputRoot = path.join(projectRoot, "public", "game-assets", "characters-v2");

const sheets = [
  {
    file: "jobs-01.png",
    columns: 3,
    rows: 3,
    jobs: [
      ["MINER", "LUMBERJACK", "PORTER"],
      ["BUILDER", "FARMER", "BLACKSMITH"],
      ["MASON", "CARPENTER", "ENGINEER"],
    ],
  },
  {
    file: "jobs-02.png",
    columns: 3,
    rows: 3,
    jobs: [
      ["COOK", "BAKER", "BREWER"],
      ["FISHER", "MERCHANT", "TAILOR"],
      ["GARDENER", "HEALER", "MINSTREL"],
    ],
  },
  {
    file: "jobs-03.png",
    columns: 3,
    rows: 2,
    jobs: [
      ["PRIEST", "SCHOLAR", "HUNTER"],
      ["POTTER", "INNKEEPER", null],
    ],
  },
  {
    file: "jobs-04.png",
    columns: 3,
    rows: 3,
    jobs: [
      ["SOLDIER", "SPEARMAN", "ARCHER"],
      ["SCOUT", "KNIGHT", "GUARD"],
      ["SLINGER", "AXEMAN", "CROSSBOW"],
    ],
  },
  {
    file: "jobs-05.png",
    columns: 2,
    rows: 2,
    jobs: [
      ["CAPTAIN", "SHIELDER"],
      ["BANNER", "DRUMMER"],
    ],
  },
];

const alphaThreshold = 18;
const componentMinimumArea = 120;
const padding = 8;

function isBackdropPixel(data, index, channels) {
  const offset = index * channels;
  const red = data[offset];
  const green = data[offset + 1];
  const blue = data[offset + 2];
  const brightest = Math.max(red, green, blue);
  const darkest = Math.min(red, green, blue);
  return darkest >= 205 && brightest - darkest <= 26;
}

async function normalizeAtlasAlpha(inputPath) {
  const parsed = path.parse(inputPath);
  const destination = path.join(parsed.dir, `${parsed.name}-alpha.png`);
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const visited = new Uint8Array(info.width * info.height);
  const queue = new Int32Array(info.width * info.height);
  let head = 0;
  let tail = 0;
  const enqueue = (index) => {
    if (visited[index] || !isBackdropPixel(data, index, info.channels)) return;
    visited[index] = 1;
    queue[tail++] = index;
  };
  for (let x = 0; x < info.width; x += 1) {
    enqueue(x);
    enqueue((info.height - 1) * info.width + x);
  }
  for (let y = 1; y < info.height - 1; y += 1) {
    enqueue(y * info.width);
    enqueue(y * info.width + info.width - 1);
  }
  while (head < tail) {
    const current = queue[head++];
    data[current * info.channels + 3] = 0;
    const x = current % info.width;
    const y = Math.floor(current / info.width);
    if (x > 0) enqueue(current - 1);
    if (x + 1 < info.width) enqueue(current + 1);
    if (y > 0) enqueue(current - info.width);
    if (y + 1 < info.height) enqueue(current + info.width);
  }
  await sharp(data, { raw: info }).png({ compressionLevel: 9, palette: false }).toFile(destination);
  return destination;
}

function findComponents(data, width, height, channels) {
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  const components = [];
  const alphaAt = (index) => data[index * channels + 3];

  for (let index = 0; index < width * height; index += 1) {
    if (visited[index] || alphaAt(index) <= alphaThreshold) continue;
    let head = 0;
    let tail = 0;
    let area = 0;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    queue[tail++] = index;
    visited[index] = 1;

    while (head < tail) {
      const current = queue[head++];
      const x = current % width;
      const y = Math.floor(current / width);
      area += 1;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      const neighbors = [current - 1, current + 1, current - width, current + width];
      for (let direction = 0; direction < neighbors.length; direction += 1) {
        const next = neighbors[direction];
        if (next < 0 || next >= width * height || visited[next]) continue;
        const nx = next % width;
        const ny = Math.floor(next / width);
        if (Math.abs(nx - x) + Math.abs(ny - y) !== 1 || alphaAt(next) <= alphaThreshold) continue;
        visited[next] = 1;
        queue[tail++] = next;
      }
    }

    if (area >= componentMinimumArea) {
      components.push({ area, minX, minY, maxX, maxY, centerX: (minX + maxX) / 2, centerY: (minY + maxY) / 2 });
    }
  }
  return components.sort((a, b) => b.area - a.area);
}

function paddedBounds(component, cellWidth, cellHeight) {
  const left = Math.max(0, component.minX - padding);
  const top = Math.max(0, component.minY - padding);
  const right = Math.min(cellWidth, component.maxX + padding + 1);
  const bottom = Math.min(cellHeight, component.maxY + padding + 1);
  return { left, top, width: right - left, height: bottom - top };
}

async function writeComponent(inputPath, cell, component, destination) {
  const local = paddedBounds(component, cell.width, cell.height);
  await sharp(inputPath)
    .extract({ left: cell.left + local.left, top: cell.top + local.top, width: local.width, height: local.height })
    .png({ compressionLevel: 9, palette: false })
    .toFile(destination);
  return local;
}

async function auditPng(filePath) {
  const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let transparent = 0;
  let partial = 0;
  let opaque = 0;
  let borderAlpha = 0;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * info.channels + 3];
      if (alpha === 0) transparent += 1;
      else if (alpha === 255) opaque += 1;
      else partial += 1;
      if ((x === 0 || y === 0 || x === info.width - 1 || y === info.height - 1) && alpha > 0) borderAlpha += 1;
    }
  }
  return { width: info.width, height: info.height, transparent, partial, opaque, borderAlpha };
}

await fs.mkdir(outputRoot, { recursive: true });
const manifest = {};
const qa = [];

for (const sheet of sheets) {
  const sourcePath = path.join(atlasRoot, sheet.file);
  const inputPath = await normalizeAtlasAlpha(sourcePath);
  const metadata = await sharp(inputPath).metadata();
  if (!metadata.width || !metadata.height || !metadata.hasAlpha) throw new Error(`${sheet.file}: transparent alpha normalization failed`);
  const fullImage = { left: 0, top: 0, width: metadata.width, height: metadata.height };
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const components = findComponents(data, info.width, info.height, info.channels);
  const expectedBodies = sheet.columns * sheet.rows;
  if (components.length < expectedBodies * 3) throw new Error(`${sheet.file}: expected ${expectedBodies * 3} body/foot components, found ${components.length}`);
  const largestBodies = components.slice(0, expectedBodies).sort((a, b) => a.centerY - b.centerY);
  const bodyRows = Array.from({ length: sheet.rows }, (_, row) => largestBodies
    .slice(row * sheet.columns, (row + 1) * sheet.columns)
    .sort((a, b) => a.centerX - b.centerX));
  const bodySet = new Set(largestBodies);

  for (let row = 0; row < sheet.rows; row += 1) {
    for (let column = 0; column < sheet.columns; column += 1) {
      const jobId = sheet.jobs[row]?.[column] ?? null;
      if (!jobId) continue;
      const body = bodyRows[row][column];
      const bodyWidth = body.maxX - body.minX + 1;
      const bodyHeight = body.maxY - body.minY + 1;
      const feet = components
        .filter((component) => !bodySet.has(component))
        .filter((component) => {
          const width = component.maxX - component.minX + 1;
          const height = component.maxY - component.minY + 1;
          const aspect = width / height;
          return component.centerY > body.maxY
            && component.centerY < body.maxY + bodyHeight * 0.7
            && component.centerX > body.minX - bodyWidth * 0.15
            && component.centerX < body.maxX + bodyWidth * 0.15
            && width < bodyWidth * 0.45
            && height < bodyHeight * 0.4
            && aspect > 0.5
            && aspect < 3.6;
        })
        .sort((a, b) => a.centerY - b.centerY)
        .slice(0, 2)
        .sort((a, b) => a.centerX - b.centerX);
      if (feet.length !== 2) throw new Error(`${jobId}: two separate feet were not found`);

      const jobRoot = path.join(outputRoot, jobId.toLowerCase());
      await fs.mkdir(jobRoot, { recursive: true });
      const bodyPath = path.join(jobRoot, "body.png");
      const leftFootPath = path.join(jobRoot, "left-foot.png");
      const rightFootPath = path.join(jobRoot, "right-foot.png");
      await writeComponent(inputPath, fullImage, body, bodyPath);
      await writeComponent(inputPath, fullImage, feet[0], leftFootPath);
      await writeComponent(inputPath, fullImage, feet[1], rightFootPath);

      const bodyAudit = await auditPng(bodyPath);
      const leftAudit = await auditPng(leftFootPath);
      const rightAudit = await auditPng(rightFootPath);
      if (bodyAudit.borderAlpha || leftAudit.borderAlpha || rightAudit.borderAlpha) throw new Error(`${jobId}: non-transparent pixels touch an asset border`);
      manifest[jobId] = {
        body: `/game-assets/characters-v2/${jobId.toLowerCase()}/body.png`,
        leftFoot: `/game-assets/characters-v2/${jobId.toLowerCase()}/left-foot.png`,
        rightFoot: `/game-assets/characters-v2/${jobId.toLowerCase()}/right-foot.png`,
      };
      qa.push({ jobId, components: components.length, body: bodyAudit, leftFoot: leftAudit, rightFoot: rightAudit });
    }
  }
}

if (Object.keys(manifest).length !== 36) throw new Error(`Expected 36 production jobs, got ${Object.keys(manifest).length}`);
await fs.writeFile(path.join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
await fs.writeFile(path.join(outputRoot, "alpha-audit.json"), `${JSON.stringify({ jobs: qa.length, passed: qa.every((item) => item.body.borderAlpha === 0 && item.leftFoot.borderAlpha === 0 && item.rightFoot.borderAlpha === 0), assets: qa }, null, 2)}\n`, "utf8");
console.log(`Generated ${qa.length * 3} transparent rig assets for ${qa.length} jobs.`);
