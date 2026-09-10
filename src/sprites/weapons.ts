// VERTRAG: weaponSprites(): PixelSprite[] mit Keys 'wpn_<weaponId>' (WEAPON_IDS in src/types.ts).
import { PixelSprite } from '../art/pixelToTexture';
import { WEAPON_DATA } from './weapons.data';

export function weaponSprites(): PixelSprite[] {
  return WEAPON_DATA;
}
