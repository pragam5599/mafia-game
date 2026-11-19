// Pausable countdown stored as plain data. Running when `endsAt` is set; paused keeps `remainingMs`.
export type Timer = {
  totalMs: number; // for progress bars; grows when time is added
  endsAt: number | null;
  remainingMs: number;
};

export function startTimer(ms: number, now: number): Timer {
  return { totalMs: ms, endsAt: now + ms, remainingMs: ms };
}

export function timeLeft(t: Timer, now: number): number {
  return t.endsAt === null ? t.remainingMs : Math.max(0, t.endsAt - now);
}

export function isExpired(t: Timer, now: number): boolean {
  return timeLeft(t, now) <= 0;
}

export function pauseTimer(t: Timer, now: number): Timer {
  return t.endsAt === null ? t : { ...t, endsAt: null, remainingMs: timeLeft(t, now) };
}

export function resumeTimer(t: Timer, now: number): Timer {
  return t.endsAt !== null ? t : { ...t, endsAt: now + t.remainingMs };
}

/** Adds time to what is left (a timer already at 0:00 restarts from the added time). */
export function extendTimer(t: Timer, ms: number, now: number): Timer {
  const left = timeLeft(t, now) + ms;
  return {
    totalMs: Math.max(t.totalMs, left),
    endsAt: t.endsAt === null ? null : now + left,
    remainingMs: left,
  };
}
