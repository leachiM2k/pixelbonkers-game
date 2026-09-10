# PIXEL BONKERS - Verträge & Ownership

Interne Auflösung: **384×216**, Gravity 1300. Alle Werte beziehen sich darauf.
Farben: NUR aus `src/art/palette.ts` (Zeichen-Mapping). '.' = transparent.
Pipeline: Sprites als String-Matrizen → `registerPixelSprites` in BootScene → GPU-Texturen.

## Datei-Ownership (nicht fremde Dateien anfassen!)

| Agent | Besitzt |
|-------|---------|
| ART | `src/sprites/*` (boy1, boy2, weapons, arena, hud, font, __preview, index) |
| CORE | `src/systems/input.ts`, `src/entities/Player.ts`, `src/entities/Hitbox.ts` |
| FX/AUDIO | `src/systems/fx.ts` (inkl. `fxSprites()`-Texturen), `src/systems/audio.ts`, `src/systems/music.ts` |
| COMBAT | `src/scenes/BattleScene.ts`, `src/systems/combat.ts`, `src/systems/weapons.ts`, `src/entities/Weapon.ts`, `src/entities/Projectile.ts`, `src/entities/Trap.ts` |
| META | `src/scenes/MainMenuScene.ts`, `src/ui/hud.ts`, `src/ui/PauseMenu.ts`, `src/ui/ControlsScreen.ts` |
| GFX | `public/assets/sprites/*`, `src/sprites/manifest.ts`, `src/sprites/*.data.ts`, `src/sprites/boy*.ts`, `weapons.ts`, `arena.ts`, `hud.ts` (Extraktion v2) |
| NET-CORE | `server/*`, `src/net/*` (ausser `contract.ts`), surgical Patches in `BattleScene.ts` (nur netTick/Guest-Pfad + attachNetSession) |
| NET-UI | `src/scenes/MainMenuScene.ts` (ONLINE-Menü), eigene neue Dateien in `src/ui/` |
| ORCHESTRATOR | `src/types.ts`, `src/art/*`, `src/game/*`, `src/ui/pixelText.ts`, `src/scenes/BootScene.ts`, `src/sprites/{font,index,__preview}.ts`, `src/net/contract.ts`, `src/main.ts`, `package.json`, `tsconfig.json`, `CONTRACTS.md` |

Gemeinsame genutzte Dateien (nur ORCHESTRATOR ändert): `src/types.ts`, `src/art/palette.ts`, `src/art/pixelToTexture.ts`, `src/ui/pixelText.ts`, `src/game/settings.ts`.

Braucht ein Agent eine Erweiterung in types/palette: im finalen Report als "KONTRAKT-WUNSCH" melden, NICHT selbst ändern. Ausnahme: neue eigene Dateien im eigenen Verzeichnis sind immer erlaubt.

## Textur-Key-Konvention (siehe auch src/types.ts Kopfkommentar)

- Charaktere (~24–32px hoch in Welle 2; final 48–96px Skala beachten: Sprites werden x2 dargestellt):
  `boy1_idle_0`, `boy1_walk_0..3`, `boy1_run_0..3`, `boy1_jump_0..1`, `boy1_fall_0`,
  `boy1_duck_0`, `boy1_attack_0..3`, `boy1_throw_0..2`, `boy1_hit_0..1`, `boy1_ko_0..2`,
  `boy1_victory_0..1` — boy2 analog.
- Waffen: `wpn_<weaponId>` (WEAPON_IDS: plunger, rubberChicken, banana, pillow, toiletBrush, fryingPan, rubberBoot, rubberDuck)
- HUD: `hud_portrait_1`, `hud_portrait_2`, `hud_heart`, `hud_heart_empty`, `hud_bar_frame`, `hud_bar_fill`, `hud_vs`
- Font: `font_<A-Z0-9!?:.,-/>()>` (via registerFontTextures, bereits funktional; FONT_GLYPHS in sprites/font.ts)
- Arena: `arena_sky` (384x216 Hintergrund), `arena_cloud_0..2`, `arena_tree`, `arena_bush`, `arena_bench`, `arena_trashcan`, `arena_lamp`, `arena_flower_0..1`, `arena_bird_0..1`, `arena_leaf`, `arena_house`, `arena_grass_0..2`, `arena_path`
- FX: `fx_star`, `fx_spark_0..1`, `fx_flash`, `fx_explosion_0..3`

## Animations-Registrierung

ART legt in `src/sprites/index.ts` zusätzlich `export function buildAnimations(scene: Phaser.Scene): void` an, die Phaser-Anims registriert:
`boy1_idle`, `boy1_walk` (frameRate 8), `boy1_run` (12), `boy1_attack` (nicht loopen), `boy1_hit`, `boy1_victory` (loop), etc. BootScene ruft `buildAnimations` auf (ORCHESTRATOR verdrahtet).

## Input-API (CORE liefert)

