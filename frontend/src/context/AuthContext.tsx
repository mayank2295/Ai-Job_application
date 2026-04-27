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
import { auth, googleProvider } from '../lib/firebase';

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://ai-job-application-1.onrender.com/api')
).replace(/\/$/, '');

const ADMIN_EMAIL = 'mayankgupta23081@gmail.com';

export type UserRole = 'admin' | 'candidate';

export type AppUser = {
  firebaseUser: User;
  role: UserRole;
  id: string;
  name: string;
  email: string;
  photoURL: string;
  phone: string;
  skills: string;
  headline: string;
  resumeUrl: string;
};

type AuthContextValue = {
  user: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Build AppUser from Firebase user + optional backend profile
function buildAppUser(firebaseUser: User, backendUser?: any): AppUser {
  const role: UserRole = (backendUser?.role as UserRole) ||
    (firebaseUser.email === ADMIN_EMAIL ? 'admin' : 'candidate');
  return {
    firebaseUser,
    role,
    id: backendUser?.id || firebaseUser.uid,
    name: backendUser?.name || firebaseUser.displayName || '',
    email: firebaseUser.email || '',
    photoURL: backendUser?.photo_url || firebaseUser.photoURL || '',
    phone: backendUser?.phone || '',
    skills: backendUser?.skills || '',
    headline: backendUser?.headline || '',
    resumeUrl: backendUser?.resume_url || '',
  };
}

async function syncWithBackend(firebaseUser: User): Promise<any> {
  const res = await fetch(`${API_BASE}/users/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firebase_uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName || '',
      photo_url: firebaseUser.photoURL || '',
    }),
  });
  if (!res.ok) throw new Error(`Sync failed: ${res.status}`);
  const data = await res.json();
  return data.user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const buildAndSetUser = async (firebaseUser: User) => {
    // Set user immediately with Firebase data for fast UI response
    setUser(buildAppUser(firebaseUser));
    
    try {
      // Sync with backend in background without blocking the UI
      const backendUser = await syncWithBackend(firebaseUser);
      setUser(buildAppUser(firebaseUser, backendUser));
    } catch (err) {
      console.warn('Backend sync failed, using Firebase data only:', err);
    }
  };

  const refreshUser = async () => {
    if (!user?.firebaseUser) return;
    try {
      const res = await fetch(
        `${API_BASE}/users/me?firebase_uid=${encodeURIComponent(user.firebaseUser.uid)}`
      );
      if (!res.ok) throw new Error(`Failed to refresh: ${res.status}`);
      const data = await res.json();
      setUser(buildAppUser(user.firebaseUser, data.user));
    } catch (err) {
      console.warn('refreshUser failed, falling back to sync:', err);
      await buildAndSetUser(user.firebaseUser);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await buildAndSetUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAdmin: user?.role === 'admin',
      refreshUser,
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
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
