// firebase/auth ships getReactNativePersistence only in its React Native build, which TypeScript
// does not pick up. Declare it so authInit.native.ts type-checks.
import type { Persistence } from 'firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
