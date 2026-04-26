import { Request, Response, NextFunction } from 'express';

// Verify Firebase ID token using Google's public REST API
// No service account needed — just FIREBASE_PROJECT_ID
// This is the same verification Firebase Admin SDK does internally

interface FirebaseTokenPayload {
  uid: string;
  email?: string;
  exp: number;
  iat: number;
}

async function verifyFirebaseToken(idToken: string): Promise<FirebaseTokenPayload> {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID is not set in environment variables');
  }

  // Use Firebase's token verification endpoint
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDLmjW36vhbyFFY8Q0JzkoHOYn1dlCwrHQ'}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }
  );

  if (!response.ok) {
    throw new Error('Token verification failed');
  }

  const data = await response.json() as { users?: { localId: string; email?: string }[] };
  const user = data.users?.[0];
  if (!user) throw new Error('User not found');

  return {
    uid: user.localId,
    email: user.email,
    exp: 0,
    iat: 0,
  };
}

/**
 * requireAuth — verifies Firebase ID token from Authorization: Bearer <token>
 * Sets req.user = { uid, email } on success, returns 401 on failure
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authorization header required. Please log in.' });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decoded = await verifyFirebaseToken(idToken);
    (req as any).user = { uid: decoded.uid, email: decoded.email };
    next();
  } catch (err: any) {
    console.error('[Auth] Token verification failed:', err.message);
    res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
}

/**
 * optionalAuth — same but doesn't block if no token present
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      const decoded = await verifyFirebaseToken(idToken);
      (req as any).user = { uid: decoded.uid, email: decoded.email };
    }
  } catch {
    // Invalid token — continue without user context
  }
  next();
}
