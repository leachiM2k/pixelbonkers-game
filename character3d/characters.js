import { TEEN_CONFIG, BRUNO_CONFIG, LINO_CONFIG, POLDI_CONFIG, SPD1_CONFIG, SPD2_CONFIG, TNK1_CONFIG, TNK2_CONFIG, JMP1_CONFIG, JMP2_CONFIG } from './model.js';

export const CHARACTERS = {
  teen: { prefix: 'teen', label: 'TEEN', config: TEEN_CONFIG },
  bru: { prefix: 'bru', label: 'BRUNO', config: BRUNO_CONFIG },
  lin: { prefix: 'lin', label: 'LINO', config: LINO_CONFIG },
  pol: { prefix: 'pol', label: 'POLDI', config: POLDI_CONFIG },
  spd1: { prefix: 'spd1', label: 'SPEEDY P1', config: SPD1_CONFIG },
  spd2: { prefix: 'spd2', label: 'SPEEDY P2', config: SPD2_CONFIG },
  tnk1: { prefix: 'tnk1', label: 'TANK P1', config: TNK1_CONFIG },
  tnk2: { prefix: 'tnk2', label: 'TANK P2', config: TNK2_CONFIG },
  jmp1: { prefix: 'jmp1', label: 'JUMPER P1', config: JMP1_CONFIG },
  jmp2: { prefix: 'jmp2', label: 'JUMPER P2', config: JMP2_CONFIG },
};

export const CHARACTER_ORDER = ['teen', 'bru', 'lin', 'pol', 'spd1', 'spd2', 'tnk1', 'tnk2', 'jmp1', 'jmp2'];

export function getCharacter(name) {
  return CHARACTERS[name] ?? CHARACTERS.teen;
}
