import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { api, readError, type ActionInput } from '@/firebase/api';
import type { NarratorView, PublicGame, PublicPlayer, RoleDoc, RoomDoc } from '@/game/model';
import type { PlayerId } from '@/game/types';
import { notify } from '@/ui/confirm';

// Everything a game screen needs: the public view, my private role, the narrator's view (if any),
// and `act` to send a tap to the server.

export type Game = {
  code: string;
  room: RoomDoc;
  game: PublicGame;
  uid: PlayerId;
  me: PublicPlayer | null; // null for the narrator
  isNarrator: boolean;
  isHost: boolean;
  role: RoleDoc | null | undefined;
  narrator: NarratorView | null | undefined;
  /** Sends an action. Resolves true when the server accepted it. */
  act: (action: ActionInput) => Promise<boolean>;
  busy: boolean;
};

const Ctx = createContext<Game | null>(null);

export function useGame(): Game {
  const g = useContext(Ctx);
  if (!g) throw new Error('useGame outside GameProvider');
  return g;
}

type Props = Omit<Game, 'act' | 'busy'> & { children: ReactNode };

export function GameProvider({ children, ...value }: Props) {
  const [busy, setBusy] = useState(false);
  const { code } = value;
  const act = useCallback(
    async (action: ActionInput) => {
      setBusy(true);
      try {
        await api.gameAction({ code, action });
        return true;
      } catch (e) {
        // Ticks are best-effort; everything else tells the person what went wrong.
        if (action.type !== 'tick' && action.type !== 'presence') notify('Not now', readError(e).message);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [code],
  );
  return <Ctx.Provider value={{ ...value, act, busy }}>{children}</Ctx.Provider>;
}

/** "Night 1 · Step 1 of 3" helpers. */
export const dayLabel = (round: number) => `Day ${round}`;
export const nightLabel = (round: number) => `Night ${round}`;
