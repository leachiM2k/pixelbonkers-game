// VERTRAG: boy2Sprites(): PixelSprite[] mit Keys 'boy2_<anim>_<frame>' (siehe src/types.ts).
import { PixelSprite } from '../art/pixelToTexture';
import { BOY2_DATA } from './boy2.data';

export function boy2Sprites(): PixelSprite[] {
  return BOY2_DATA;
}
