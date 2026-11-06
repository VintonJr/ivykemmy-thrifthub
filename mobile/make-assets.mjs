// Builds the app icon and splash sources in assets/ from the shop logo.
// Run `node make-assets.mjs && npm run icons` after the logo changes.
import sharp from "sharp";

const LOGO = "../public/icon-512.png";
const LILAC = "#FAF4FB";
const PLUM = "#4A0B4C";

async function logo(size) {
  return sharp(LOGO).resize(size, size, { kernel: "lanczos3" }).png().toBuffer();
}

function blank(size, background) {
  const bg = background ? hex(background) : { r: 0, g: 0, b: 0, alpha: 0 };
  return sharp({ create: { width: size, height: size, channels: 4, background: bg } });
}

async function canvas(size, background, logoSize, file) {
  await blank(size, background)
    .composite([{ input: await logo(logoSize), gravity: "center" }])
    .png()
    .toFile(file);
}

function hex(h) {
  const n = parseInt(h.slice(1), 16);
  return { r: n >> 16, g: (n >> 8) & 255, b: n & 255, alpha: 1 };
}

// Full icon (iOS, legacy Android): logo on lilac, a little margin round the gold ring.
await canvas(1024, LILAC, 900, "assets/icon-only.png");
// Android adaptive icon: logo sized for the inset Capacitor adds, so launchers can crop to any shape.
await canvas(1024, null, 860, "assets/icon-foreground.png");
await blank(1024, LILAC).png().toFile("assets/icon-background.png");
// Splash screens.
await canvas(2732, LILAC, 900, "assets/splash.png");
await canvas(2732, PLUM, 900, "assets/splash-dark.png");
console.log("assets written");
