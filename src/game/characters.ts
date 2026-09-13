// CHARAKTER-KLASSEN: Stat-Selektion pro Spieler vor dem Kampf.
// Sprites bleiben boy1/boy2 - die Klasse aendert nur die Werte:
//   speed     : Faktor auf MOVE_SPEED
//   jump      : Faktor auf JUMP_VELOCITY
//   kbTaken   : Faktor auf erlittenen Knockback (<1 = schwerer wegzuschubsen)
// Auswahl persistiert in localStorage ('pb-chars').

export interface CharClass {
  name: string;
  speed: number;
  jump: number;
  kbTaken: number;
}

export const CHAR_CLASSES: readonly CharClass[] = [
  { name: 'ALLROUNDER', speed: 1.0, jump: 1.0, kbTaken: 1.0 },
  { name: 'SPEEDY', speed: 1.25, jump: 1.0, kbTaken: 1.15 },
  { name: 'TANK', speed: 0.8, jump: 0.95, kbTaken: 0.65 },
  { name: 'JUMPER', speed: 0.95, jump: 1.25, kbTaken: 1.05 },
];

const KEY = 'pb-chars';
let sel: [number, number] = [0, 0];

try {
  const raw = typeof window !== 'undefined' ? window.localStorage.getItem(KEY) : null;
  if (raw) {
    const parsed = JSON.parse(raw) as [number, number];
    if (Array.isArray(parsed) && parsed.length === 2 && parsed.every((v) => Number.isInteger(v) && v >= 0 && v < CHAR_CLASSES.length)) {
      sel = [parsed[0], parsed[1]];
    }
  }
} catch {
  // ignorieren: Default-Selektion
}

export function getCharClass(idx: 0 | 1): CharClass {
  return CHAR_CLASSES[sel[idx]] ?? CHAR_CLASSES[0];
}

/** Textur-Praefix der Klasse je Spieler (ALLROUNDER = klassische Boys) */
export function classSkinPrefix(clsName: string, playerIdx: 0 | 1): string {
  const variant = playerIdx === 0 ? '1' : '2';
  switch (clsName) {
    case 'SPEEDY':
      return 'spd' + variant;
    case 'TANK':
      return 'tnk' + variant;
    case 'JUMPER':
      return 'jmp' + variant;
    default:
      return 'boy' + variant;
  }
}

export function getCharSel(idx: 0 | 1): number {
  return sel[idx];
}

export function setCharSel(idx: 0 | 1, i: number): void {
  sel[idx] = ((i % CHAR_CLASSES.length) + CHAR_CLASSES.length) % CHAR_CLASSES.length;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(sel));
  } catch {
    // Persistenz optional
  }
}
