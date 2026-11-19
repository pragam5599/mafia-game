import { defineConfig } from 'vitest/config';

// Runs against the local Firebase emulators (started by `firebase emulators:exec`).
export default defineConfig({
  test: { include: ['tests/emulator/**/*.test.ts'], testTimeout: 30_000, hookTimeout: 30_000, fileParallelism: false },
});
