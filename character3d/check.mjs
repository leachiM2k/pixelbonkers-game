import * as THREE from 'three';
import { buildCharacter } from './model.js';
import { POSE_ORDER, applyPose } from './poses.js';
import { CHARACTER_ORDER, getCharacter } from './characters.js';

for (const name of CHARACTER_ORDER) {
  const { config } = getCharacter(name);
  const char = buildCharacter(config);
  const j = char.joints;
  const fp = char.footPoints;
  const standPx = config.standPx ?? 92;

  applyPose(j, 'idle_0', fp);
  char.root.updateMatrixWorld(true);
  const standH = new THREE.Box3().setFromObject(char.root).getSize(new THREE.Vector3()).y;
  const ppm = standPx / standH;
  console.log(`\n=== ${name.toUpperCase()} (Stehhöhe ${standH.toFixed(2)}m, ${ppm.toFixed(1)}px/m, Sprite ${standPx}px) ===`);

  let problems = 0;
  for (const pose of POSE_ORDER) {
    applyPose(j, pose, fp);
    char.root.updateMatrixWorld(true);
    const size = new THREE.Box3().setFromObject(char.root).getSize(new THREE.Vector3());
    const v = new THREE.Vector3();
    let lowest = Infinity;
    for (const ank of [j.ankR, j.ankL]) for (const p of fp) {
      v.set(p[0], p[1], p[2]);
      ank.localToWorld(v);
      lowest = Math.min(lowest, v.y);
    }
    const w = size.x * ppm, h = size.y * ppm;
    const bad = lowest < -0.005 ? ' UNTER BODEN' : w > 98 ? ` ZU BREIT (${w.toFixed(0)}px)` : h > 97 ? ` ZU HOCH (${h.toFixed(0)}px)` : '';
    if (bad) { console.log(`${pose.padEnd(10)} ${w.toFixed(0)}x${h.toFixed(0)}px Boden=${lowest.toFixed(3)}${bad}`); problems++; }
  }
  console.log(problems === 0 ? 'alle 28 Posen ok' : `${problems} Problem-Pose(n)`);
}
