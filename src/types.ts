// ============================================================
// GEMEINSAME TYPEN & KONTRAKTE für alle Subsysteme.
// NICHT ändern, ohne den Orchestrator zu informieren.
// ============================================================

export const GAME_WIDTH = 384;
export const GAME_HEIGHT = 216;

/** Interne Auflösung: 384x216 (16:9). Alle Positionen/Werte darauf beziehen. */
export const GRAVITY = 1300; // px/s^2 im internen Koordinatensystem

export type WeaponId =
  | 'plunger'
  | 'rubberChicken'
  | 'banana'
  | 'pillow'
  | 'toiletBrush'
  | 'fryingPan'
  | 'rubberBoot'
  | 'rubberDuck'
  | 'hammer';

export type WeaponType = 'melee' | 'projectile' | 'trap';

/** Datengetriebene Waffen-Definition (Spezifikation Abschnitt 32). */
export interface WeaponDefinition {
  id: WeaponId;
  /** Anzeigename (deutsch, humorvoll) */
  name: string;
  /** Comic-Text beim Treffer, z.B. 'BONK!' */
  hitWord: string;
  damage: number;
  knockback: number;
  /** Sekunden zwischen Nahkampf-Schlägen mit dieser Waffe */
  attackSpeed: number;
  range: number;
  cooldown: number;
  type: WeaponType;
  projectileSpeed?: number;
  projectileGravity?: number;
  /** true = prallt vom Boden ab (Gummihuhn) */
  bounces?: boolean;
  /** true = bleibt als Falle liegen (Banane) */
  isTrap?: boolean;
  /** Besonderes Verhalten, von WeaponSystem interpretiert */
  behavior?: 'boomerang' | 'squeak' | 'slippery' | 'heavyKnockback' | 'explosive' | 'wobbly';
}

export const WEAPONS: Record<WeaponId, WeaponDefinition> = {
  plunger: {
    id: 'plunger', name: 'POEMPEL', hitWord: 'BONK!',
    damage: 12, knockback: 260, attackSpeed: 0.55, range: 16, cooldown: 0.5,
    type: 'melee', projectileSpeed: 170, projectileGravity: 500, behavior: 'boomerang',
  },
  rubberChicken: {
    id: 'rubberChicken', name: 'GUMMIHUHN', hitWord: 'SQUEAK!',
    damage: 10, knockback: 180, attackSpeed: 0.4, range: 15, cooldown: 0.4,
    type: 'melee', projectileSpeed: 200, projectileGravity: 700, bounces: true, behavior: 'squeak',
  },
  banana: {
    id: 'banana', name: 'BANANE', hitWord: 'PLOP!',
    damage: 0, knockback: 0, attackSpeed: 0.5, range: 12, cooldown: 0.3,
    type: 'trap', projectileSpeed: 190, projectileGravity: 800, isTrap: true, behavior: 'slippery',
  },
  pillow: {
    id: 'pillow', name: 'KISSEN', hitWord: 'WHACK!',
    damage: 14, knockback: 340, attackSpeed: 0.8, range: 14, cooldown: 0.6,
    type: 'melee', projectileSpeed: 120, projectileGravity: 300, behavior: 'heavyKnockback',
  },
  toiletBrush: {
    id: 'toiletBrush', name: 'KLOBUERSTE', hitWord: 'SMACK!',
    damage: 6, knockback: 90, attackSpeed: 0.25, range: 13, cooldown: 0.25,
    type: 'melee', projectileSpeed: 220, projectileGravity: 600,
  },
  fryingPan: {
    id: 'fryingPan', name: 'BRATPFANNE', hitWord: 'POW!',
    damage: 22, knockback: 300, attackSpeed: 1.1, range: 16, cooldown: 0.9,
    type: 'melee', projectileSpeed: 150, projectileGravity: 800,
  },
  rubberBoot: {
    id: 'rubberBoot', name: 'GUMMISTIEFEL', hitWord: 'BOINK!',
    damage: 13, knockback: 200, attackSpeed: 0.5, range: 13, cooldown: 0.4,
    type: 'projectile', projectileSpeed: 180, projectileGravity: 400, behavior: 'wobbly',
  },
  rubberDuck: {
    id: 'rubberDuck', name: 'QUIETSCHENTE', hitWord: 'SQUEAK!',
    damage: 16, knockback: 220, attackSpeed: 0.6, range: 12, cooldown: 0.5,
    type: 'projectile', projectileSpeed: 210, projectileGravity: 600, behavior: 'explosive',
  },
  hammer: {
    id: 'hammer', name: 'VORSDAHD-HAMMA', hitWord: 'WHACK!',
    damage: 26, knockback: 380, attackSpeed: 1.2, range: 18, cooldown: 1.0,
    type: 'melee', projectileSpeed: 110, projectileGravity: 900, behavior: 'heavyKnockback',
  },
};

