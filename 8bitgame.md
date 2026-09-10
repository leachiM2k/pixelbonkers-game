# AUFGABE: 2-PLAYER 8-BIT ARCADE FIGHTING GAME

Erstelle ein vollständig spielbares lokales 2-Player-Arcade-Fighting-Game im Stil klassischer 8-Bit/16-Bit-Konsolen- und Arcade-Spiele.
Du findest hier im Verzeichnis ein ingame-Bild und ein sprite-Bild

Das Spiel soll sich visuell und spielerisch an dem bereitgestellten Referenzbild orientieren:
- farbenfrohe Pixel-Art
- klassische Arcade-Ästhetik
- große, klar erkennbare Pixel-Sprites
- humorvolle, völlig übertriebene Waffen
- zwei Spieler gleichzeitig auf demselben Bildschirm
- schnelle, einfache und sofort verständliche Steuerung
- liebevolle Details und kleine Animationen
- Retro-HUD
- möglichst "arcadig", chaotisch und lustig

WICHTIG:
Das Referenzbild ist ausschließlich eine visuelle Inspiration. Keine 1:1-Kopie eines bestehenden Spiels oder einer bestehenden Marke erstellen.

--------------------------------------------------
1. TECHNISCHE ZIELSETZUNG
--------------------------------------------------

Erstelle das Spiel als lokal ausführbare Web-Anwendung.

Bevorzugte Technologie:
- HTML5
- JavaScript / TypeScript
- Phaser 3 oder eine vergleichbare 2D-Game-Engine
- CSS für Menüs und UI, soweit sinnvoll

Das Spiel muss nach dem Start direkt im Browser funktionieren.

Keine Server-Infrastruktur notwendig.

Ziel:
Ein einzelner Computer / Laptop mit einer Tastatur.

Das Spiel muss von zwei Personen gleichzeitig auf derselben Tastatur gespielt werden können.

Priorität:
1. Spielbarkeit
2. stabile Physik
3. gute Steuerung
4. Retro-Pixel-Look
5. Humor
6. Effekte und Polishing

--------------------------------------------------
2. GRUNDIDEE
--------------------------------------------------

Das Spiel ist ein verrücktes 2-Player-Duell.

Zwei Charaktere stehen sich in einer kleinen Arena gegenüber und versuchen, den jeweils anderen mit absurden Alltagsgegenständen und kuriosen Waffen zu besiegen.

Die Waffen sollen bewusst NICHT realistisch oder gefährlich wirken.

Beispiele:

Spieler 1:
- Pömpel / Plunger
- Gummistiefel
- Klobürste
- riesige Zahnbürste
- Fisch
- Bratpfanne
- aufblasbarer Hammer

Spieler 2:
- Gummihuhn
- Banane
- Kissen
- Klobürste
- riesiger Löffel
- Toilettenpapierrolle
- Quietscheente

Besonders wichtig:
Die Waffen sollen lustig und absurd sein.

Beispiel:
Ein Pömpel kann wie ein Bumerang geworfen werden.
Ein Gummihuhn kann beim Treffer kurz zusammengequetscht werden und danach zurückspringen.
Eine Banane kann auf dem Boden liegen bleiben und einen Spieler ausrutschen lassen.
Ein Kissen kann einen Spieler wegschleudern.
Eine Klobürste kann als Nahkampfwaffe verwendet werden.

--------------------------------------------------
3. CHARAKTERE
--------------------------------------------------

Es gibt zwei eindeutig unterscheidbare Charaktere.

PLAYER 1:
- jüngerer Junge
- dunkle Haare
- dunkelblaues T-Shirt
- blaue Jeans
- rot/weiße Sneaker
- sympathischer, leicht frecher Gesichtsausdruck

PLAYER 2:
- etwas größerer Junge
- dunkle Haare
- blaues T-Shirt
- blaue Jeans
- blaue Sneaker
- selbstbewusster Gesichtsausdruck

