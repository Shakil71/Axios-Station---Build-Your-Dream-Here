// One-off asset script: cut the AX mark from the brand logo and turn the black background transparent.
import sharp from "sharp";
const src = "public/images/brand/axios-station-logo.jpg";
const region = { left: 700, top: 650, width: 670, height: 350 };
const { data, info } = await sharp(src).extract(region).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += 4) {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  const m = Math.max(r, g, b);
  let a = m < 24 ? 0 : Math.min(255, Math.round(((m - 24) / (255 - 24)) * 255 * 1.6));
  if (a > 0) {
    const k = 255 / Math.max(m, 1);
    data[i] = Math.min(255, Math.round(r * k * 0.95));
    data[i + 1] = Math.min(255, Math.round(g * k * 0.95));
    data[i + 2] = Math.min(255, Math.round(b * k));
  }
  data[i + 3] = a;
}
const img = sharp(data, { raw: info }).trim({ threshold: 1 });
const buf = await img.png().toBuffer();
await sharp(buf).resize({ width: 512 }).png().toFile("public/images/brand/axios-mark.png");
const meta = await sharp(buf).metadata();
const size = Math.max(meta.width, meta.height);
const square = await sharp(buf)
  .extend({ top: Math.floor((size - meta.height) / 2), bottom: Math.ceil((size - meta.height) / 2), left: Math.floor((size - meta.width) / 2), right: Math.ceil((size - meta.width) / 2), background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: "#070a14" } })
  .composite([{ input: await sharp(square).resize(400, 400).toBuffer(), gravity: "center" }])
  .png().toFile("app/icon.png");
await sharp({ create: { width: 180, height: 180, channels: 4, background: "#070a14" } })
  .composite([{ input: await sharp(square).resize(140, 140).toBuffer(), gravity: "center" }])
  .png().toFile("app/apple-icon.png");
console.log("mark", meta.width, meta.height);