export const WEAPON_IDS: WeaponId[] = Object.keys(WEAPONS) as WeaponId[];

// ------------------------------------------------------------
// TEXTUR-KEY-KONVENTIONEN (alle Sprites folgen diesem Muster)
// ------------------------------------------------------------
// Charaktere (48px hoch): 'boy1_idle_0', 'boy1_walk_0..3', 'boy1_run_0..3',
//   'boy1_jump_0', 'boy1_jump_1', 'boy1_fall_0', 'boy1_duck_0',
//   'boy1_attack_0..3', 'boy1_throw_0..2', 'boy1_hit_0', 'boy1_hit_1',
//   'boy1_ko_0', 'boy1_victory_0', 'boy1_victory_1'
//   boy2 analog mit eigenen Shirt-/Schuh-Farben.
// Waffen (16x16): 'wpn_<weaponId>' z.B. 'wpn_plunger'
// Waffen-Flug (rotiert per code, gleiche Textur)
// HUD: 'hud_panel' (Komplett-Panel), 'hud_heart', 'hud_heart_empty' (Overlay-Zustaende)
// Font: 'font_<CHAR>' für A-Z, 0-9, '!', '?', ':', '.', '-', '>', '(' , ')', '/', ' ' (Leerzeichen als 1px breite Textur)
// Arena: 'arena_sky'(384x216), 'arena_cloud_0..2', 'arena_tree', 'arena_bush', 'arena_bench',
//   'arena_trashcan', 'arena_lamp', 'arena_flower', 'arena_bird_0','arena_bird_1', 'arena_leaf',
//   'arena_house', 'arena_path', 'arena_grass'
// FX: 'fx_star', 'fx_spark_0', 'fx_spark_1', 'fx_flash'

export interface PlayerSkin {
  prefix: 'boy1' | 'boy2';
  shirt: string;      // Palette-Zeichen
  shirtShadow: string;
  sneaker: string;
}

export const PLAYER1_SKIN: PlayerSkin = { prefix: 'boy1', shirt: 'b', shirtShadow: 'B', sneaker: 'r' };
export const PLAYER2_SKIN: PlayerSkin = { prefix: 'boy2', shirt: 'c', shirtShadow: 'C', sneaker: 'n' };

// ------------------------------------------------------------
// EVENTS (EventEmitter des BattleScene, bus: scene.events)
// ------------------------------------------------------------
export const EV = {
  PLAYER_DAMAGE: 'player-damage',       // (playerIdx: 0|1, hp: number)
  PLAYER_KO: 'player-ko',               // (playerIdx: 0|1)
  WEAPON_PICKUP: 'weapon-pickup',       // (playerIdx: 0|1, weapon: WeaponId)
  WEAPON_THROW: 'weapon-throw',         // (playerIdx: 0|1, weapon: WeaponId)
  WEAPON_LANDED: 'weapon-landed',       // (weapon: WeaponId, x, y)
  HIT_LANDED: 'hit-landed',             // (x, y, power: number, hitWord: string)
  KO: 'ko',                             // ()
  ROUND_END: 'round-end',               // (winnerIdx: 0|1|-1) -1 = time-out unentschieden
  PAUSE_TOGGLED: 'pause-toggled',       // (paused: boolean)
} as const;

// ------------------------------------------------------------
// SETTINGS (global, persistiert in localStorage)
// ------------------------------------------------------------
export interface GameSettings {
  sound: boolean;
  music: boolean;
  screenShake: boolean;
  /** false = Nahkampfangriffe deaktiviert (nur Werfen) */
  melee: boolean;
}
export const DEFAULT_SETTINGS: GameSettings = { sound: true, music: true, screenShake: true, melee: true };
