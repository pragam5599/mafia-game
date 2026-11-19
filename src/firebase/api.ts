import { FirebaseError } from 'firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInAnonymously } from 'firebase/auth';
import { httpsCallable, httpsCallableFromURL } from 'firebase/functions';
import type { Action } from '@/game/engine';
import type { RoomMode } from '@/game/model';
import { auth, functions, serverUrl } from './config';

// Typed wrappers around the Cloud Functions. The server decides; these only ask.

function call<Req, Res>(name: string) {
  // Live: the free Vercel server (same protocol). Emulators: the local Cloud Functions.
  const fn = serverUrl
    ? httpsCallableFromURL<Req, Res>(functions, `${serverUrl}/api/${name}`)
    : httpsCallable<Req, Res>(functions, name);
  return async (data: Req): Promise<Res> => (await fn(data)).data;
}

export const api = {
  setName: call<{ name: string }, { name: string }>('setName'),
  createRoom: call<{ mode: RoomMode }, { code: string }>('createRoom'),
  joinRoom: call<{ code: string }, { code: string }>('joinRoom'),
  leaveRoom: call<{ code: string }, { code: string }>('leaveRoom'),
  removePlayer: call<{ code: string; playerId: string }, { code: string }>('removePlayer'),
  startGame: call<{ code: string }, { code: string }>('startGame'),
  /** The server fills in who is acting (`by`); phones cannot act for someone else. */
  gameAction: call<{ code: string; action: ActionInput }, { changed: boolean }>('gameAction'),
  playAgain: call<{ code: string }, { code: string }>('playAgain'),
  devAddFakePlayers: call<{ code: string; count: number }, { code: string }>('devAddFakePlayers'),
};

/** An engine action without `by` (the server sets it from the signed-in user). */
export type ActionInput = Action extends infer A ? (A extends { by: string } ? Omit<A, 'by'> : A) : never;

const NAME_KEY = 'mafia.name';
const MODE_KEY = 'mafia.mode';

/** The mode picked on A5 (Create room uses it). Remembered on this device. */
export async function savedMode(): Promise<RoomMode> {
  return (await AsyncStorage.getItem(MODE_KEY).catch(() => null)) === 'B' ? 'B' : 'A';
}

export function saveMode(mode: RoomMode): Promise<void> {
  return AsyncStorage.setItem(MODE_KEY, mode).catch(() => undefined);
}

/** The name typed last time on this device (prefills the name screen). */
export async function savedName(): Promise<string> {
  return (await AsyncStorage.getItem(NAME_KEY).catch(() => null)) ?? '';
}

/** No login: sign in anonymously (once per device), then save the name on the server and the device. */
export async function saveName(name: string): Promise<void> {
  if (!auth.currentUser) await signInAnonymously(auth);
  const res = await api.setName({ name });
  await AsyncStorage.setItem(NAME_KEY, res.name).catch(() => undefined);
}

/** The server's reason code (e.g. "nameTaken", "full") and message, for showing on screen. */
export function readError(e: unknown): { reason: string | null; message: string } {
  if (e instanceof FirebaseError) {
    const details = (e as FirebaseError & { details?: { reason?: string } }).details;
    if (e.code === 'functions/unavailable' || e.code === 'functions/internal') {
      return { reason: 'offline', message: 'Can not reach the game server. Check your Wi-Fi and try again.' };
    }
    return { reason: details?.reason ?? null, message: e.message.replace(/ \[\d+\]$/, '') }; // SDK appends " [409]"
  }
  return { reason: null, message: 'Something went wrong. Try again.' };
}
