# PrepPath

A free SAT + ACT prep game for iOS. It follows a Duolingo-style path with levels, Legendary rounds, XP, streaks with freezes, weekly leagues, daily quests, chests and gems. Questions adapt to each skill, and the app gives a predicted score.

Everything is free. There are no hearts, no lesson limits, no ads and no paywall.

> SAT is a trademark of the College Board. ACT is a trademark of ACT Education Corp. Neither is affiliated with or endorses this app.

## Stack

- **App**: Expo SDK 57, React Native 0.86, expo-router (`src/app`), TypeScript
- **Backend**:
  - Firebase (`preppath-app`): Auth (anonymous, plus Sign in with Apple), Firestore and Cloud Functions
  - React Native Firebase v26 (modular API)
- **Builds**: EAS (`@rollie2347/preppath`). The iOS dev client builds in the cloud, so no Mac is needed.
- **Content**: Claude-generated questions are blind-verified and then human-reviewed before they're published.

## Layout

| Path | What |
| --- | --- |
| `src/app/` | Routes: path (tabs), practice, league, profile, lesson, chest, onboarding |
| `src/components`, `src/data`, `src/state`, `src/lib` | UI, question and lesson loading, session context, Firebase setup |
| `shared/` | Game logic used by both the app and the functions: Elo mastery, question selection, score prediction, XP, streaks, leagues, path, quests. Jest tests are in `shared/__tests__`. |
| `functions/` | Callables `initUser`, `completeLesson`, `openChest`, `buyItem`, and the weekly scheduled `settleLeagues`. The server is authoritative for all XP, gems and progress. |
| `content/taxonomy.json` | The official SAT and Enhanced ACT domains, skills and weights. Every question and mastery record uses these skill IDs. |
| `content/pipeline/` | Content scripts: `generate`, then `verify` (blind solve), `review`, `publish`, `coverage` |
| `firestore.rules`, `firestore.indexes.json` | Security rules and indexes. Clients can never write `game` fields. |

## Setup

```bash
npm install
npm --prefix functions install
npm --prefix content/pipeline install
cp .env.example .env        # then add ANTHROPIC_API_KEY
```

You also need `GoogleService-Info.plist` from the Firebase project. It's committed to the repo, because Firebase iOS config isn't secret. Access is enforced by the rules.

## Run (dev)

Cloud Functions need the Blaze plan, so for now development runs against the local Firebase emulators. The emulators need Java 21+.

```bash
npm run emulators           # Auth 9099, Firestore 8080, Functions 5001 on 0.0.0.0; data saved to .emulator-data/
npx expo start              # open in the PrepPath dev client on the iPhone
```

The phone connects to the emulators on the same LAN IP that Metro uses. Allow node and java through Windows Firewall on Private networks.

New dev client build (only needed after native changes):

```bash
npx eas-cli@latest build --profile development --platform ios
```

## Checks

```bash
npx tsc --noEmit && npx expo lint && npm test
npm --prefix functions run build
```

## Content pipeline

```bash
cd content/pipeline
npm run generate -- --skill <skillId> --difficulty <1-5> --count <n>
npm run verify               # independent blind solve; mismatches are rejected
npm run review               # approve/reject in the terminal
npm run publish -- --dry-run # Firestore + bundled content/pack.json
npm run coverage             # target: 30 approved per skill per difficulty band
```

Official College Board and ACT questions are never ingested. Every question records its source and license.