```ts
// src/systems/input.ts
export interface PlayerInput { left, right, up, down, melee, weapon, special: boolean; // gedrückt
  meleePressed, weaponPressed, specialPressed: boolean; // just pressed (frame-genau) }
export class InputSystem {
  constructor(scene: Phaser.Scene)
  update(): void                       // JEDES update() zuerst aufrufen (setzt justPressed zurück)
  get(playerIdx: 0 | 1): PlayerInput  // 0 = P1 WASD+FG(+R), 1 = P2 IJKL+HU(+O)
}
```
Basis: Phaser `scene.input.keyboard.addKeys` / Key-Objekte (Phaser behandelt keydown/keyup sauber, kein Einzel-Event-Verlust).

## Player-API (CORE liefert; COMBAT verbraucht)

```ts
export class Player extends Phaser.Physics.Arcade.Sprite {
  idx: 0 | 1;
  facing: -1 | 1;
  hp: number;              // Start 100, nie < 0 clampen vergessen
  isDead: boolean;
  heldWeapon: WeaponId | null;   // wird von COMBAT gesetzt
  update(input: PlayerInput): void   // Bewegung/Animation (Idle/Walk/Run/Jump/Fall/Duck)
}
```
Spawn: P1 bei x≈0.25×384, P2 bei x≈0.75×384, y = Boden. Spieler-Körper-Kollision: leichtes Push-Auseinander, kein Dauer-Blockieren.

## Kampfsystem-API (COMBAT liefert; META verbraucht Events)

- `src/systems/combat.ts`: `class CombatSystem` mit `meleeAttack(player)`, Hitbox-Fenster (Attackbox nur in aktiven Frames), `applyHit(target, {damage, knockback, hitWord})` → erzeugt Hitstop (50–100ms via scene.physics.world.timeScale oder Clock-Pause), Knockback, FX-Events, `EV.HIT_LANDED`, `EV.PLAYER_DAMAGE`, bei hp<=0 `EV.PLAYER_KO` + `EV.ROUND_END`.
- `src/systems/weapons.ts`: `class WeaponSystem` — Spawner (alle 5–10s, max 4, Mindestabstand 40px zu Spielern), Pickup (`PRESS G`/`PRESS U` Prompt via pixelText), Nahkampf + Wurf mit WEAPONS-Daten (Bogenbahn, Bumerang, Bounce, Trap, wobbly), Despawn nach ~12s.
- BattleScene orchestriert alles, 60s Timer, Countdown 3-2-1-FIGHT!, KO-Sequenz, Sieger-Screen (PLAYER X WINS!) mit ENTER=REMATCH / ESC=MAIN MENU.

## FX-API (FX/AUDIO liefert; COMBAT/META verbrauchen)

```ts
// src/systems/fx.ts
export class FxSystem {
  constructor(scene: Phaser.Scene)
  hitBurst(x, y, power: 0|1|2): void          // Impact-Blitz + 5-30 Pixel-Partikel
  comicWord(x, y, word: string, color?: number): void  // Pixel-Font-Text, ~0.5s, poppt
  screenShake(intensity: number): void         // respektiert settings.screenShake
  koStars(x, y): void
}
```

## Audio-API (FX/AUDIO liefert)

```ts
// src/systems/audio.ts
export type SfxName = 'menuSelect'|'jump'|'land'|'hit'|'heavyHit'|'pickup'|'throw'|'weaponImpact'|'ko'|'victory'|'countdown'|'fight'|'squeak'|'bonk';
export class AudioSystem {
  constructor(scene: Phaser.Scene)
  play(name: SfxName): void                   // respektiert settings.sound
}
// src/systems/music.ts
export class MusicSystem { start(): void; stop(): void; }  // respektiert settings.music, prozeduraler Chiptune-Loop
```
ALLES über WebAudio synthetisiert, keine Dateien. Gummihuhn: besonders alberner Squeak ('squeak').

## HUD-API (META liefert; COMBAT verdrahtet)

`src/ui/hud.ts`: `class Hud { constructor(scene); updateHp(idx, hp); updateTimer(sec); showPrompt(idx, text) ... }` — Retro-HUD laut Spezifikation Abschnitt 13 (Portraits, Balken, Herzen, VS, TIME).

## Style-Regeln

- Depth-Konvention: Deko 3 · Spieler 10 · Boden-Waffen 11 · Projektile 12 · HUD 50 · Center-Text/Overlays 100+.
- Pixel-Art: harte Kanten, dunkle Outlines (Palette 'k'), keine Verläufe, kein Anti-Aliasing.
- PNG-Sprites (Sheet-Extraktion): volle RGBA-Treue, in finaler Anzeigegroesse gespeichert, LINEAR-Filter (setzt BootScene). Matrix-Fallbacks bleiben Scale 2. Font + pixelText bleiben Nearest.
- Canvas-Upscaling: CSS-smooth (image-rendering: auto), NICHT pixelated — der Look orientiert sich am weichen Referenz-ingame.png.
- Netzwerk: alle Konsumten nutzen NUR src/net/contract.ts-Typen. Host = P1 simuliert; Guest = P2, keine lokale Simulation (netTick-Pfad in BattleScene).
- Keine Kommentare im Code, außer Export-Verträgen.
- TS strict; `npm run typecheck` muss am Ende ohne Fehler durchlaufen.
- Fehlende Assets: nie crashen, warnen + Placeholder (siehe pixelToTexture fail-safe).
