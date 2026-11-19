// A rule was broken. `code` is stable so the server and UI can react to it.
export type GameErrorCode =
  | 'notEnoughPeople'
  | 'tooManyPeople'
  | 'wrongPhase'
  | 'notNarrator'
  | 'notHost'
  | 'notAPlayer'
  | 'notAlive'
  | 'paused'
  | 'invalidTarget'
  | 'noPick'
  | 'noBackStep'
  | 'alreadyVoted'
  | 'rolesNotSeen'
  | 'extensionCap'
  | 'narratorNotOfflineLongEnough'
  | 'roomCodesExhausted';

export class GameError extends Error {
  constructor(
    public readonly code: GameErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'GameError';
  }
}
