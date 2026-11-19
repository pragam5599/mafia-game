// Starts the local Firebase (Auth + Firestore + Functions). Free, nothing online.
// Test accounts and rooms are saved to .emulator-data when you stop it (Ctrl+C) and loaded next time.
import { execSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

execSync('npm --prefix functions run build', { stdio: 'inherit' });
const saved = existsSync('.emulator-data/firebase-export-metadata.json');
const args = ['emulators:start', '--project', 'demo-mafia', '--export-on-exit', './.emulator-data'];
if (saved) args.push('--import', './.emulator-data');
spawn('firebase', args, { stdio: 'inherit', shell: process.platform === 'win32' }).on('exit', (code) => process.exit(code ?? 0));
