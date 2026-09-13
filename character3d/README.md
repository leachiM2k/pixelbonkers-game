# character3d – 3D-Charakter-Pipeline

Erzeugt spielbare 16-Bit-Spritesheets aus prozeduralen 3D-Charakteren:
3D-Modell (Three.js) → 28 Posen rendern (Chrome headless, orthografische
Seitenansicht) → Pixel-Konvertierung mit der Palette der bestehenden
Spiel-Sprites.

## Charaktere

| Key | Prefix | Figur | Sprite-Stehhöhe |
|-----|--------|-------|-----------------|
| `teen` | `teen` | schlanker Jugendlicher, blaues Shirt, Jeans, grüne Sneaker | 92 px |
| `bru`  | `bru`  | BRUNO – klein, Kugelkopf, Knollennase, Schnurrbart, rote Mütze, Latzhose | 82 px |
| `lin`  | `lin`  | LINO – hoch und schlank, grüne Mütze, Latzhose | 94 px |
| `pol`  | `pol`  | POLDI – Matrose, riesige Unterarme, Kinn, Matrosenmütze | 86 px |

Alle Figuren sind eigenständige Designs („angelehnt"), keine Marken-Kopien.

## Befehle

```bash
npm install

npm run all            # alle Charaktere: 3D-Render + 16-Bit
npm run all -- bru     # nur ein Charakter (auch lin/pol/teen)
npm run generate       # nur 3D-Renders des Default-Charakters (teen)
node generate.mjs bru  # 3D-Renders für bru
node pixelate.mjs bru  # 16-Bit-Sprites für bru
npm run serve          # interaktiver Viewer: http://127.0.0.1:8791
npm run check          # numerische Posen-Prüfung aller Charaktere
node verify16.mjs bru  # numerische Sprite-Prüfung (Canvas, Bodenlinie)
node debug.mjs <posen> # Multi-View-Debug-Sheet je Pose
```

## Pipeline

```
model.js      Parametrisches 3D-Modell (Maße, Features, Fußgeometrie)
poses.js      28 Posen als Gelenkwinkel + AIR_POSES + POSE_VIEWS
characters.js Charakter-Registry: Name → Prefix + Config
app.js        Viewer/Renderer (im Browser laufend)
index.html    Einstieg; importmap auf node_modules/three
server.mjs    Statischer Server + POST /save (schreibt output/)
generate.mjs  Treiber: startet Server, rendert headless per Chrome
pixelate.mjs  3D-Renders → 100x98-16-Bit-Sprites (Palette aus dem Spiel)
run-all.mjs   Schleift generate+pixelate über alle Charaktere
check.mjs     FK-Prüfung aller Charaktere ohne Rendering
verify16.mjs   Sprite-Geometrie-Prüfung je Prefix
```

### 1. Rendering (`generate.mjs` → `app.js`)

- Chrome headless (installiertes Google Chrome, WebGL via SwiftShader),
  gesteuert über puppeteer-core.
- Orthografische Kamera, 100% Seitenansicht auf Kopfhöhe
  (Jump'n'Run-Konvention). Abweichende Ansicht pro Pose über `POSE_VIEWS`
  (z.B. `victory_0: 90` = Frontalansicht).
- Auto-Bodenkontakt: `applyPose()` samplet die Schuhsohlen per FK (je
  Charakter eigene Fußpunkte aus der Build-Config) und verschiebt die
  Root-Höhe so, dass Stand-Posen exakt auf dem Boden stehen; Luft-Posen
  (`AIR_POSES`) werden nur gegen Durchdringen geclampt.
- Weite Posen (z.B. liegendes K.O.) zoomen automatisch raus; die
  Kameralösung wird pro Pose in `output/<prefix>_meta.json` gespeichert.
- Output: `output/<prefix>_<pose>.png` (512x512, transparent),
  `<prefix>_preview_sheet.png`, `<prefix>.glb` (A-Pose, z.B. für Blender).

### 2. 16-Bit-Konvertierung (`pixelate.mjs`)

- Palette: automatisch extrahiert aus allen PNGs in
  `../public/assets/sprites/` (max. 128 Farben, Outline-Schwarz).
- Zielformat exakt wie die bestehenden Spiel-Sprites: Canvas 100x98,
  Bodenlinie auf Zeile 96, Anker Spalte 50 (Welt-X=0), Stehhöhe aus der
  Charakter-Config (`standPx`).
- Luft-Posen werden inhaltsverankert (Unterkante auf Zeile 96), breite
  Posen horizontal zentriert – beides wie bei den alten Sheets.
- Area-Downsampling, Alpha-Schwelle 0.5, Farbquantisierung auf die
  Palette, 1px-Innenoutline an der Silhouette.
- Output: `output/16bit/<prefix>_<pose>.png` + `<prefix>16_sheet.png`.

## Posen (28 Frames)

| Aktion   | Frames | Aktion   | Frames |
|----------|--------|----------|--------|
| stehen   | 2      | attacke  | 4      |
| gehen    | 4      | werfen   | 3      |
| rennen   | 4      | getroffen| 2      |
| springen | 2      | k.o.     | 3      |
| fallen   | 1      | jubeln   | 2 (frontal) |
| ducken   | 1      |          |        |

Gelenk-Konventionen (Grad): positive Winkel bedeuten
Schwingen = nach vorne, Lift = vom Körper weg, Beuge = natürliche
Richtung (Knie retour, Ellbogen vor). Root: `tiltBack` positiv = nach
hinten kippen (K.O. liegt bei 84°). Alle Winkel gelten prozentual für
jede Körpergröße; die Auto-Bodenkorrektur gleicht unterschiedliche
Proportionen aus.

## Charakter-Config (model.js)

Zwei Ebenen:

- **colors**: skin, hair, shirt, shirtDark, jeans, jeansCuff, shoe,
  shoeDark, sole, eyeWhite, eyeDark, mouth
- **build** (Maße, alle mit Teen-Defaults): `hipsY` (Hüfthöhe),
  `pelvisR`, `torsoR/torsoLen/torsoSX/torsoSZ` (Rumpf), `chestLift`,
  `neckR`, `headR/headSX/headSY/headSZ` (Kopfgröße/-form),
  `shoulderW`, `armR`, `upperArmLen`, `foreR`, `foreLen`, `handR`
  (POLDI: `foreR` riesig), `hipW`, `thighR/thighLen`, `shinR/shinLen`,
  `noseR`, `earR`, `eyeR/eyeSide/browY`, `footToeX/footHeelX/
  footSoleY/footW` (Schuhgröße)
- **features**: `hairStyle` ('fringe' | 'capTuft' | 'baldSide'),
  `cap` (Mütze mit Schild), `sailorCap`, `mustache`, `overalls`
  (Latzhose mit Trägern + Knöpfen), `chin` (markantes Kinn),
  `boots` (Stiefel statt Sneaker)
- **standPx**: Sprite-Stehhöhe in Pixeln (Charaktergröße im Spiel)

Gelenkabstände (Ellbogen, Handgelenk, Knie, Knöchel) werden aus den
Segmentlängen abgeleitet – neue Proportionen brauchen nur die Längen
und Radien.

## Neuen Charakter anlegen

1. In `model.js` eine `<NAME>_CONFIG` anlegen (am einfachsten eine
   bestehende Config kopieren und colors/build/features anpassen) und
   exportieren.

2. In `characters.js` registrieren:

   ```js
   myhero: { prefix: 'myh', label: 'MEIN HELD', config: MYHERO_CONFIG },
   ```

3. `npm run all -- myhero` – render + pixelate.

4. Prüfen: `output/16bit/<prefix>16_sheet.png` ansehen,
   `npm run check` (meldet zu breite/hohe Posen und Bodenfehler),
   `node verify16.mjs <name>` (Sprite-Geometrie).

## Viewer

`npm run serve` → http://127.0.0.1:8791

- Charakter-Dropdown (teen/bru/lin/pol)
- Orbit-Kamera, alle 28 Posen als Buttons (nach Aktion gruppiert)
- Toggles: Outline (Inverted-Hull), Toon-Material (Cel-Shading),
  Turntable
- „Alle 28 Posen rendern" schreibt die komplette Pipeline in `output/`
  (gleiche Ergebnisse wie `node generate.mjs <char>`)
- GLB-Export-Button

