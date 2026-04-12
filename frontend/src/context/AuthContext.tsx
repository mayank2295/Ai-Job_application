import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);

      if (nextUser) {
        try {
          await setDoc(
            doc(db, 'users', nextUser.uid),
            {
              uid: nextUser.uid,
              displayName: nextUser.displayName || '',
              email: nextUser.email || '',
              photoURL: nextUser.photoURL || '',
              provider: nextUser.providerData[0]?.providerId || 'google.com',
              lastLoginAt: serverTimestamp(),
            },
            { merge: true },
          );
        } catch (error) {
          console.error('Failed to sync Firebase user profile:', error);
        }
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      async signUpWithEmail(email: string, password: string) {
        await createUserWithEmailAndPassword(auth, email, password);
      },
      async signInWithEmail(email: string, password: string) {
        await signInWithEmailAndPassword(auth, email, password);
      },
      async signInWithGoogle() {
        await signInWithPopup(auth, googleProvider);
      },
      async logout() {
        await signOut(auth);
      },
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
