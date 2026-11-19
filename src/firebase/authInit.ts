import type { FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

// Web preview: the browser keeps the session by default.
export function createAuth(app: FirebaseApp): Auth {
  return getAuth(app);
}
