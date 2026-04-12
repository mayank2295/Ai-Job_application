import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDLmjW36vhbyFFY8Q0JzkoHOYn1dlCwrHQ',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'ecotrack-c3162.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'ecotrack-c3162',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'ecotrack-c3162.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '820321638558',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:820321638558:web:8f8009136360e5fbaf438f',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-K699E5DT0L',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account',
});

if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        getAnalytics(firebaseApp);
      }
    })
    .catch(() => {
      // Analytics is optional for local development.
    });
}
