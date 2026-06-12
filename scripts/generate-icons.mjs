// Rasterize the RoaVa SVG marks into PWA/maskable/apple PNGs.
// Run: pnpm icons   (after `pnpm add -D sharp`)
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");
const app = join(root, "app");

async function render(svgPath, outPath, size) {
  const svg = await readFile(svgPath);
  await sharp(svg, { density: 384 })
    .resize(size, size, { fit: "contain" })
    .png()
    .toFile(outPath);
  console.log(`✓ ${outPath.replace(root + "/", "")} (${size}×${size})`);
}

const squircle = join(pub, "icon.svg");
const maskable = join(pub, "icon-maskable.svg");

await render(squircle, join(pub, "icon-192.png"), 192);
await render(squircle, join(pub, "icon-512.png"), 512);
await render(maskable, join(pub, "icon-maskable-192.png"), 192);
await render(maskable, join(pub, "icon-maskable-512.png"), 512);
// Apple touch icon — opaque, no transparency, served from app/.
await render(squircle, join(app, "apple-icon.png"), 180);

console.log("done");
