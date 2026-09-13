import { spawnSync } from 'node:child_process';
import { CHARACTER_ORDER } from './characters.js';

const only = process.argv[2] ?? null;
const names = only ? [only] : CHARACTER_ORDER;

for (const name of names) {
  console.log(`\n### ${name.toUpperCase()}`);
  for (const script of ['generate.mjs', 'pixelate.mjs']) {
    const r = spawnSync('node', [script, name], { stdio: 'inherit' });
    if (r.status !== 0) {
      console.error(`${script} für ${name} fehlgeschlagen`);
      process.exit(r.status ?? 1);
    }
  }
}
console.log('\nFertig:', names.join(', '));