Die Charaktere sollen erkennbar von der visuellen Komposition des Referenzbildes inspiriert sein, aber als eigenständige Pixel-Art-Sprites umgesetzt werden.

Keine Fotorealistik.

Pixel-Art:
- harte Pixelkanten
- keine weichen Vektorformen
- keine fotorealistischen Texturen
- klare schwarze/dunkle Outlines
- begrenzte Farbpalette
- sichtbare Pixelstruktur

Die Charaktere sollten ungefähr 48–96 Pixel hoch sein, abhängig von der internen Auflösung.

--------------------------------------------------
4. GRAFIKSTIL
--------------------------------------------------

Der gesamte Look soll wie ein hochwertiges 8-Bit/16-Bit-Arcade-Spiel wirken.

Optik:

- Pixel-Art
- kräftige Farben
- dunkle Outlines
- einfache geometrische Formen
- kleine Pixel-Highlights
- animierte Sprite-Frames
- Retro-Farbpalette
- keine modernen 3D-Effekte

Verwende eine interne niedrige Auflösung und skaliere diese pixel-perfect auf den Bildschirm.

Beispielsweise:

1280x720 Display
↓
interne Auflösung:
320x180 oder 384x216

Anschließend:
nearest-neighbor scaling

KEIN:
- Anti-Aliasing
- Blur
- weichgezeichnete Sprites
- subpixel positioning, wenn dadurch Pixel-Flimmern entsteht

--------------------------------------------------
5. ARENA
--------------------------------------------------

Die erste Arena soll sich in einem humorvollen Park befinden.

Hintergrund:
- blauer Himmel
- einige Pixel-Wolken
- große grüne Bäume
- Büsche
- Parkbank
- Mülleimer
- eventuell ein kleiner Weg
- entfernte Häuser/Silhouetten
- Gras

Vordergrund:
Eine breite Plattform bzw. Parkfläche.

Die Arena darf kleine Höhenunterschiede besitzen.

Beispiel:

         Baum                         Baum
             ☁              ☁

             [ ARENA ]

       _________          _________
      |         |________|         |
      |                         |
      |_________________________|

Der Spieler soll sich auf Plattformen bewegen und springen können.

Zusätzlich können sich kleine Fallen oder interaktive Objekte in der Arena befinden.

--------------------------------------------------
6. SPIELERSTEUERUNG
--------------------------------------------------

Das Spiel muss ausdrücklich für zwei Personen auf EINER Tastatur ausgelegt sein.

PLAYER 1:

A = nach links
D = nach rechts
W = springen
S = ducken / nach unten

Angriffssteuerung:
F = Nahkampfangriff
G = Waffe benutzen / werfen

Optional:
R = Spezialangriff

PLAYER 2:

J = nach links
L = nach rechts
I = springen
K = ducken / nach unten

Angriffssteuerung:
H = Nahkampfangriff
U = Waffe benutzen / werfen

Optional:
O = Spezialangriff

ESC = Pause

ENTER = Menü bestätigen

Die Tastenbelegung muss im Startmenü angezeigt werden.

Wichtig:
Alle Tasten müssen gleichzeitig funktionieren.

Es darf NICHT passieren, dass beispielsweise
W + D + G gleichzeitig gedrückt werden und eine Eingabe verloren geht.

Verwende ein robustes Keyboard-State-System:

isKeyDown()
keyPressed()
keyReleased()

und keine einfachen keydown-Einzelereignisse für die gesamte Bewegung.

--------------------------------------------------
7. BEWEGUNG
--------------------------------------------------

Die Bewegung soll einfach, direkt und arcadeartig sein.

Kein realistisches Laufverhalten.

PLAYER:

- laufen
- springen
- fallen
- ducken
- Nahkampf
- Waffe aufnehmen
- Waffe werfen
- Waffen ausweichen

Optional:
- kurzer Dash
- Rückwärtsbewegung
- kleiner Knockback

Der Spieler darf nicht außerhalb der Arena laufen.

