// VERTRAG: boy1Sprites(): PixelSprite[] mit Keys 'boy1_<anim>_<frame>' (siehe src/types.ts).
import { PixelSprite } from '../art/pixelToTexture';
import { BOY1_DATA } from './boy1.data';

export function boy1Sprites(): PixelSprite[] {
  return BOY1_DATA;
}
