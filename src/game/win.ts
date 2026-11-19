import type { Player, Winner } from './types';

// RULES.md "Win conditions". Players who left are dead here; their role counts even though it stays hidden.

export function teamCounts(players: readonly Player[]): { mafia: number; town: number } {
  const alive = players.filter((p) => p.alive);
  const mafia = alive.filter((p) => p.role === 'mafia').length;
  return { mafia, town: alive.length - mafia };
}

/** Town wins when every Mafia is dead; Mafia wins when alive Mafia ≥ alive Town. */
export function checkWinner(players: readonly Player[]): Winner | null {
  const { mafia, town } = teamCounts(players);
  if (mafia === 0) return 'town';
  if (mafia >= town) return 'mafia';
  return null;
}
