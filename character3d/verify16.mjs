import { PNG } from 'pngjs';
import { readFileSync, readdirSync } from 'node:fs';
import { getCharacter } from './characters.js';
const PREFIX = (process.argv[2] ?? 'teen') === 'teen' ? 'teen' : getCharacter(process.argv[2]).prefix;
for (const f of readdirSync('output/16bit').filter(n => n.startsWith(PREFIX + '_')).sort()) {
  const png = PNG.sync.read(readFileSync('output/16bit/' + f));
  let minX = 1e9, maxX = -1, minY = 1e9, maxY = -1;
  for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
    if (png.data[(y * png.width + x) * 4 + 3] >= 128) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  const feetOk = ['jump_1','fall_0','ko_1','victory_1','run_1','run_3'].some(p => f.includes(p)) ? 'Luft' : (maxY >= 95 && maxY <= 97 ? 'Boden ok' : `BODEN ${maxY}`);
  console.log(f.padEnd(22), `x ${minX}..${maxX} y ${minY}..${maxY}`, feetOk);
}