--------------------------------------------------
8. KAMPFSYSTEM
--------------------------------------------------

Jeder Charakter besitzt:

100 HP

Zusätzlich kann es eine kleinere Stamina-Anzeige geben.

Nahkampfangriffe:
- verursachen ca. 8–15 Schaden
- kurze Reichweite
- kurze Cooldown-Zeit

Geworfene Waffen:
- verursachen ca. 10–25 Schaden
- besitzen individuelle Flugbahnen

Spezialwaffen:
- können deutlich stärkere Effekte besitzen
- haben aber einen Cooldown

Wenn ein Spieler getroffen wird:

1. HP reduzieren
2. Knockback anwenden
3. kurze Hit-Animation
4. kleine Partikeleffekte
5. Soundeffekt
6. kurzer Hitstop von ca. 50–100 ms

Der Hitstop soll die Treffer besonders knackig wirken lassen.

--------------------------------------------------
9. KURIOSER WAFFENPOOL
--------------------------------------------------

Implementiere mindestens 8 unterschiedliche Waffen.

Beispiele:

1. PÖMPEL
---------------
Nahkampf:
kräftiger Schlag

Wurf:
Pömpel fliegt mit einer leichten Bogenbahn.

Treffer:
Gegner wird zurückgeschleudert.

2. GUMMIHUHN
---------------
Nahkampf:
Gummihuhn wird dem Gegner um die Ohren gehauen.

Wurf:
Gummihuhn fliegt rotierend durch die Luft.

Treffer:
lustiger "SQUEAK"-Sound.

Zusatz:
Das Gummihuhn kann vom Boden abprallen.

3. BANANE
---------------
Kann geworfen werden.

Wenn sie auf dem Boden landet:
Sie bleibt liegen.

Wenn ein Spieler darüber läuft:
Rutsch-Animation + Kontrollverlust.

4. KISSEN
---------------
Nahkampf:
langsamer, aber starker Angriff.

Wurf:
Kissen fliegt relativ langsam.

Treffer:
großer Knockback.

5. TOILETTENBÜRSTE
---------------
Schnelle Nahkampfwaffe.

Viele kleine Treffer möglich.

6. BRATPFANNE
---------------
Langsamer Angriff.

Sehr starker Treffer.

Bei kritischem Treffer:
Sterne kreisen kurz um den Kopf des Gegners.

7. QUIETSCHEENTE
---------------
Kann geworfen werden.

Bei Treffer:
große gelbe Pixel-Explosion.

8. GUMMISTIEFEL
---------------
Kann geworfen werden.

Fliegt in einer leicht unberechenbaren Kurve.

--------------------------------------------------
10. WAFFEN-SPAWN
--------------------------------------------------

Waffen erscheinen zufällig in der Arena.

Zum Beispiel alle 5–10 Sekunden.

Aber:
- nicht direkt auf einem Spieler spawnen
- mindestens einige Pixel Abstand zu Spielern
- maximal 3–5 Waffen gleichzeitig

Eine Waffe kann automatisch verschwinden, wenn sie lange nicht aufgenommen wurde.

Waffen sollen deutlich sichtbar sein.

Optional:
Die aktuell aufnehmbaren Waffen erhalten einen kleinen blinkenden Pixel-Glow.

--------------------------------------------------
11. WAFFENAUFNAHME
--------------------------------------------------

Wenn ein Spieler nahe genug an einer Waffe steht:

zeige:

"PRESS G"

bzw.

"PRESS U"

Die Waffe wird aufgenommen.

Der Spieler hält sie sichtbar in der Hand.

Wenn der Spieler getroffen wird, kann die Waffe aus der Hand fallen.

--------------------------------------------------
12. TREFFER-EFFEKTE
--------------------------------------------------

Treffer müssen visuell sehr befriedigend sein.

Bei jedem Treffer:

- kleiner weißer Impact-Blitz
- Pixel-Partikel
- Knockback
- kurze Bildschirmerschütterung
- Hitstop
- Sound

