import { Redirect, useLocalSearchParams } from 'expo-router';
import { Loading } from '@/components';
import { useSession } from '@/firebase/hooks';
import { Join } from '@/screens/Join';

// The room QR's web link (https://<project>.web.app/join/4F7K): name first if needed, then join that room.
export default function JoinLink() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const session = useSession();
  if (session.status === 'loading') return <Loading />;
  if (session.status === 'needsName') return <Redirect href={{ pathname: '/name', params: { next: `/join/${code}` } }} />;
  return <Join initialCode={code} />;
}
