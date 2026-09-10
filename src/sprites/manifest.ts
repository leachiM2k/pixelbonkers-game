// PNG-ASSET-MANIFEST (GFX-AGENT pflegt PNG_SPRITE_KEYS, generiert zusammen mit den Dateien).
// BootScene laedt je Key public/assets/sprites/<key>.png; geladene Keys ueberschreiben
// die Matrix-Fallbacks. PNG-Texturen liegen in finaler Anzeigegroesse vor (display scale 1),
// Matrix-Fallbacks laufen mit Scale 2. LINEAR-Filter nur fuer PNG-Texturen.
// Arena-Deko + HUD: PNGs in Matrix-Mass (Anzeige via hud.ts scale 1 / deco() scale 2).
export const PNG_SPRITE_KEYS: string[] = [
  "arena_sky",
  "menu_title",
  "arena_bench", "arena_bush", "arena_flower_0", "arena_flower_1",
  "arena_grass_0", "arena_grass_1", "arena_grass_2", "arena_house", "arena_lamp",
  "arena_trashcan", "arena_tree", "arena_platform", "boy1_attack_0", "boy1_attack_1",
  "boy1_attack_2", "boy1_attack_3", "boy1_duck_0", "boy1_fall_0",
  "boy1_hit_0", "boy1_hit_1", "boy1_idle_0", "boy1_idle_1",
  "boy1_jump_0", "boy1_jump_1", "boy1_ko_0", "boy1_ko_1",
  "boy1_ko_2", "boy1_run_0", "boy1_run_1", "boy1_run_2",
  "boy1_run_3", "boy1_throw_0", "boy1_throw_1", "boy1_throw_2",
  "boy1_victory_0", "boy1_victory_1", "boy1_walk_0", "boy1_walk_1",
  "boy1_walk_2", "boy1_walk_3", "boy2_attack_0", "boy2_attack_1",
  "boy2_attack_2", "boy2_attack_3", "boy2_duck_0", "boy2_fall_0",
  "boy2_hit_0", "boy2_hit_1", "boy2_idle_0", "boy2_idle_1",
  "boy2_jump_0", "boy2_jump_1", "boy2_ko_0", "boy2_ko_1",
  "boy2_ko_2", "boy2_run_0", "boy2_run_1", "boy2_run_2",
  "boy2_run_3", "boy2_throw_0", "boy2_throw_1", "boy2_throw_2",
  "boy2_victory_0", "boy2_victory_1", "boy2_walk_0", "boy2_walk_1",
  "boy2_walk_2", "boy2_walk_3",   "font_charset", "hud_heart", "hud_heart_empty", "hud_player1", "hud_player2", "hud_vs",
  "wpn_banana",
  "wpn_fryingPan", "wpn_pillow", "wpn_plunger", "wpn_rubberBoot",
  "wpnp_plunger", "wpnp_rubberChicken", "wpnp_banana", "wpnp_pillow",
  "wpnp_toiletBrush", "wpnp_fryingPan", "wpnp_rubberDuck",
  "hit_bonk", "hit_pow", "hit_squeak", "hit_cloud",
  "hit_explosion", "hit_particle", "hit_stars",
  "wpn_rubberChicken", "wpn_rubberDuck", "wpn_toiletBrush",
];

// Nach dem Boot: Keys, die tatsaechlich als PNG geladen wurden.
export const pngLoadedKeys = new Set<string>();

export function isPngKey(key: string): boolean {
  return pngLoadedKeys.has(key);
}