Stärkere Treffer:

- größere Explosion
- mehr Partikel
- stärkere Screen Shake
- eventuell "BONK!"
- eventuell "POW!"
- eventuell "SQUEAK!"

Die Texte sollen im klassischen Pixel-Font erscheinen.

--------------------------------------------------
13. HUD
--------------------------------------------------

Oben im Bildschirm befindet sich ein klassisches Arcade-HUD.

Links:

[Portrait]
P1
PLAYER 1
████████████████████
❤️ ❤️ ❤️

Rechts:

P2
PLAYER 2
████████████████████
❤️ ❤️ ❤️

In der Mitte:

VS

Darunter:

TIME
60

Beispiel:

┌─────────────────────────────────────────────┐
│ P1                         VS             P2 │
│ ❤️❤️❤️                  60              ❤️❤️❤️ │
│ ████████████                          ████████ │
└─────────────────────────────────────────────┘

Das HUD muss pixelartig gestaltet sein.

Die HP-Leiste muss sich sichtbar verändern.

Wenn ein Spieler Schaden bekommt:
Die HP-Leiste reduziert sich.

--------------------------------------------------
14. RUNDE
--------------------------------------------------

Eine Runde dauert 60 Sekunden.

Start:

3
2
1
FIGHT!

Danach beginnt das Spiel.

Wenn ein Spieler 0 HP erreicht:

- Kampf einfrieren
- Sieger-Animation
- "K.O.!"
- Gewinner jubelt
- Verlierer fällt um
- kurzer Arcade-Jingle

Dann:

PLAYER 1 WINS!

oder

PLAYER 2 WINS!

Danach:

REMATCH
MAIN MENU

--------------------------------------------------
15. BEST-OF-SYSTEM
--------------------------------------------------

Optional, aber wünschenswert:

Best of 3.

Jeder Spieler besitzt:

🏆 Wins

Nach jeder Runde:

ROUND 1
P1 WINS

Die gewonnenen Runden werden im HUD dargestellt.

Wer zuerst zwei Runden gewinnt, gewinnt das Match.

--------------------------------------------------
16. STARTMENÜ
--------------------------------------------------

Beim Start:

================================
        PIXEL BONKERS
================================

       2 PLAYER MAYHEM

        PRESS ENTER

       P1: WASD + F/G
       P2: IJKL + H/U

================================

Das Logo soll wie ein klassischer Arcade-Titel aussehen.

Optional:
blinkender "PRESS ENTER"-Text.

--------------------------------------------------
17. CHARAKTERAUSWAHL
--------------------------------------------------

Optional, wenn der Aufwand vertretbar ist.

Menü:

CHOOSE YOUR FIGHTER

P1:
[BOY 1]
[BOY 2]

P2:
[BOY 1]
[BOY 2]

Für die erste Version reichen aber zwei fest definierte Charaktere.

--------------------------------------------------
18. ANIMATIONEN
--------------------------------------------------

Mindestens folgende Animationen:

IDLE
- leichtes Wippen

WALK
- mindestens 2–4 Frames

RUN
- 4 Frames

JUMP
- mindestens 2 Frames

FALL
- 1–2 Frames

ATTACK
- 3–5 Frames

HIT
- 2–3 Frames

KO
- mehrere Frames

VICTORY
- mehrere Frames

WEAPON THROW
- mehrere Frames

Die Animationen müssen nicht komplex sein.

Wichtig ist der erkennbare Pixel-Art-Charakter.

--------------------------------------------------
19. PHYSIK
--------------------------------------------------

Verwende einfache Arcade-Physik.

Schwerkraft.

Beispielsweise:

gravity ≈ 1000–1800 px/s²

abhängig von der internen Auflösung.

Sprunghöhe so wählen, dass ein Spieler etwa 1–2 Plattformhöhen überwinden kann.

Wichtig:
Die Steuerung soll sich direkt anfühlen.

Kein träges oder realistisches Beschleunigungsverhalten.

