import { GameError } from './errors';
import type { Player, PlayerId, Role } from './types';

// Night, RULES.md "Night rules". Each role's whole turn (wake, act, close eyes) is one step.

export type NightRole = Exclude<Role, 'villager'>;
export const NIGHT_ORDER: readonly NightRole[] = ['mafia', 'doctor', 'detective'];

export type NightDraft = {
  step: NightRole;
  picks: { mafia: PlayerId | null; doctor: PlayerId | null; detective: PlayerId | null };
  /** Roles with nobody alive. With 2 Doctors/Detectives, skipped only when both are dead. */
  skipped: NightRole[];
};

export type NightResult = {
  round: number;
  targetId: PlayerId;
  savedId: PlayerId | null;
  checkedId: PlayerId | null;
  checkedIsMafia: boolean | null;
  /** Null when the Doctor saved the target. */
  killedId: PlayerId | null;
  skipped: NightRole[];
  lastWords: string;
};

export function aliveWithRole(players: readonly Player[], role: Role): Player[] {
  return players.filter((p) => p.alive && p.role === role);
}

function rolesWithNobodyAlive(players: readonly Player[]): NightRole[] {
  return NIGHT_ORDER.filter((r) => r !== 'mafia' && aliveWithRole(players, r).length === 0);
}

export function startNight(players: readonly Player[]): NightDraft {
  return { step: 'mafia', picks: { mafia: null, doctor: null, detective: null }, skipped: rolesWithNobodyAlive(players) };
}

/** Who the narrator may tap on this step. Only alive players are listed. */
export function validTargets(players: readonly Player[], step: NightRole): PlayerId[] {
  return players
    .filter((p) => {
      if (!p.alive) return false;
      if (step === 'mafia') return p.role !== 'mafia'; // can't pick a partner
      if (step === 'detective') return p.role !== 'detective'; // never themselves
      return true; // Doctor: anyone alive, including themselves
    })
    .map((p) => p.id);
}

/** Tapping another name changes the pick. */
export function pickTarget(draft: NightDraft, players: readonly Player[], targetId: PlayerId): NightDraft {
  if (!validTargets(players, draft.step).includes(targetId)) {
    throw new GameError('invalidTarget', `${targetId} cannot be picked on the ${draft.step} step.`);
  }
  return { ...draft, picks: { ...draft.picks, [draft.step]: targetId } };
}

function activeSteps(draft: NightDraft): NightRole[] {
  return NIGHT_ORDER.filter((r) => !draft.skipped.includes(r));
}

export function isLastStep(draft: NightDraft): boolean {
  const steps = activeSteps(draft);
  return steps[steps.length - 1] === draft.step;
}

/** Confirm (or "Finish night" on the last step). Returns finished = true after the last step. */
export function confirmStep(draft: NightDraft): { draft: NightDraft; finished: boolean } {
  if (draft.picks[draft.step] === null) {
    throw new GameError('noPick', `Tap who the ${draft.step} pointed at first.`);
  }
  const steps = activeSteps(draft);
  const next = steps[steps.indexOf(draft.step) + 1];
  return next ? { draft: { ...draft, step: next }, finished: false } : { draft, finished: true };
}

/** Back returns to the previous step with its pick kept, so it can be changed. Step 1 has no Back. */
export function backStep(draft: NightDraft): NightDraft {
  const steps = activeSteps(draft);
  const prev = steps[steps.indexOf(draft.step) - 1];
  if (!prev) throw new GameError('noBackStep', 'The Mafia step has no Back.');
  return { ...draft, step: prev };
}

/** Recompute skips for steps still ahead (someone may have left mid-night). */
export function refreshSkips(draft: NightDraft, players: readonly Player[]): NightDraft {
  const doneOrNow = NIGHT_ORDER.slice(0, NIGHT_ORDER.indexOf(draft.step) + 1);
  const ahead = rolesWithNobodyAlive(players).filter((r) => !doneOrNow.includes(r));
  const kept = draft.skipped.filter((r) => doneOrNow.includes(r));
  const picks = { ...draft.picks };
  for (const r of NIGHT_ORDER) {
    const id = picks[r];
    if (id !== null && !players.some((p) => p.id === id && p.alive)) picks[r] = null;
  }
  return { ...draft, skipped: [...kept, ...ahead], picks };
}

/** Is that player Mafia? The Detective only ever learns yes or no. */
export function detectiveAnswer(players: readonly Player[], checkedId: PlayerId): boolean {
  return players.some((p) => p.id === checkedId && p.role === 'mafia');
}

export function resolveNight(draft: NightDraft, players: readonly Player[], round: number, lastWords: string): NightResult {
  const targetId = draft.picks.mafia;
  if (targetId === null) throw new GameError('noPick', 'The Mafia have not picked a target.');
  const savedId = draft.skipped.includes('doctor') ? null : draft.picks.doctor;
  const checkedId = draft.skipped.includes('detective') ? null : draft.picks.detective;
  return {
    round,
    targetId,
    savedId,
    checkedId,
    checkedIsMafia: checkedId === null ? null : detectiveAnswer(players, checkedId),
    killedId: savedId === targetId ? null : targetId,
    skipped: draft.skipped,
    lastWords,
  };
}

export type StepState = 'now' | 'done' | 'skipped' | 'upcoming';

/** For the Step Bar: Step n · now / done / skipped. */
export function stepStates(draft: NightDraft): Record<NightRole, StepState> {
  const current = NIGHT_ORDER.indexOf(draft.step);
  const out = {} as Record<NightRole, StepState>;
  NIGHT_ORDER.forEach((r, i) => {
    out[r] = draft.skipped.includes(r) ? 'skipped' : i === current ? 'now' : i < current ? 'done' : 'upcoming';
  });
  return out;
}
