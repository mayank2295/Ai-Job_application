# LinkedIn Authentication Setup Guide

This repository currently supports Firebase Authentication with Google and email/password. LinkedIn does not have a built-in Firebase provider, so the recommended path is to use **LinkedIn OAuth** in the backend, then mint a **Firebase custom token** for the frontend to complete sign-in.

The steps below outline the minimal changes needed to add a "Continue with LinkedIn" option without reworking the existing auth flow.

---

## 1) Create a LinkedIn App

1. Go to the LinkedIn Developer Portal and create a new app.
2. Enable **Sign In with LinkedIn**.
3. Add your callback URL (example):
   - `https://your-backend-domain.com/api/auth/linkedin/callback`
4. Copy the **Client ID** and **Client Secret**.

---

## 2) Add Backend OAuth + Firebase Custom Token

Create a new route (e.g. `backend/src/routes/auth.ts`) with:

1. **GET** `/api/auth/linkedin/start`
   - Redirects to LinkedIn’s authorization URL.
2. **GET** `/api/auth/linkedin/callback`
   - Exchanges the `code` for an access token.
   - Fetches the user profile + email from LinkedIn.
   - Calls `firebase-admin` to generate a **custom token**:
     ```ts
     const customToken = await admin.auth().createCustomToken(linkedInUserId, {
       email,
       name,
       photo_url,
     });
     ```
   - Redirects back to the frontend with the token (or returns JSON).

Add env vars to `backend/.env`:
```
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
LINKEDIN_REDIRECT_URI=https://your-backend-domain.com/api/auth/linkedin/callback
```

---

## 3) Frontend: Add “Continue with LinkedIn”

Update these files:

- `frontend/src/pages/LoginPage.tsx`
  - Add a LinkedIn button near the Google button.
  - Open `/api/auth/linkedin/start` in the same window.
- `frontend/src/context/AuthContext.tsx`
  - Add a `signInWithLinkedIn()` helper that:
    1. Receives the custom token from the callback URL.
    2. Uses `signInWithCustomToken(auth, token)`.

Optional: display LinkedIn-specific errors in `getAuthErrorMessage`.

---

## 4) Keep the Existing Sync Flow

No backend changes are required in `users.ts`. Once Firebase login completes, the existing `/api/users/sync` flow will continue to populate PostgreSQL using the LinkedIn-backed Firebase UID.

---

## 5) Checklist (for implementation)

- [ ] LinkedIn app created with correct redirect URI
- [ ] Backend OAuth exchange + Firebase custom token
- [ ] Frontend button + token handling
- [ ] Firebase auth sync still functional (`/api/users/sync`)

---

## Notes

- LinkedIn’s OAuth scopes usually include `r_liteprofile` and `r_emailaddress`.
- If you prefer a hosted OAuth solution, Auth0 can provide LinkedIn as a social connection and still issue Firebase-compatible tokens.
