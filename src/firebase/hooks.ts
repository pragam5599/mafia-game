import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, doc, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { DeadChatMessage, NarratorView, RoleDoc, RoomDoc, UserDoc } from '@/game/model';
import { auth, db } from './config';

// Live data hooks. Firestore pushes every change to every phone (the "sync" arrows in the flow).

export type Session =
  | { status: 'loading' }
  | { status: 'needsName' }
  | { status: 'ready'; user: User; profile: UserDoc };

/** Who this device is (anonymous sign-in), and whether they have typed a name yet. */
export function useSession(): Session {
  const [user, setUser] = useState<User | null | undefined>(auth.currentUser ?? undefined);
  const [profile, setProfile] = useState<UserDoc | null | undefined>(undefined);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!user) {
      setProfile(user === null ? null : undefined);
      return;
    }
    setProfile(undefined);
    return onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => setProfile(snap.exists() ? (snap.data() as UserDoc) : null),
      () => setProfile(null),
    );
  }, [user]);

  if (user === undefined) return { status: 'loading' };
  if (user === null) return { status: 'needsName' };
  if (profile === undefined) return { status: 'loading' };
  if (!profile?.username) return { status: 'needsName' };
  return { status: 'ready', user, profile };
}

/** The room doc, live. `null` = not found or not a member. */
export function useRoom(code: string | undefined): RoomDoc | null | undefined {
  const [room, setRoom] = useState<RoomDoc | null | undefined>(undefined);
  useEffect(() => {
    if (!code) return setRoom(null);
    setRoom(undefined);
    return onSnapshot(
      doc(db, 'rooms', code),
      (snap) => setRoom(snap.exists() ? (snap.data() as RoomDoc) : null),
      () => setRoom(null),
    );
  }, [code]);
  return room;
}

/** Live doc at `path`, or null when it does not exist / is not readable. Undefined while loading. */
function useDocAt<T>(path: string | null): T | null | undefined {
  const [value, setValue] = useState<T | null | undefined>(undefined);
  useEffect(() => {
    if (!path) return setValue(null);
    setValue(undefined);
    return onSnapshot(
      doc(db, path),
      (snap) => setValue(snap.exists() ? (snap.data() as T) : null),
      () => setValue(null),
    );
  }, [path]);
  return value;
}

/** My role (+ Mafia partners, my vote). */
export function useRoleDoc(code: string, uid: string) {
  return useDocAt<RoleDoc>(`rooms/${code}/roles/${uid}`);
}

/** The narrator's control-panel data. Only readable by the narrator. */
export function useNarratorView(code: string, isNarrator: boolean) {
  return useDocAt<NarratorView>(isNarrator ? `rooms/${code}/narrator/view` : null);
}

export type ChatMessage = DeadChatMessage & { id: string };

/** Dead chat, newest last. Only readable by eliminated players. */
export function useDeadChat(code: string, enabled: boolean): ChatMessage[] {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  useEffect(() => {
    if (!enabled) return setMessages([]);
    const q = query(collection(db, `rooms/${code}/deadChat`), orderBy('sentAt', 'asc'), limit(200));
    return onSnapshot(
      q,
      (snap) => setMessages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as DeadChatMessage) }))),
      () => setMessages([]),
    );
  }, [code, enabled]);
  return messages;
}

/**
 * Seconds left on a server timer. The server sends "remaining as of now"; the phone counts down from
 * when it received it, so phone clocks that are off by a few seconds do not matter.
 */
export function useCountdown(timer: { remainingMs: number; running: boolean } | null | undefined, stampKey: unknown): number {
  const [received, setReceived] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setReceived(Date.now());
    setNow(Date.now());
  }, [stampKey]);
  useEffect(() => {
    if (!timer?.running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [timer?.running, stampKey]);
  if (!timer) return 0;
  const left = timer.running ? timer.remainingMs - (now - received) : timer.remainingMs;
  return Math.max(0, Math.ceil(left / 1000));
}

/** The room I am in (for "Back to your game" after a dropped phone). Null when none. */
export function useCurrentRoomCode(uid: string | null): string | null | undefined {
  const current = useDocAt<{ code: string }>(uid ? `users/${uid}/private/current` : null);
  return current === undefined ? undefined : (current?.code ?? null);
}
