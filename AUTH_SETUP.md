# Auth setup (Firebase Authentication + real Firestore rules)

This replaces the old "admin password" (a hardcoded string checked in the
browser, in `app/players/page.tsx`) with real, server-enforced access
control.

## Access model

- **Read** (viewing players/games/stats): open to everyone, no login —
  same as before.
- **Write** (add player, record/edit a game, edit stats, delete a player,
  clear all data, import legacy stats): requires being signed in. There is
  a single tier — any account you create has full write access to
  everything. (If you later want a "coach can delete, scorekeeper can only
  add stats" split, see "Adding tiers later" below.)

## 1. Enable Email/Password sign-in

Firebase Console → **Build → Authentication → Sign-in method** → enable
**Email/Password** (the plain one, not the passwordless link option).

## 2. Create an account for each teammate who needs to make changes

Firebase Console → **Authentication → Users → Add user**. Enter their email
and a temporary password. Give that password to them directly (Slack/text,
not this repo) — they can change it via **Forgot password?** on the sign-in
dialog in the app, which sends a reset email through Firebase.

You do **not** need an account for people who only view stats — reading is
open to everyone.

## 3. Publish the security rules

Firebase Console → **Firestore Database → Rules**, paste the contents of
`firestore.rules` from this repo, click **Publish**.

If you followed `MIGRATION_GUIDE.md`, you had a *temporary* fully-open rule
set published so the data migration could write without signing in — this
step replaces that with the real, locked-down rules. Do this only after the
migration has finished.

```
allow read: if true;
allow write: if request.auth != null;
```

This is enforced on Firebase's servers — even if someone bypasses the app
UI entirely and calls the Firestore API directly, they still can't write
without a valid signed-in session.

## 4. How it works in the app

- `lib/authStore.ts` — a small Zustand store wrapping Firebase Auth
  (`onAuthStateChanged`, sign in, sign out, password reset, and a
  `requireAuth()` helper).
- `components/SignInDialog.tsx` — the sign-in form, mounted globally in
  `app/layout.tsx`.
- `components/Navbar.tsx` — shows **Sign In** when logged out, or the
  signed-in email + **Sign Out** when logged in.
- Every write action (`app/players/page.tsx`'s add/edit/delete/import/clear,
  `app/record/page.tsx`'s save game) calls `requireAuth()` first. If nobody
  is signed in, it pops open the sign-in dialog instead of attempting the
  write — this is just a UX nicety; `firestore.rules` is what actually
  enforces the restriction, so this can't be bypassed by tampering with the
  frontend.

There's no self-serve signup screen — accounts are only created via the
Firebase Console (step 2), since anyone who can create an account gets full
write access.

## Adding tiers later (optional)

If you later want e.g. "only a couple of admins can delete/import, but any
signed-in teammate can add stats", the cleanest approach is:

1. Add an `admins` collection in Firestore with one document per admin,
   keyed by their Firebase Auth UID (`admins/{uid}`, doc can be empty or
   `{ role: "admin" }`).
2. Change the relevant rules to check for it, e.g. for deletes:
   ```
   allow delete: if request.auth != null &&
     exists(/databases/$(database)/documents/admins/$(request.auth.uid));
   ```
3. In the app, gate the delete/import buttons the same way (check an
   `isAdmin` flag you load from that collection after sign-in) so the
   buttons are hidden/disabled for non-admins, in addition to the
   server-side rule.
