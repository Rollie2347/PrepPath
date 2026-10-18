@AGENTS.md

## Project: PrepPath
Free SAT + ACT iOS prep game with Duolingo-style progression (path, levels, Legendary, XP, streak freezes,
leagues, quests, chests, gems). **No hearts, lesson limits, ads or paywall — ever.** Clean-room build; never
reverse-engineer or copy BrainBlast, and never ingest official College Board / ACT questions.
Full plan: `~/.claude/plans/delegated-gliding-whistle.md`. Repo: https://github.com/Rollie2347/PrepPath (public).

## Infrastructure (set up 2026-10-15)
- **Firebase** `preppath-app` (Blaze plan), CLI logged in as the user's Google account; `.firebaserc` default.
  - iOS app `1:885124185732:ios:e1e331f888ed4e38330cd1`, bundle `com.rollie.preppath`; `GoogleService-Info.plist`
    is committed (not secret).
  - Deployed: Firestore `(default)` + `firestore.rules` + `firestore.indexes.json`; Auth anonymous provider via
    `firebase.json` `auth.providers` (`deploy --only auth`). Apple provider: enable in console (free on Spark).
  - Deployed functions (Blaze, us-central1): initUser, completeLesson, completeDiagnostic, openChest, buyItem,
    settleLeagues, reportUser, deleteAccount. Artifact cleanup policy: 1 day.
- **gcloud** is installed but its token needs `gcloud auth login` (interactive) before use. `firebase deploy`
  enables required APIs itself, so gcloud usually isn't needed.
- **EAS** project `@rollie2347/preppath` (id in `app.json`), Apple team 3VQJ7HHANK. iPhone registered; the
  development build succeeded. Rebuild only after native changes.
- **Secrets**: `ANTHROPIC_API_KEY` lives in root `.env` (gitignored, along with every `.env.*`; see
  `.env.example`). Pipeline scripts load it with `tsx --env-file=../../.env`. Never give it an `EXPO_PUBLIC_`
  prefix. Service-account JSONs are gitignored.

## Dev loop (production by default; emulators optional)
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

## Launch setup (2026-10-17)
- Hosting: `public/` → https://preppath-app.web.app (`/privacy`, `/terms`, `/support`); links in `src/constants/links.ts`.
- Functions added: `completeDiagnostic`, `reportUser` (2 distinct reports hide a name; review `reports/{uid}`),
  `deleteAccount` (App Store 5.1.1(v); client revokes Sign in with Apple first). Display names filtered with
  `obscenity` in `initUser`.
- Clients may also write `tests` (add only) and `blocked` on `users/{uid}`.
- Listing copy, privacy labels, age-rating answers: `docs/app-store-listing.md`. iPad support is off for 1.0.
- Icon source: `assets/icon-source/*.html` (rendered to `assets/images/icon.png` with headless Chrome).

## Question authoring without API spend
`content/authored/*.ts` hold questions written in Claude Code sessions; `cd content/pipeline && npx tsx ingest.ts
../authored/<file>.ts [--write]` validates them (format rules, prose-in-math, near-duplicates, and a `check`
expression that recomputes every math key) and appends them as approved. Passage sets use `at`/`finalize`/
`shuffled` from `authored/helpers.ts` (correct text outside the underline, NO CHANGE kept near 25%, stable
answer shuffles). Then `npx tsx --env-file=../../.env publish.ts`. `npx tsx tally.ts <prefix>` shows coverage.

## Open work
Railway Claude tutor (`claude-sonnet-5-5`, ID-token auth, daily cap, SSE, moderation); full-length SAT/ACT mocks
with SAT module-2 routing; diagnostic placement UI (`placedUnits` currently sent empty); open-licensed bank
ingest (license research); sound assets; offline KaTeX bundle (MathText uses jsdelivr); choose a LICENSE (none
yet = all rights reserved); more questions per skill (currently 10–30; aim for 25+ everywhere).
