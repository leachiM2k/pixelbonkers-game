// VERTRAG: arenaSprites(): PixelSprite[] (Keys laut Textur-Konvention in src/types.ts).
// Park-Arena: Himmel mit Stadt-Silhouetten, Wolken, Baum, Bank, Mülleimer, Laterne, Deko.
import { PixelSprite } from '../art/pixelToTexture';

const SKY_W = 384;
const SKY_H = 216;
const SKYLINE = 25;

const BACK_BUILDINGS: Array<[number, number, number]> = [
  [0, 30, 16], [38, 26, 20], [70, 34, 12], [110, 28, 18], [146, 36, 14],
  [188, 26, 22], [220, 32, 12], [258, 28, 16], [292, 34, 20], [332, 26, 14],
  [364, 20, 18],
];

const FRONT_BUILDINGS: Array<[number, number, number]> = [
  [10, 22, 9], [44, 18, 13], [86, 26, 8], [124, 20, 12], [168, 24, 7],
  [204, 18, 11], [244, 26, 14], [286, 20, 9], [320, 24, 12], [356, 16, 8],
];

function buildSky(): string[] {
  const rows: string[] = [];
  for (let y = 0; y < SKY_H; y++) {
    const line: string[] = new Array<string>(SKY_W).fill('l');
    const sy = y - (SKY_H - SKYLINE);
    if (sy >= 0) {
      for (const [bx, bw, bh] of BACK_BUILDINGS) {
        for (let x = bx; x < bx + bw && x < SKY_W; x++) {
          if (sy >= SKYLINE - Math.min(bh, SKYLINE)) line[x] = 'x';
        }
      }
      for (const [bx, bw, bh] of FRONT_BUILDINGS) {
        for (let x = bx; x < bx + bw && x < SKY_W; x++) {
          if (sy >= SKYLINE - Math.min(bh, SKYLINE)) line[x] = 'X';
        }
      }
    }
    rows.push(line.join(''));
  }
  return rows;
}

function buildTree(): string[] {
  const W = 36;
  const H = 48;
  const rows: string[] = [];
  for (let y = 0; y < 32; y++) {
    const t = (y - 15.5) / 16.5;
    const half = 16 * Math.sqrt(Math.max(0, 1 - t * t));
    const line: string[] = new Array<string>(W).fill('.');
    for (let x = 0; x < W; x++) {
      const dx = x - 17.5;
      if (Math.abs(dx) > half) continue;
      const noise = (x * 7 + y * 13) % 11;
      const shade = y > 20 && noise < 4;
      const dark = noise < 2 || (y > 24 && noise < 5);
      line[x] = shade || dark ? 'G' : 'g';
    }
    rows.push(line.join(''));
  }
  for (let y = 32; y < H; y++) {
    const line: string[] = new Array<string>(W).fill('.');
    const wide = y >= H - 3;
    const left = wide ? 13 : 15;
    const right = wide ? 22 : 20;
    for (let x = left; x <= right; x++) {
      line[x] = x === left || x === right ? 'k' : (x > 18 ? 'M' : 'm');
    }
    rows.push(line.join(''));
  }
  return rows;
}

function buildHouse(): string[] {
  const W = 40;
  const H = 34;
  const rows: string[] = [];
  for (let y = 0; y < 12; y++) {
    const line: string[] = new Array<string>(W).fill('.');
    const half = 3 + y * 1.5;
    for (let x = 0; x < W; x++) {
      const dx = Math.abs(x - 19.5);
      if (dx > half) continue;
      const edge = dx > half - 1.5 || y === 0;
      line[x] = edge ? 'k' : 'M';
    }
    rows.push(line.join(''));
  }
  for (let y = 12; y < H; y++) {
    const line: string[] = new Array<string>(W).fill('.');
    for (let x = 1; x < W - 1; x++) {
      const window =
        (x >= 7 && x <= 12 && y >= 15 && y <= 20) ||
        (x >= 27 && x <= 32 && y >= 15 && y <= 20);
      const frame =
        (x >= 6 && x <= 13 && (y === 14 || y === 21)) ||
        (x >= 26 && x <= 33 && (y === 14 || y === 21)) ||
        ((x === 6 || x === 13) && y >= 14 && y <= 21) ||
        ((x === 26 || x === 33) && y >= 14 && y <= 21);
      const door = x >= 17 && x <= 22 && y >= 26;
      const knob = x === 21 && y === 30;
      if (y === H - 1) line[x] = 'k';
      else if (door) line[x] = x === 17 || x === 22 ? 'M' : 'm';
      else if (knob) line[x] = 'y';
      else if (frame) line[x] = 'k';
      else if (window) line[x] = 'y';
      else if (x === 1 || x === W - 2) line[x] = 'k';
      else line[x] = (x * 5 + y * 3) % 9 < 2 ? 'X' : 'x';
    }
    rows.push(line.join(''));
  }
  return rows;
}

