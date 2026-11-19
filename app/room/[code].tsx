import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Button, Loading, Screen, Spacer, TopBar } from '@/components';
import { useRoom, useSession } from '@/firebase/hooks';
import { GameRoot } from '@/screens/game/GameRoot';
import { HostLobby, PlayerLobby } from '@/screens/Lobby';

// One route per room. Lobby (H2 / P2) until Start, then the game (narrator or player screens).
export default function RoomRoute() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const session = useSession();
  const room = useRoom(code);

  if (session.status === 'loading' || room === undefined) return <Loading />;
  if (session.status !== 'ready') return <Redirect href="/" />;

  const uid = session.user.uid;
  if (room === null || !room.memberIds.includes(uid) || room.status === 'closed') {
    return (
      <Screen>
        <TopBar eyebrow={`Room ${code}`} title="Room not found" subtitle="It may have closed, or the host removed you." />
        <Spacer />
        <Button label="Back to home" onPress={() => router.replace('/home')} />
      </Screen>
    );
  }

  if (room.status === 'playing') return <GameRoot room={room} uid={uid} />;
  return room.hostId === uid ? <HostLobby room={room} uid={uid} /> : <PlayerLobby room={room} uid={uid} />;
}
