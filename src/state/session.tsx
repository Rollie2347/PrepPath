import { onAuthStateChanged, signInAnonymously, type User } from '@react-native-firebase/auth';
import { doc, onSnapshot } from '@react-native-firebase/firestore';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import type { ProgressDoc, UserDoc } from '@shared/user';

import { auth, db } from '@/lib/firebase';

interface Session {
  user: User | null;
  profile: UserDoc | null;
  progress: ProgressDoc;
  /** False until auth and the first snapshot of the user doc have resolved. */
  ready: boolean;
  error: Error | null;
}

const EMPTY_PROGRESS: ProgressDoc = { nodes: {}, mastery: {}, bookmarks: [], mistakes: [], recent: [] };

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [progress, setProgress] = useState<ProgressDoc>(EMPTY_PROGRESS);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        // Everyone starts anonymous; Sign in with Apple links onto the same uid later.
        if (!u) signInAnonymously(auth).catch(setError);
      }),
    [],
  );

  useEffect(() => {
    if (!user) return;
    const unsubUser = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        setProfile(snap.exists() ? (snap.data() as UserDoc) : null);
        setReady(true);
      },
      setError,
    );
    const unsubProgress = onSnapshot(
      doc(db, 'users', user.uid, 'state', 'progress'),
      (snap) => setProgress({ ...EMPTY_PROGRESS, ...(snap.data() as Partial<ProgressDoc> | undefined) }),
      setError,
    );
    return () => {
      unsubUser();
      unsubProgress();
    };
  }, [user]);

  return <SessionContext value={{ user, profile, progress, ready, error }}>{children}</SessionContext>;
}

export function useSession(): Session {
  const s = use(SessionContext);
  if (!s) throw new Error('useSession must be used inside SessionProvider');
  return s;
}