--------------------------------------------------
20. COLLISION SYSTEM
--------------------------------------------------

Benötigt werden:

PLAYER vs PLATFORM
PLAYER vs PLAYER
PLAYER vs WEAPON
PROJECTILE vs PLAYER
WEAPON vs PLATFORM

Spieler dürfen sich nicht gegenseitig dauerhaft blockieren.

Bei Kollision während eines Angriffs:
Hitbox des Angriffs prüfen.

Nutze separate Hitboxen und Hurtboxen.

Nicht nur die sichtbare Sprite-Fläche verwenden.

--------------------------------------------------
21. HITBOXEN
--------------------------------------------------

Jeder Charakter besitzt:

Hurtbox:
Körperbereich

Attackbox:
Bereich vor dem Charakter während eines Angriffs

Beispiel:

PLAYER:

      HEAD
       O
      /|\
     / | \
    /  |  \

Hurtbox:
Körper

Attackbox:
       [======]
         Angriff

Die Attackbox darf nur während bestimmter Frames aktiv sein.

Beispiel:

Frame 1:
kein Treffer

Frame 2:
kein Treffer

Frame 3:
Attackbox aktiv

Frame 4:
Attackbox aktiv

Frame 5:
kein Treffer

Das macht die Kämpfe wesentlich sauberer.

--------------------------------------------------
22. SOUND
--------------------------------------------------

Verwende einfache Retro-Sounds.

Benötigt:

- Menu select
- Jump
- Land
- Hit
- Heavy hit
- Weapon pickup
- Weapon throw
- Weapon impact
- KO
- Victory
- Countdown
- Fight

Das Gummihuhn MUSS einen besonders albernen Quietschesound bekommen.

Falls keine externen Sounddateien vorhanden sind:
Erzeuge einfache Sounds über WebAudio API oder verwende generierte Placeholder-Sounds.

Keine urheberrechtlich geschützten Sounds aus bekannten Spielen verwenden.

--------------------------------------------------
23. MUSIK
--------------------------------------------------

Eine kurze loopende Retro-Musik wäre wünschenswert.

Stil:

- schneller Arcade-Chiptune
- 8-bit
- fröhlich
- etwas chaotisch
- kurze Loop

Wenn keine Musikdatei vorhanden ist:
Eine einfache prozedural erzeugte Chiptune-Musik über WebAudio API kann verwendet werden.

Musik muss über das Menü deaktivierbar sein.

--------------------------------------------------
24. PARTIKEL
--------------------------------------------------

Verwende Pixel-Partikel.

Beispiele:

Treffer:
- 5–15 kleine Pixel

Schwerer Treffer:
- 15–30 Pixel

Banane:
- kleine gelbe Partikel

Gummihuhn:
- kleine weiße/gelbe Partikel

KO:
- Sterne

Partikel sollen automatisch verschwinden.

--------------------------------------------------
25. SCREEN SHAKE
--------------------------------------------------

Bei Angriffen:

normaler Treffer:
ca. 2–4 px

starker Treffer:
ca. 5–8 px

KO:
ca. 10–15 px

Nicht übertreiben.

--------------------------------------------------
26. ARENA-DETAILS
--------------------------------------------------

Die Arena soll lebendig wirken.

Im Hintergrund können sich bewegen:

- kleine Vögel
- Wolken
- Blätter
- eventuell ein Eichhörnchen
- kleine Pixel-Partikel

Diese Elemente dürfen das Gameplay nicht beeinflussen.

Im Vordergrund:

- Parkbank
- Mülleimer
- Laterne
- Büsche
- Gras
- kleine Blumen

Alles im Pixel-Art-Stil.

--------------------------------------------------
27. SPIELMODI
--------------------------------------------------

Mindestens:

1. VS LOCAL

Optional:

2. TRAINING

Training:
- keine Zeitbegrenzung
- HP regenerieren
- Waffen testen
- eventuell Dummy

3. CHAOS MODE

