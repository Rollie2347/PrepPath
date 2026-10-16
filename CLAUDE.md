@AGENTS.md

## ⚠️ Reminder for Rollie at the start of every session (until done)
**Upgrade Firebase project `preppath-app` to the Blaze plan**, then deploy functions:
1. https://console.firebase.google.com/project/preppath-app/usage/details → upgrade, and set a budget alert (e.g. $1).
2. `npx firebase-tools deploy --only functions --project preppath-app`
3. Remove `EXPO_PUBLIC_USE_EMULATORS=1` from `.env` so the app talks to production.
4. Delete this reminder section.

## Project: PrepPath
Free SAT + ACT iOS prep game with Duolingo-style progression (path, levels, Legendary, XP, streak freezes,
leagues, quests, chests, gems). **No hearts, lesson limits, ads or paywall — ever.** Clean-room build; never
reverse-engineer or copy BrainBlast, and never ingest official College Board / ACT questions.
Full plan: `~/.claude/plans/delegated-gliding-whistle.md`. Repo: https://github.com/Rollie2347/PrepPath (public).

## Infrastructure (set up 2026-10-15)
- **Firebase** `preppath-app` (Spark plan), CLI logged in as the user's Google account; `.firebaserc` default.
  - iOS app `1:885124185732:ios:e1e331f888ed4e38330cd1`, bundle `com.rollie.preppath`; `GoogleService-Info.plist`
    is committed (not secret).
  - Deployed: Firestore `(default)` + `firestore.rules` + `firestore.indexes.json`; Auth anonymous provider via
    `firebase.json` `auth.providers` (`deploy --only auth`). Apple provider: enable in console (free on Spark).
  - **Not deployed**: functions (need Blaze — see reminder).
- **gcloud** is installed but its token needs `gcloud auth login` (interactive) before use. `firebase deploy`
  enables required APIs itself, so gcloud usually isn't needed.
- **EAS** project `@rollie2347/preppath` (id in `app.json`), Apple team 3VQJ7HHANK. iPhone registered; the
  development build succeeded. Rebuild only after native changes.
- **Secrets**: `ANTHROPIC_API_KEY` lives in root `.env` (gitignored, along with every `.env.*`; see
  `.env.example`). Pipeline scripts load it with `tsx --env-file=../../.env`. Never give it an `EXPO_PUBLIC_`
  prefix. Service-account JSONs are gitignored.

## Dev loop (emulators until Blaze)
- `npm run emulators` — builds functions, starts Auth 9099 / Firestore 8080 / Functions 5001 on 0.0.0.0, persists
  to `.emulator-data/`. Needs Java 21+ (installed). `settleLeagues` doesn't run locally (no Pub/Sub emulator).
- `npx expo start` — dev client. `src/lib/firebase.ts` connects to the emulators when `__DEV__` and
  `EXPO_PUBLIC_USE_EMULATORS=1`, using the Metro host IP (`Constants.expoConfig.hostUri`).
- Checks before done: `npx tsc --noEmit`, `npx expo lint`, `npm test` (Jest, `shared/__tests__`),
  `npm --prefix functions run build`.

## Code conventions
- `shared/` is the single source of game logic (Elo, selection, score, XP, streak, league, path, quests), imported
  as `@shared/*` in the app; `functions/scripts/sync-shared.js` copies it into `functions/src` at build time
  (the copies are gitignored — edit `shared/`, never the copies).
- The server is authoritative: clients may only write `activeTest`, `dailyXpGoal`, `avatar` on `users/{uid}` and
  `bookmarks` on progress. All XP/gems/streak/league changes go through callables.
- RN Firebase v26 **modular** API only (`getFirestore()`, `doc()`, …), not the namespaced `firestore()` API.
- Content pipeline (`content/pipeline`, ESM + tsx) uses `claude-opus-5-5`; generation costs money — get the
  user's OK on batch size first.

## Open work
Railway Claude tutor (`claude-sonnet-5-5`, ID-token auth, daily cap, SSE, moderation); full-length SAT/ACT mocks
with SAT module-2 routing; diagnostic placement UI (`placedUnits` currently sent empty); open-licensed bank
ingest (license research); sound assets; offline KaTeX bundle (MathText uses jsdelivr); real app icon (still the
Expo template `assets/expo.icon`); choose a LICENSE (none yet = all rights reserved); first question batch
(start with SAT Math).
