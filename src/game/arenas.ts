// ARENA-LAYOUTS: Plattform-Geometrie + Deko als Daten. BattleScene baut
// daraus die Arena; die Rotation (arenaForRound) wechselt pro Runde im
// lokalen/CPU-Modus. Netz-Modi bleiben aus Synchronisationsgruenden auf
// Index 0 (Host und Guest muessen dasselbe Layout sehen).
// Koordinaten: Welt 384x216, GROUND_TOP=188, Sprunghoehe ~110px ->
// Plattform-TopY zwischen 130 und 178 bleibt erreichbar.

export interface ArenaPlatform {
  cx: number;
  topY: number;
  w: number;
}

export interface ArenaProp {
  key: string;
  x: number;
}

export interface ArenaLayout {
  name: string;
  platforms: ArenaPlatform[];
  house?: { cx: number; topY: number };
  spawns: [number, number];
  props: ArenaProp[];
}

const CLASSIC: ArenaLayout = {
  name: 'CLASSIC',
  platforms: [
    { cx: 48, topY: 150, w: 70 },
    { cx: 336, topY: 150, w: 70 },
    { cx: 192, topY: 170, w: 44 },
  ],
  house: { cx: 70, topY: 150 },
  spawns: [115, 269],
  props: [
    { key: 'arena_tree', x: 26 },
    { key: 'arena_tree', x: 358 },
    { key: 'arena_bush', x: 80 },
    { key: 'arena_bush', x: 300 },
    { key: 'arena_bench', x: 140 },
    { key: 'arena_trashcan', x: 216 },
    { key: 'arena_lamp', x: 252 },
    { key: 'arena_flower_0', x: 118 },
    { key: 'arena_flower_1', x: 126 },
    { key: 'arena_flower_1', x: 268 },
    { key: 'arena_flower_0', x: 276 },
    { key: 'arena_grass_0', x: 100 },
    { key: 'arena_grass_1', x: 190 },
    { key: 'arena_grass_2', x: 280 },
    { key: 'arena_grass_0', x: 336 },
    { key: 'arena_grass_1', x: 60 },
  ],
};

const TOWER: ArenaLayout = {
  name: 'TOWER',
  platforms: [
    { cx: 192, topY: 132, w: 64 },
    { cx: 56, topY: 162, w: 56 },
    { cx: 328, topY: 162, w: 56 },
  ],
  house: { cx: 192, topY: 132 },
  spawns: [40, 344],
  props: [
    { key: 'arena_tree', x: 16 },
    { key: 'arena_tree', x: 368 },
    { key: 'arena_bush', x: 96 },
    { key: 'arena_bush', x: 288 },
    { key: 'arena_bench', x: 130 },
    { key: 'arena_bench', x: 254 },
    { key: 'arena_trashcan', x: 160 },
    { key: 'arena_trashcan', x: 224 },
    { key: 'arena_lamp', x: 192 },
    { key: 'arena_flower_0', x: 84 },
    { key: 'arena_flower_1', x: 92 },
    { key: 'arena_flower_1', x: 292 },
    { key: 'arena_flower_0', x: 300 },
    { key: 'arena_grass_0', x: 150 },
    { key: 'arena_grass_1', x: 244 },
    { key: 'arena_grass_2', x: 60 },
    { key: 'arena_grass_0', x: 330 },
  ],
};

const CLOSE: ArenaLayout = {
  name: 'CLOSE',
  platforms: [
    { cx: 120, topY: 158, w: 100 },
    { cx: 264, topY: 158, w: 100 },
  ],
  spawns: [115, 269],
  props: [
    { key: 'arena_tree', x: 12 },
    { key: 'arena_tree', x: 372 },
    { key: 'arena_bush', x: 160 },
    { key: 'arena_bush', x: 224 },
    { key: 'arena_bench', x: 60 },
    { key: 'arena_bench', x: 324 },
    { key: 'arena_trashcan', x: 192 },
    { key: 'arena_lamp', x: 40 },
    { key: 'arena_lamp', x: 344 },
    { key: 'arena_flower_0', x: 96 },
    { key: 'arena_flower_1', x: 104 },
    { key: 'arena_flower_1', x: 280 },
    { key: 'arena_flower_0', x: 288 },
    { key: 'arena_grass_0', x: 140 },
    { key: 'arena_grass_1', x: 244 },
    { key: 'arena_grass_2', x: 190 },
  ],
};

export const ARENAS: readonly ArenaLayout[] = [CLASSIC, TOWER, CLOSE];

export function arenaForRound(index: number): ArenaLayout {
  return ARENAS[((index % ARENAS.length) + ARENAS.length) % ARENAS.length];
}
