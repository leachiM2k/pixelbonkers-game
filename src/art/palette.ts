// Gemeinsame Retro-Farbpalette für das gesamte Spiel.
// Alle Pixel-Art-Module MÜSSEN diese Palette verwenden (Zeichen -> Farbe),
// damit der Look konsistent bleibt. Eigene Farben nur hier ergänzen.
export const PALETTE: Record<string, string> = {
  // Outline / Ink
  k: '#1a1c2c', // Outline schwarzblau
  K: '#000000',
  // Skin
  s: '#f4c099', // Haut
  S: '#d99a6c', // Haut Schatten
  // Haare dunkel
  h: '#3b2740',
  H: '#241629',
  // P1: dunkelblaues T-Shirt, Jeans, rot/weiße Sneaker
  b: '#3068a8', // P1 Shirt
  B: '#1e4470', // P1 Shirt Schatten
  j: '#3a5a9e', // Jeans
  J: '#28407a', // Jeans Schatten
  r: '#d94040', // Sneaker rot
  w: '#f2f0e5', // Weiß
  // P2: blaues T-Shirt, blaue Sneaker
  c: '#4aa0d8', // P2 Shirt
  C: '#2f6e9e', // P2 Shirt Schatten
  n: '#5ad0e8', // P2 Sneaker hellblau
  // Gelb / Orange
  y: '#f8d848', // Gelb
  Y: '#d8a028', // Gelb Schatten
  o: '#f07828', // Orange
  O: '#b04818', // Orange dunkel
  // Grün (Arena / Gummistiefel)
  g: '#48a838', // Grün
  G: '#2f7024', // Grün dunkel
  // Braun (Holz, Erde)
  m: '#8a5a30', // Braun
  M: '#5a3820', // Braun dunkel
  // Grau
  x: '#8b8ba5', // Grau hell
  X: '#5a5a72', // Grau dunkel
  // Rot extra
  e: '#e04848', // Pömpelrot
  E: '#a02828', // Pömpelrot dunkel
  // Himmel/Wasser
  l: '#5c94ec', // Hellblau Himmel
  p: '#e8a0b0', // Rosa (Squeak-Text)
  t: '#48e0c0', // Türkis
  // HP-Bar
  q: '#28d84a', // HP grün
  u: '#ffd83a', // HP gelb
  f: '#f84838', // HP rot
  a: '#af6356', // Sheet-Extrakt
  d: '#0750ec', // Sheet-Extrakt
  i: '#0c42b9', // Sheet-Extrakt
  v: '#c0c6ce', // Sheet-Extrakt
  z: '#fa061f', // Sheet-Extrakt
  // Weiß-Transparenz-Kennzeichen wird in der Pipeline behandelt: '.' = transparent
  '.': '',
};

// Palette-Lookup: unbekanntes Zeichen -> Outline-farbe (fail-safe, kein Crash)
export function palColor(ch: string): string {
  const c = PALETTE[ch];
  return c === '' ? '#1a1c2c' : (c ?? '#ff00ff');
}
