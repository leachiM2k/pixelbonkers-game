// PNG-ASSET-MANIFEST (GFX-AGENT pflegt PNG_SPRITE_KEYS, generiert zusammen mit den Dateien).
// BootScene laedt je Key public/assets/sprites/<key>.png; geladene Keys ueberschreiben
// die Matrix-Fallbacks. PNG-Texturen liegen in finaler Anzeigegroesse vor (display scale 1),
// Matrix-Fallbacks laufen mit Scale 2. LINEAR-Filter nur fuer PNG-Texturen.
export const PNG_SPRITE_KEYS: string[] = [];

// Nach dem Boot: Keys, die tatsaechlich als PNG geladen wurden.
export const pngLoadedKeys = new Set<string>();

export function isPngKey(key: string): boolean {
  return pngLoadedKeys.has(key);
}
