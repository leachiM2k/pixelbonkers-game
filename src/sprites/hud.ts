// VERTRAG: hudSprites(): PixelSprite[] (Keys laut Textur-Konvention in src/types.ts).
// Sheet-Daten (hud.data.ts) + hud_bar_fill als Stub (wird im Spiel dynamisch getintet,
// daher bewusst flaechig-weiss statt Sheet-Extrakt).
import { PixelSprite } from '../art/pixelToTexture';
import { HUD_SHEET_DATA } from './hud.data';

const BAR_FILL: string[] = Array.from({ length: 4 }, () => 'w'.repeat(58));

export function hudSprites(): PixelSprite[] {
  return [
    ...HUD_SHEET_DATA,
    { key: 'hud_bar_fill', rows: BAR_FILL },
  ];
}
