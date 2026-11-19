// Every number from docs/RULES.md in one place.

export const MIN_PEOPLE = 5; // 4 players + narrator
export const MAX_PEOPLE = 21; // 20 players + narrator
export const MIN_PLAYERS = MIN_PEOPLE - 1;
export const MAX_PLAYERS = MAX_PEOPLE - 1;

export const ROLE_CHECK_GRACE_MS = 30_000; // narrator may start if someone has not acknowledged
export const DISCUSSION_MS = 3 * 60_000;
export const EXTENSION_MS = 60_000;
export const MAX_EXTENSIONS = 3; // per round
export const VOTE_MS = 30_000;

export const NARRATOR_OFFLINE_END_MS = 2 * 60_000; // host may end the game after this
export const HOST_OFFLINE_HANDOVER_MS = 2 * 60_000;
export const EMPTY_ROOM_CLOSE_MS = 30 * 60_000;

/** Phones say "still here" this often; silent for PRESENCE_TIMEOUT_MS means offline (phone dropped). */
export const HEARTBEAT_MS = 15_000;
export const PRESENCE_TIMEOUT_MS = 45_000;

export const ROOM_CODE_LENGTH = 4;

export const NAME_MAX = 16;

/** Smallest vote count that can eliminate someone. */
export const MIN_VOTES_TO_ELIMINATE = 2;
