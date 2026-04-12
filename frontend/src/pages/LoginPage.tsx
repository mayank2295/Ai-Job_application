import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Bot, Building2, LogIn, MapPin, Sparkles, Star } from 'lucide-react';
import './LoginPage.css';
import { useAuth } from '../context/AuthContext';
import { isFirebaseConfigured } from '../lib/firebase';

const highlightedJobs = [
  { role: 'Frontend Engineer', company: 'Orbit Labs', location: 'Bangalore', match: '96%' },
  { role: 'Product Designer', company: 'Pixel Loom', location: 'Remote', match: '91%' },
  { role: 'AI Intern', company: 'Neura Systems', location: 'Pune', match: '94%' },
  { role: 'Full Stack Dev', company: 'Blue Grid', location: 'Hyderabad', match: '90%' },
  { role: 'Data Analyst', company: 'InsightHive', location: 'Delhi', match: '88%' },
];

function getAuthErrorMessage(error: unknown, method: 'email-signin' | 'email-signup' | 'google') {
  const code = (error as { code?: string } | null)?.code;

  if (code === 'firebase/not-configured') {
    return 'Firebase is not configured for the frontend. Add VITE_FIREBASE_* variables in your hosting environment (or frontend/.env.local) and redeploy.';
  }

  if (code === 'auth/operation-not-allowed') {
    if (method === 'email-signin' || method === 'email-signup') {
      return 'Email/password authentication is disabled. Enable it in Firebase Console > Authentication > Sign-in method.';
    }
    return 'Google sign-in is disabled. Enable Google provider in Firebase Console > Authentication > Sign-in method.';
  }

  if (code === 'auth/email-already-in-use') return 'This email is already registered. Please sign in instead.';
  if (code === 'auth/weak-password') return 'Password is too weak. Use at least 6 characters.';
  if (code === 'auth/invalid-email') return 'Please enter a valid email address.';
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') return 'Invalid email or password.';
  if (code === 'auth/user-not-found') return 'No account found with this email.';
  if (code === 'auth/popup-closed-by-user') return 'Google sign-in was canceled before completion.';

  if (method === 'email-signup') return 'Sign up failed. Please try again.';
  return method === 'email-signin' ? 'Email sign-in failed. Please try again.' : 'Google sign-in failed. Please try again.';
}

export default function LoginPage() {
  const { user, signUpWithEmail, signInWithEmail, signInWithGoogle } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [googleSigningIn, setGoogleSigningIn] = useState(false);
  const [authError, setAuthError] = useState('');
  const redirectTarget =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/dashboard';

  if (!isFirebaseConfigured) {
    return <Navigate to="/dashboard" replace />;
  }

  if (user) {
    return <Navigate to={redirectTarget} replace />;
  }

  const handleEmailAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSigningIn(true);
    setAuthError('');

    try {
      if (isSignUpMode) {
        await signUpWithEmail(email.trim(), password);
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (error: unknown) {
      setAuthError(getAuthErrorMessage(error, isSignUpMode ? 'email-signup' : 'email-signin'));
    } finally {
      setSigningIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleSigningIn(true);
    setSigningIn(true);
    setAuthError('');

    try {
      await signInWithGoogle();
    } catch (error: unknown) {
      setAuthError(getAuthErrorMessage(error, 'google'));
    } finally {
      setGoogleSigningIn(false);
      setSigningIn(false);
    }
  };

  return (
    <div className="apple-login-page">
      <div className="apple-grid-overlay" />
      <div className="apple-orb apple-orb-a" />
      <div className="apple-orb apple-orb-b" />

      <main className="apple-login-shell">
        <motion.section
          className="jobs-visual-wrap"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="jobs-panel-head">
            <span className="jobs-chip"><Sparkles size={13} /> Live job feed</span>
            <h2>Find better roles faster</h2>
            <p>Track matching jobs and continue with Google or email to save your pipeline.</p>
          </div>

          <div className="jobs-marquee">
            <motion.div
              className="jobs-track"
              animate={{ x: [0, -460] }}
              transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
            >
              {[...highlightedJobs, ...highlightedJobs].map((job, index) => (
                <article className="job-card" key={`${job.role}-${index}`}>
                  <div className="job-card-top">
                    <span className="job-badge"><Star size={12} /> {job.match} match</span>
                  </div>
                  <h3>{job.role}</h3>
                  <p><Building2 size={13} /> {job.company}</p>
                  <p><MapPin size={13} /> {job.location}</p>
                </article>
              ))}
            </motion.div>
          </div>

          <div className="jobs-stats-row">
            <div>
              <strong>4.8k+</strong>
              <span>Active openings</span>
            </div>
            <div>
              <strong>92%</strong>
              <span>Avg profile match</span>
            </div>
            <div>
              <strong>24h</strong>
              <span>Fast apply cycle</span>
            </div>
          </div>
        </motion.section>

        <motion.section
          className="apple-auth-wrap"
          initial={{ opacity: 0, y: 22, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <div className="apple-auth-card">
            <div className="apple-brand-row">
              <Bot size={18} />
              <span>JobFlow AI</span>
            </div>

            <div className="apple-auth-header">
              <h2>{isSignUpMode ? 'Sign up' : 'Sign in'}</h2>
              <p>{isSignUpMode ? 'Create account first, then continue to dashboard.' : 'Welcome back to your workspace.'}</p>
            </div>

            <form className="apple-auth-form" onSubmit={handleEmailAuth}>
              <label className="apple-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="apple-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />

              <label className="apple-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="apple-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                autoComplete={isSignUpMode ? 'new-password' : 'current-password'}
                minLength={6}
                required
              />

              <button type="submit" className="apple-btn apple-btn-primary btn-reset" disabled={signingIn}>
                {signingIn && !googleSigningIn
                  ? isSignUpMode
                    ? 'Creating account...'
                    : 'Signing in...'
                  : isSignUpMode
                    ? 'Create account'
                    : 'Sign in'}
                <ArrowRight size={16} />
              </button>
            </form>

            <button
              type="button"
              className="apple-switch btn-reset"
              onClick={() => {
                setAuthError('');
                setIsSignUpMode((value) => !value);
              }}
              disabled={signingIn}
            >
              {isSignUpMode ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>

            <div className="apple-divider"><span>or</span></div>

            <button
              type="button"
              className="apple-btn apple-btn-ghost btn-reset"
              onClick={handleGoogleLogin}
              disabled={signingIn}
            >
              {googleSigningIn ? 'Connecting...' : 'Continue with Google'}
              {!googleSigningIn && <LogIn size={16} />}
            </button>

            {authError && <p className="apple-auth-error">{authError}</p>}

            <p className="apple-note">Enable Email/Password and Google providers in Firebase Authentication.</p>
            <Link to="/" className="apple-back-home">Back to landing page</Link>
          </div>
        </motion.section>
      </main>
    </div>
  );
}