function buildPath(): string[] {
  const W = 48;
  const rows: string[] = [];
  for (let y = 0; y < 8; y++) {
    const line: string[] = new Array<string>(W).fill('X');
    for (let x = 0; x < W; x++) {
      if (y === 0) line[x] = (x * 3) % 7 < 3 ? 'x' : 'X';
      else if (y === 7) line[x] = 'k';
      else line[x] = (x * 7 + y * 5) % 13 < 4 ? 'x' : 'X';
    }
    rows.push(line.join(''));
  }
  return rows;
}

const CLOUD_0 = [
  '......wwww..........',
  '....wwwwwww.wwww....',
  '..wwwwwwwwwwwwwww...',
  'wwwwwwwwwwwwwwwwww..',
  '.wwwwwwwwwwwwwww....',
  '...wwwwwwwwwww......',
];

const CLOUD_1 = [
  '....wwww....',
  '..wwwwwwww..',
  'wwwwwwwwwwww',
  '.wwwwwwwwww.',
];

const CLOUD_2 = [
  '.........wwwwww.........',
  '.....wwwwwwwwwww.wwww...',
  '...wwwwwwwwwwwwwwwwwww..',
  '.wwwwwwwwwwwwwwwwwwwwww.',
  'wwwwwwwwwwwwwwwwwwwwwww.',
  '..wwwwwwwwwwwwwwwwwww...',
  '.....wwwwwwwwwwwww......',
];

const BUSH = [
  '...gggggg....',
  '..ggGggGgg...',
  '.ggggGggggg..',
  'ggGggggggGgg.',
  'gGggggGgggGgg',
  '.ggggGgggggg.',
  '..GggggggG...',
  '...kkkkkk....',
];

const BENCH = [
  '.kmmmmmmmmmmmmmmmmmmmmmmk.',
  '.kMkMkMkMkMkMkMkMkMkMkMk.',
  '.kMkMkMkMkMkMkMkMkMkMkMk.',
  'kmmmmmmmmmmmmmmmmmmmmmmmmk',
  'kmMMMMMMMMMMMMMMMMMMMMMMk',
  '..kMk..............kMk...',
  '..kMk..............kMk...',
  '..kMk..............kMk...',
  '..kMk..............kMk...',
  '..kMk..............kMk...',
  '..kMk..............kMk...',
  '.kkMkk............kkMkk..',
];

const TRASHCAN = [
  '.kkkkkkkkkk.',
  'kxxxxxxxxxxk',
  'kkkkkkkkkkkk',
  '.kxxxxxxxxk.',
  '.kXXXXXXXXk.',
  '.kxxxxxxxxk.',
  '.kXXXXXXXXk.',
  '.kxxxxxxxxk.',
  '.kXXXXXXXXk.',
  '.kxxxxxxxxk.',
  '.kXXXXXXXXk.',
  '.kxxxxxxxxk.',
  '.kXXXXXXXXk.',
  '.kkkkkkkkkk.',
];

function buildLamp(): string[] {
  const rows: string[] = [
    '...kkkkkkk....',
    '...kxxxxxk....',
    '...kxyyyyk....',
    '...kkyyykk....',
    '....kkkkk.....',
  ];
  for (let y = 0; y < 31; y++) rows.push('......kXk.....');
  rows.push('.....kkXkk....');
  rows.push('....kkXXXkk...');
  return rows;
}

const FLOWER_0 = ['.rrr.', 'rryrr', '.rrr.', '..g..', '.gG..', '..g..'];
const FLOWER_1 = ['.ppp.', 'ppwpp', '.ppp.', '..g..', '..g..', '.gG..'];

const BIRD_0 = ['...w..', '..www.', '.kccc.', '..c...'];
const BIRD_1 = ['......', '.kccc.', '.cwww.', '..w...'];

const LEAF = ['.G..', 'GGG.', '.GG.'];

const GRASS_0 = ['..g..', '.g.g.', 'g.g.g', 'gGgGg'];
const GRASS_1 = ['...g.', '..g.g', '.g.g.', 'ggGgg'];
const GRASS_2 = ['..g..', '..g..', '.g.g.', '.gGgG'];

export function arenaSprites(): PixelSprite[] {
  return [
    { key: 'arena_sky', rows: buildSky() },
    { key: 'arena_cloud_0', rows: CLOUD_0 },
    { key: 'arena_cloud_1', rows: CLOUD_1 },
    { key: 'arena_cloud_2', rows: CLOUD_2 },
    { key: 'arena_tree', rows: buildTree() },
    { key: 'arena_bush', rows: BUSH },
    { key: 'arena_bench', rows: BENCH },
    { key: 'arena_trashcan', rows: TRASHCAN },
    { key: 'arena_lamp', rows: buildLamp() },
    { key: 'arena_flower_0', rows: FLOWER_0 },
    { key: 'arena_flower_1', rows: FLOWER_1 },
    { key: 'arena_bird_0', rows: BIRD_0 },
    { key: 'arena_bird_1', rows: BIRD_1 },
    { key: 'arena_leaf', rows: LEAF },
    { key: 'arena_house', rows: buildHouse() },
    { key: 'arena_grass_0', rows: GRASS_0 },
    { key: 'arena_grass_1', rows: GRASS_1 },
    { key: 'arena_grass_2', rows: GRASS_2 },
    { key: 'arena_path', rows: buildPath() },
  ];
}