Optional:
- sehr schnelle Waffen-Spawns
- verrücktere Physik
- kürzere Runden

--------------------------------------------------
28. PAUSE
--------------------------------------------------

ESC öffnet:

=================
      PAUSE
=================

RESUME

RESTART ROUND

MAIN MENU

=================

Das Spiel wird während der Pause vollständig eingefroren.

--------------------------------------------------
29. RESPONSIVE DISPLAY
--------------------------------------------------

Das Spiel soll auf unterschiedlichen Browserfenstergrößen funktionieren.

Ideal:

16:9

Bei größerem Fenster:
Spiel skalieren.

Pixel müssen scharf bleiben.

Kein Verzerren der Pixel.

Bei kleinerem Fenster:
Letterboxing verwenden, falls nötig.

--------------------------------------------------
30. PERFORMANCE
--------------------------------------------------

Ziel:

60 FPS.

Auch bei vielen Partikeln und mehreren Waffen.

Keine unnötigen DOM-Updates während des Gameplays.

Gameplay vollständig innerhalb der Game Engine rendern.

--------------------------------------------------
31. CODE-ARCHITEKTUR
--------------------------------------------------

Strukturiere den Code sauber.

Beispielsweise:

src/
  main.ts

  scenes/
    BootScene.ts
    MainMenuScene.ts
    CharacterSelectScene.ts
    BattleScene.ts
    GameOverScene.ts

  entities/
    Player.ts
    Weapon.ts
    Projectile.ts

  weapons/
    Plunger.ts
    RubberChicken.ts
    Banana.ts
    Pillow.ts
    ToiletBrush.ts
    FryingPan.ts
    RubberBoot.ts
    RubberDuck.ts

  systems/
    CombatSystem.ts
    WeaponSystem.ts
    InputSystem.ts
    ParticleSystem.ts
    AudioSystem.ts

  ui/
    HUD.ts
    PauseMenu.ts

  assets/
    sprites/
    audio/
    fonts/

Die genaue Struktur darf angepasst werden, wenn das verwendete Framework eine bessere Architektur nahelegt.

Wichtig:
Keine riesige monolithische Datei mit mehreren tausend Zeilen.

--------------------------------------------------
32. DATENGETRIEBENE WAFFEN
--------------------------------------------------

Waffen sollten möglichst nicht hart im Kampfsystem verdrahtet sein.

Beispiel:

interface WeaponDefinition {

    id: string;

    name: string;

    damage: number;

    knockback: number;

    attackSpeed: number;

    projectileSpeed?: number;

    projectileGravity?: number;

    range: number;

    cooldown: number;

    type: "melee" | "projectile" | "trap";

}

Dadurch soll es einfach sein, später weitere kuriose Waffen hinzuzufügen.

--------------------------------------------------
33. GAME FEEL
--------------------------------------------------

Das Spiel soll sich NICHT wie eine Physik-Simulation anfühlen.

Es soll sich wie ein klassisches Arcade-Spiel anfühlen.

Prioritäten:

SNAPPY
FUN
FAST
CLEAR
RESPONSIVE
OVER-THE-TOP

Ein Treffer darf ruhig übertrieben dargestellt werden.

Beispiel:

Spieler 1 trifft Spieler 2 mit dem Pömpel.

Dann:

POW!

Spieler 2 fliegt 50 Pixel zurück.

Ein paar Sterne erscheinen.

Der Bildschirm wackelt kurz.

Der Pömpel fliegt weg.

Ein kleiner Retro-Sound ertönt.

Genau diese Art von Feedback soll das gesamte Spiel haben.

--------------------------------------------------
34. SPIELBALANCE
--------------------------------------------------

Keine Waffe darf dauerhaft überlegen sein.

Jede Waffe soll einen Vor- und Nachteil besitzen.

Beispiele:

Pömpel:
+ hoher Knockback
- langsam

Gummihuhn:
+ schnell
+ prallt ab
- geringer Schaden

