# Supabase → Firestore Migration Guide

This repo has been switched from Supabase (Postgres) to Firebase Firestore.
Follow these steps to finish the cutover.

## What changed in the code

- `lib/supabase.ts` removed, replaced by `lib/firebase.ts` (Firestore client init).
- `lib/store.ts` rewritten: every Supabase query/insert/update/delete call is
  now the Firestore equivalent (`getDocs`, `addDoc`, `updateDoc`,
  `deleteDoc`, `writeBatch`). The public store API (`useStore`, `Player`,
  `Game`, `PlayerStats`) is unchanged, so `app/*` and `components/*` did not
  need any edits.
- `package.json`: `@supabase/supabase-js` removed, `firebase` added.
- `firestore.rules` added — **public read, auth-required write** (not a
  plain copy of the old open Supabase policy). Reading players/games/stats
  needs no login, same as before; writing anything requires being signed
  in via Firebase Authentication. See **`AUTH_SETUP.md`** for the full
  setup (enabling Email/Password sign-in, creating teammate accounts,
  publishing the rules) — step 4 below points you there at the right
  moment.
- `lib/authStore.ts`, `components/SignInDialog.tsx`, and updates to
  `components/Navbar.tsx` / `app/players/page.tsx` / `app/record/page.tsx`
  add the sign-in UI and replace the old client-side-only "admin password"
  check with real `requireAuth()` gating in front of every write action.
- `supabase_schema.sql` kept for reference only (marked legacy at the top).
- Firestore field names are camelCase directly (`isFinished`, `playerId`,
  `gameId`) instead of Postgres's snake_case (`is_finished`, `player_id`,
  `game_id`) — this matches the app's TypeScript interfaces exactly, so
  `lib/store.ts` no longer needs to translate between the two.

## 1. Create the Firebase project

1. Go to https://console.firebase.google.com → **Add project** (or reuse an
   existing one).
2. In the project, open **Build → Firestore Database → Create database**.
   Choose **Production mode** (rules are applied separately below) and
   whatever region you want (e.g. `asia-east1` for Taiwan).
3. Go to **Project settings → General → Your apps → Add app → Web**. Give it
   a nickname (e.g. "ntpu-pf-ob-stats"), skip Firebase Hosting unless you
   want it, and copy the `firebaseConfig` object it shows you — you'll need
   it twice (once for the migration tool, once for the app itself).

## 2. Temporarily open Firestore rules so the migration can write

`migrate.html` (step 3) writes directly to Firestore using the client SDK,
**without signing in** — so it needs permissive rules while it runs. A
brand-new "Production mode" Firestore database defaults to fully locked
(`allow read, write: if false`), which would make every migration write
fail with `permission-denied`.

In the Firebase Console: **Firestore Database → Rules**, paste this
temporary rule set and click **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

You'll replace this with the real, locked-down rules in step 4, *after*
the migration and after Auth is set up — don't leave this published.

## 3. Migrate the existing data

Open **`migrate.html`** (in this repo) directly in your browser — no build
step needed, it's a standalone page. It:

- Reads all rows from the old Supabase database (the Supabase URL + public
  anon key are pre-filled — this is the same key that was already hardcoded
  in `lib/supabase.ts`, so no extra Supabase access is required).
- Writes them into Firestore using the Firebase Web config you paste in,
  **preserving the original row IDs** (so `stats` rows keep pointing at the
  right `players`/`games` documents — no foreign-key remapping needed).

Steps on the page:
1. Click **Preview** — confirms it can read Supabase and shows row counts.
2. Paste your `firebaseConfig` object (from step 1) into the Firebase config
   box.
3. Click **Run Migration**. Watch the log for `DONE. created/updated=...`.
4. Spot-check in the Firebase Console → Firestore Database that
   `players`, `games`, and `stats` collections look right.

This is safe to re-run: by default it **skips documents that already
exist** (same ID). Check "Overwrite documents that already exist" only if
you intentionally want to re-copy over existing Firestore data.

## 4. Set up Auth and publish the real security rules

Now that data is in Firestore, follow **`AUTH_SETUP.md`**: enable
Email/Password sign-in, create an account for each teammate who needs
write access, then paste the real `firestore.rules` from this repo
(public read, sign-in required to write) into Firebase Console →
**Firestore Database → Rules** and **Publish**, replacing the temporary
open rules from step 2.

## 5. Configure the app

```bash
cp .env.local.example .env.local
```

Fill in the six `NEXT_PUBLIC_FIREBASE_*` values from the same
`firebaseConfig` object used in step 3.

```bash
npm install   # picks up the `firebase` package, drops @supabase/supabase-js
npm run dev
```

Verify players/games/stats load correctly, then `npm run build` before
deploying.

If you deploy on Vercel (or similar), add the same six env vars in the
project's environment settings.

## 6. Clean up

Once you've confirmed the app works end-to-end on Firestore:

- Delete `migrate.html` (or leave it — it has no secrets baked in besides
  the already-public Supabase anon key).
- Optionally pause/delete the Supabase project once you're confident you no
  longer need it as a fallback.
- Remove `supabase_schema.sql` if you don't want to keep it for reference.

## Note on the previous Supabase security posture

The old `lib/supabase.ts` had the Supabase URL and **anon key hardcoded as
literal fallback values**, and `supabase_schema.sql` set every table's RLS
policy to `for all using (true)` — i.e. full public read/write with no
authentication, gated only by a client-side password check that anyone
could bypass by reading the source. That meant anyone who found the public
GitHub repo already had full read/write access to the database.

This migration fixes that: `firestore.rules` now requires a real,
server-verified Firebase Auth sign-in for every write (see
`AUTH_SETUP.md`), while keeping reads public since spectators/parents
viewing stats was never the concern. If you later decide even *reading*
should require login, flip `allow read: if true;` to `allow read: if
request.auth != null;` for each collection in `firestore.rules`.
