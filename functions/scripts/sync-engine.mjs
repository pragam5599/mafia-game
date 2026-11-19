// Copies the shared rules engine (../src/game) into functions/src/game so the server runs
// exactly the rules the app was tested with. The copy is generated; edit ../src/game instead.
import { cpSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const from = join(here, '..', '..', 'src', 'game');
const to = join(here, '..', 'src', 'game');

rmSync(to, { recursive: true, force: true });
cpSync(from, to, {
  recursive: true,
  filter: (src) => !src.includes('__tests__') && !src.endsWith('tsconfig.json'),
});
console.log('Synced rules engine into functions/src/game');