Banane:
+ Falle
- kein direkter Schaden

Bratpfanne:
+ hoher Schaden
- sehr langsam

Kissen:
+ hoher Knockback
- langsam

--------------------------------------------------
35. BOT / KI
--------------------------------------------------

Für die erste Version NICHT notwendig.

Das Spiel soll ausschließlich auf Local 2 Player optimiert sein.

--------------------------------------------------
36. ACCESSIBILITY
--------------------------------------------------

Im Menü:

SOUND ON/OFF

MUSIC ON/OFF

SCREEN SHAKE ON/OFF

FULLSCREEN

Zusätzlich:

"Controls"

mit Darstellung der Tastatur.

--------------------------------------------------
37. DEBUG MODE
--------------------------------------------------

Implementiere optional einen Debug-Modus.

Wenn aktiviert:

- FPS anzeigen
- Hitboxen anzeigen
- Hurtboxen anzeigen
- aktuelle Waffe anzeigen
- Player Position anzeigen

Debug Mode z.B. über:

F10

aktivierbar.

--------------------------------------------------
38. FEHLERBEHANDLUNG
--------------------------------------------------

Das Spiel darf niemals aufgrund einer fehlenden Grafik oder eines fehlenden Sounds komplett abstürzen.

Wenn ein Asset fehlt:
- Placeholder verwenden
- Fehler in Console ausgeben
- Gameplay weiterführen

--------------------------------------------------
39. PLACEHOLDER-GRAFIKEN
--------------------------------------------------

Falls keine finalen Grafiken vorhanden sind:

Erstelle zunächst einfache Pixel-Art-Placeholder direkt im Code oder als SVG/Canvas/Pixel-Assets.

Aber:
Das finale Spiel muss trotzdem visuell wie ein zusammenhängendes 8-Bit-Spiel aussehen.

Keine grauen Rechtecke als Platzhalter im finalen Ergebnis.

--------------------------------------------------
40. WICHTIGER ENTWICKLUNGSANSATZ
--------------------------------------------------

Baue das Spiel inkrementell.

PHASE 1:
- Spielstart
- Arena
- zwei Spieler
- Bewegung
- Sprung
- Kollision

PHASE 2:
- Nahkampfangriffe
- HP
- Treffer
- Knockback

PHASE 3:
- Waffen
- Waffen aufnehmen
- Waffen werfen
- individuelle Waffenphysik

PHASE 4:
- HUD
- Timer
- Runden
- Sieg/Niederlage

PHASE 5:
- Pixel-Art
- Animationen
- Partikel
- Screen Shake
- Sounds

PHASE 6:
- Menüs
- Pause
- Einstellungen
- Polishing

Nach jeder Phase muss das Spiel weiterhin ausführbar sein.

--------------------------------------------------
41. AKZEPTANZKRITERIEN
--------------------------------------------------

Das Ergebnis gilt erst als fertig, wenn:

[ ] Das Spiel startet ohne Fehler.

[ ] Zwei Spieler können gleichzeitig spielen.

[ ] P1 funktioniert mit WASD.

[ ] P2 funktioniert mit IJKL.

[ ] Beide Spieler können gleichzeitig laufen und springen.

[ ] Beide Spieler können gleichzeitig angreifen.

[ ] Beide Spieler können gleichzeitig Waffen benutzen.

[ ] Kollisionen funktionieren.

[ ] Schaden funktioniert.

[ ] Knockback funktioniert.

[ ] HP werden korrekt dargestellt.

[ ] Timer funktioniert.

[ ] Rundenende funktioniert.

[ ] Gewinner wird angezeigt.

[ ] Rematch funktioniert.

[ ] Mindestens 8 kuriose Waffen funktionieren.

[ ] Waffen fühlen sich unterschiedlich an.

[ ] Pixel-Art-Stil ist durchgehend.

[ ] HUD ist im Retro-Stil.

[ ] Sounds funktionieren.

[ ] Pause funktioniert.

