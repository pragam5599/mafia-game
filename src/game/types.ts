// Shared game types. Plain JSON only (null, never undefined) so state can live in Firestore.

export type Role = 'mafia' | 'doctor' | 'detective' | 'villager';

/** Roles plus the narrator, for anything that labels a person. */
export type RoleOrNarrator = Role | 'narrator';

export type PlayerId = string;

/** A person in the room, in join order. The narrator is a member but not a player. */
export type Member = { id: PlayerId; name: string };

export type DeathCause = 'night' | 'vote' | 'left';

export type Player = {
  id: PlayerId;
  name: string;
  role: Role;
  alive: boolean;
  death: { cause: DeathCause; round: number } | null;
};

export type Phase =
  | 'roleCheck' // N2 / P3: hold to reveal, acknowledge
  | 'night' // N3–N5 / P4
  | 'dawn' // N6: narrator reviews the night result
  | 'discussion' // N7 / P5–P6
  | 'vote' // P7–P8, N8 live
  | 'reveal' // N8: vote closed, narrator reviews
  | 'roundStatus' // N9
  | 'gameOver'; // N10 / P11

export type Winner = 'town' | 'mafia';
