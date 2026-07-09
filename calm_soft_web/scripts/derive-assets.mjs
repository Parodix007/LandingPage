import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// portable: resolve from this script's location (<repo>/scripts) so cwd doesn't matter.
// the logo pack lives one level above the repo root: <repo>/../logo_calm_soft/logo
const scriptDir = dirname(fileURLToPath(import.meta.url));
const LOGO = resolve(scriptDir, "../../logo_calm_soft/logo");
await mkdir("public", { recursive: true });

const avatar = `${LOGO}/calmsoft-avatar-green-1024.png`;
await sharp(avatar).resize(32, 32).png({ compressionLevel: 9 }).toFile("public/favicon-32.png");
await sharp(avatar).resize(48, 48).png({ compressionLevel: 9 }).toFile("public/favicon-48.png");
await sharp(avatar).resize(180, 180).png({ compressionLevel: 9 }).toFile("public/apple-touch-icon.png");
await sharp(avatar).resize(512, 512).png({ compressionLevel: 9 }).toFile("public/icon-512.png");

// OG 1200x630: czarne tło + wycentrowane poziome logo (SPEC §12.2)
const logoWide = await sharp(`${LOGO}/calmsoft-logo-green-dark-1600x400.png`)
  .resize({ width: 900 })
  .toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 4, background: "#000000" } })
  .composite([{ input: logoWide, gravity: "center" }])
  .png({ compressionLevel: 9 })
  .toFile("public/og.png");
console.log("Assets done: favicon-32/48, apple-touch-icon, icon-512, og.png");
