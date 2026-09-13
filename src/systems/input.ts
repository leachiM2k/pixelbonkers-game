// CONTRACT: InputSystem.update() JEDES Frame vor get() aufrufen.
// PlayerInput: left/right/up/down/melee/weapon/special = gehalten (held),
// meleePressed/weaponPressed/specialPressed = just pressed im aktuellen update().
// KEYMAP: oeffentliche Tastenbelegung P1/P2 fuer Controls-Screen.

import Phaser from 'phaser';

export interface PlayerInput {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  melee: boolean;
  weapon: boolean;
  special: boolean;
  meleePressed: boolean;
  weaponPressed: boolean;
  specialPressed: boolean;
}

export interface PlayerKeyMap {
  left: string;
  right: string;
  up: string;
  down: string;
  melee: string;
  weapon: string;
  special: string;
}

export const KEYMAP: Record<0 | 1, PlayerKeyMap> = {
  0: { left: 'A', right: 'D', up: 'W', down: 'S', melee: 'F', weapon: 'G', special: 'R' },
  1: { left: 'J', right: 'L', up: 'I', down: 'K', melee: 'H', weapon: 'U', special: 'O' },
};

type ActionKey = keyof PlayerKeyMap;
type KeySet = Partial<Record<ActionKey, Phaser.Input.Keyboard.Key>>;

export function emptyInput(): PlayerInput {
  return {
    left: false, right: false, up: false, down: false,
    melee: false, weapon: false, special: false,
    meleePressed: false, weaponPressed: false, specialPressed: false,
  };
}

export class InputSystem {
  private readonly keys: KeySet[] = [];
  private readonly prev: PlayerInput[] = [];
  private readonly state: PlayerInput[] = [];

  constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    for (const idx of [0, 1] as const) {
      const map = KEYMAP[idx];
      const keys: KeySet = keyboard
        ? (keyboard.addKeys({ ...map }) as KeySet)
        : {};
      this.keys.push(keys);
      this.prev.push(emptyInput());
      this.state.push(emptyInput());
      if (keyboard) keyboard.addCapture(Object.values(map).join(','));
    }
  }

  update(): void {
    for (let i = 0; i < this.state.length; i++) {
      const st = this.state[i];
      const prev = this.prev[i];
      const held = (action: ActionKey): boolean => {
        const key = this.keys[i][action];
        return !!key && key.isDown;
      };
      st.left = held('left');
      st.right = held('right');
      st.up = held('up');
      st.down = held('down');
      st.melee = held('melee');
      st.weapon = held('weapon');
      st.special = held('special');
      st.meleePressed = st.melee && !prev.melee;
      st.weaponPressed = st.weapon && !prev.weapon;
      st.specialPressed = st.special && !prev.special;
      prev.melee = st.melee;
      prev.weapon = st.weapon;
      prev.special = st.special;
    }
  }

  get(playerIdx: 0 | 1): PlayerInput {
    return { ...this.state[playerIdx] };
  }
}
