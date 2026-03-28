/**
 * Generates public/og-image.png (1200x630) using Node canvas.
 * Run: npx tsx scripts/generate-og-image.ts
 */
import { createCanvas } from "canvas";
import { writeFileSync } from "fs";
import { resolve } from "path";

const W = 1200;
const H = 630;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext("2d");

// Background gradient
const grad = ctx.createLinearGradient(0, 0, W, H);
grad.addColorStop(0, "#18181b");
grad.addColorStop(1, "#27272a");
ctx.fillStyle = grad;
ctx.fillRect(0, 0, W, H);

// Orange accent bar
ctx.fillStyle = "#ea580c";
ctx.fillRect(0, 0, W, 6);

// Title
ctx.fillStyle = "#ffffff";
ctx.font = "bold 72px sans-serif";
ctx.textAlign = "center";
ctx.fillText("XtheX", W / 2, 260);

// Subtitle
ctx.fillStyle = "#a1a1aa";
ctx.font = "32px sans-serif";
ctx.fillText("Global Outdoor Ad Marketplace", W / 2, 330);

// Tagline
ctx.fillStyle = "#f97316";
ctx.font = "24px sans-serif";
ctx.fillText("AI-powered media matching across 50+ countries", W / 2, 400);

// Bottom bar
ctx.fillStyle = "#ea580c";
ctx.fillRect(0, H - 6, W, 6);

const outPath = resolve(__dirname, "../public/og-image.png");
writeFileSync(outPath, canvas.toBuffer("image/png"));
console.log(`OG image written to ${outPath}`);
