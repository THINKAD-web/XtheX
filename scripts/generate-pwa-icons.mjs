import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const publicDir = join(root, "public");
const iconsDir = join(publicDir, "icons");

const ORANGE = { r: 0xf9, g: 0x73, b: 0x16, alpha: 1 };

const svgIcon = (size) => `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.15)}" fill="#f97316"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="bold" font-size="${Math.round(size * 0.55)}" fill="white">X</text>
</svg>`;

async function renderPng(size, outPath) {
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: ORANGE,
    },
  })
    .composite([
      {
        input: Buffer.from(svgIcon(size)),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toFile(outPath);
}

await mkdir(iconsDir, { recursive: true });

await renderPng(512, join(iconsDir, "icon-512x512.png"));
await renderPng(192, join(iconsDir, "icon-192x192.png"));
await renderPng(180, join(publicDir, "apple-touch-icon.png"));
await renderPng(32, join(publicDir, "favicon-32x32.png"));

console.log("PWA icons written:", {
  icons512: join("public/icons", "icon-512x512.png"),
  icons192: join("public/icons", "icon-192x192.png"),
  apple: "public/apple-touch-icon.png",
  favicon: "public/favicon-32x32.png",
});
