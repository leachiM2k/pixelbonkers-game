import { PNG } from 'pngjs';
import { readFileSync, writeFileSync } from 'node:fs';
function upscale(file, scale) {
  const p = PNG.sync.read(readFileSync(file));
  const out = new PNG({ width: p.width * scale, height: p.height * scale });
  for (let y = 0; y < out.height; y++) for (let x = 0; x < out.width; x++) {
    const si = (Math.floor(y / scale) * p.width + Math.floor(x / scale)) * 4;
    const di = (y * out.width + x) * 4;
    out.data[di] = p.data[si]; out.data[di+1] = p.data[si+1];
    out.data[di+2] = p.data[si+2]; out.data[di+3] = p.data[si+3];
  }
  return out;
}
const a = upscale('output/16bit/teen_idle_0.png', 4);
const b = upscale('../public/assets/sprites/boy1_idle_0.png', 4);
const sheet = new PNG({ width: a.width + b.width + 16, height: Math.max(a.height, b.height) });
sheet.data.fill(40);
a.bitblt(sheet, 0, 0, a.width, a.height, 0, 0);
b.bitblt(sheet, 0, 0, b.width, b.height, a.width + 16, 0);
writeFileSync('output/compare_idle.png', PNG.sync.write(sheet));
console.log('ok');
