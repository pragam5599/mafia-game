import { Redirect } from 'expo-router';
import { Loading } from '@/components';
import { useSession } from '@/firebase/hooks';

// Front door: no name yet → Name, everyone else → Home (H1).
export default function Index() {
  const session = useSession();
  if (session.status === 'loading') return <Loading />;
  if (session.status === 'needsName') return <Redirect href="/name" />;
  return <Redirect href="/home" />;
}