[ ] Neustart funktioniert.

[ ] Das Spiel läuft stabil mit ca. 60 FPS.

[ ] Es gibt keine gravierenden Console-Errors.

--------------------------------------------------
42. BESONDERS WICHTIG: VISUELLE QUALITÄT
--------------------------------------------------

Das Ergebnis soll NICHT wie eine typische schnelle KI-generierte Webgame-Demo aussehen.

Es soll aussehen wie ein kleines, liebevoll entwickeltes Retro-Arcade-Spiel.

Achte besonders auf:

- konsistente Pixelgröße
- konsistente Outline-Stärke
- einheitliche Farbpalette
- gut lesbare Charaktere
- klare Waffen-Sprites
- animierte Charaktere
- sichtbare Trefferreaktionen
- schönes HUD
- lebendigen Hintergrund
- gute Komposition

Die beiden Charaktere müssen jederzeit klar voneinander unterscheidbar sein.

--------------------------------------------------
43. HUMOR
--------------------------------------------------

Der Humor ist ein zentraler Bestandteil des Spiels.

Die Waffen sind absichtlich albern.

Beispiele für mögliche Treffertexte:

BONK!
WHACK!
SQUEAK!
PLOP!
POW!
BOINK!
SMACK!

Bei einem besonders absurden Treffer kann kurz ein großer Pixel-Schriftzug erscheinen.

Beispiel:

       B O N K ! ! !

Der Text verschwindet nach ungefähr 0,5 Sekunden.

--------------------------------------------------
44. ERSTE SPIELRUNDE
--------------------------------------------------

Wenn das Spiel gestartet wird:

3
2
1
FIGHT!

P1 startet links.

P2 startet rechts.

Beide stehen zunächst etwa 30–40 % der Bildschirmbreite voneinander entfernt.

In der Mitte der Arena liegt eine zufällige Waffe.

Beispielsweise:

       P1                         P2

       👦                         👦

             🪠

Nach wenigen Sekunden erscheinen weitere Waffen.

Die Spieler kämpfen.

Wenn einer gewinnt:

========================
       PLAYER 1
         WINS!
========================

und darunter:

PRESS ENTER FOR REMATCH

--------------------------------------------------
45. ENTWICKLER-REGEL
--------------------------------------------------

Wenn zwischen "technisch einfach" und "spielerisch cool" gewählt werden muss:

Wähle die spielerisch coolere Lösung.

Wenn zwischen realistischer Physik und Arcade-Physik gewählt werden muss:

Wähle Arcade-Physik.

Wenn zwischen zusätzlicher Funktion und besserem Game Feel gewählt werden muss:

Wähle besseres Game Feel.

--------------------------------------------------
46. ABSCHLUSS
--------------------------------------------------

Liefere ein vollständig funktionierendes Spiel.

Keine bloßen Mockups.

Keine statischen Screenshots.

Keine reine UI-Demo.

Das Ergebnis muss tatsächlich spielbar sein.

Am Ende des Entwicklungsprozesses:

1. Anwendung starten
2. Spiel selbst testen
3. beide Tastatursteuerungen testen
4. Angriffe testen
5. Waffen testen
6. Rundenende testen
7. Rematch testen
8. Console auf Fehler prüfen
9. offensichtliche Bugs beheben

Erst danach den Task als abgeschlossen betrachten.

--------------------------------------------------
47. OPTIONAL: SPÄTERE ERWEITERUNGEN
--------------------------------------------------

Die Architektur soll spätere Erweiterungen ermöglichen:

- weitere Charaktere
- weitere Arenen
- 20+ Waffen
- Spezialfähigkeiten
- unterschiedliche Spielmodi
- Online-Multiplayer
- Controller-Unterstützung
- Turniermodus
- Highscores
- Charakter-Skins
- freischaltbare Waffen
- Bosskämpfe

Diese Features müssen NICHT in Version 1 implementiert werden.

Die Architektur soll sie aber nicht unnötig erschweren.
