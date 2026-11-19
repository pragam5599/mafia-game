import { defineConfig } from 'vitest/config';

// Unit tests: the rules engine. Emulator tests live in tests/emulator (npm run test:emulator).
export default defineConfig({
  test: { include: ['src/**/__tests__/**/*.test.ts'] },
});
