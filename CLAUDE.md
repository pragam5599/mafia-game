# Mafia (Mode A) — build brief

You are building a mobile app (iOS + Android) for an in-person Mafia party game.
Everything is designed and every rule is decided. Do not re-open decisions; build.
Ask Pragam only when something is truly missing from these docs. He is a designer:
keep questions short and numbered, and explain setup steps in plain words.

## What the game is
- Mode A: a human narrator runs the game out loud. Every player uses their own phone
  for their secret role, a private vote and announcements. The narrator's phone is a
  control panel.
- Mode B "The Dealer" (decided by Pragam 2026-11-20): the app only deals roles. Create/join a room, the host taps
  Proceed, one random narrator and the same role mix as Mode A; players see their role, the narrator sees every
  role and is the only one who can Deal again. No night, vote or timers in the app. (An app-narrated mode is not in scope.)
- English only, no sound, no haptics in v1.

## Read these first (in this folder)
1. `docs/RULES.md` — all game rules, edge cases, copy, acceptance tests. Source of truth.
2. `docs/SCREENS.md` — every screen, its Figma node ID, and the one-game click-through flow.
3. `docs/DESIGN.md` — colors, type, spacing, radius, effects, components, illustrations.

## Figma (the designs)
File key: `Ai6pEhc01eQZwiwn1nd6wQ`
- Hi-fi screens (build from these): https://www.figma.com/design/Ai6pEhc01eQZwiwn1nd6wQ/Mafia-Mode-A-Wireframes?node-id=22-2
- Design system: https://www.figma.com/design/Ai6pEhc01eQZwiwn1nd6wQ/Mafia-Mode-A-Wireframes?node-id=27-82
- One-game flow with arrows (what taps lead where): https://www.figma.com/design/Ai6pEhc01eQZwiwn1nd6wQ/Mafia-Mode-A-Wireframes?node-id=53-2
- Low-fi wireframes (layout reference only): page "Mode 1 Low-fi" (node 0:1)
- Older flow board (FigJam, v7 is newest, lacks the mode-select step): https://www.figma.com/board/Tv7TvlbyOywswpDqgoKtQd

Use the Figma MCP server (`get_design_context`, `get_screenshot`, `get_variable_defs`)
with the node IDs in `docs/SCREENS.md`. If Figma MCP is not connected, ask Pragam to
connect it once; `docs/DESIGN.md` has the tokens so you can start without it.
Export illustrations (role art, key art, seal) from their Figma components as PNG @3x
into `assets/illustrations/`.

## Decided tech stack
- Expo (React Native) + TypeScript + expo-router. Must run in Expo Go for testing.
- Fonts via `@expo-google-fonts`: Spectral, Barlow Condensed, DM Sans.
- Firebase (FREE Spark plan, no card — Pragam's rule: no cost): Anonymous Auth, Firestore (asia-south1),
  Hosting (https://mafia5599.web.app). Project id `mafia5599`, alias `live` in .firebaserc.
- Server: the same Cloud Functions code (functions/src), run live on Vercel's free Hobby plan
  (https://mafia-server-ten.vercel.app, region bom1) via functions/api/[name].js, which speaks the Firebase
  callable protocol. Locally it still runs in the Firebase emulators. Cloud Functions on Firebase need Blaze:
  do not use them. The Vercel secret FIREBASE_SERVICE_ACCOUNT holds the admin key (file kept in
  ~/.mafia-secrets/, never in the repo). Deploy: `npm run deploy:server`, `npm run deploy` (rules + web).
- No login: anonymous auth + "What's your name?" (see docs/RULES.md). Names unique only inside a room.
- Server decides: role assignment, night result, vote tally, win check and timers run
  in Cloud Functions, never on a phone. 
- Privacy via Firestore rules: a player can read only their own role (+ Mafia partners).
  Only the narrator can read all roles and who voted whom. Dead chat is readable only by
  eliminated players.

## Suggested project layout
```
mafia-app/
  CLAUDE.md, docs/
  app/            expo-router screens (auth/, home, host/, narrator/, player/)
  src/theme/      tokens from docs/DESIGN.md (no hard-coded colors in screens)
  src/components/ one file per design-system component
  src/game/       pure TS rules engine (shared with functions), unit-tested
  src/firebase/   client SDK setup, hooks for room/game/role/votes
  functions/      Cloud Functions (TypeScript)
  firestore.rules, firebase.json
  assets/illustrations/
```

## Build in phases (stop and show Pragam after each)
1. Setup + design system: theme tokens, fonts, core components, a component preview screen.
2. Rules engine + unit tests (all acceptance tests in RULES.md pass).
3. Firebase: project config, test-OTP login, username (unique, case-insensitive), rooms.
4. Account + host screens: A1–A5c, H1, H2, P1, P2 (lobby works across phones).
5. Game: N1–N10 and P3–P11, live on every phone.
6. Edge cases: disconnects, host handover, pause, leave, play again.
7. Polish + README with "how to run on my phone" in plain steps.

## Rules for you
- Match the hi-fi screens closely: spacing, type, colors, copy. Text is sentence case
  exactly as written; never uppercase it in code.
- Use tokens from `src/theme`, never raw hex in screens.
- Mobile frame is 390 × 844. Screens named "(scrolls)" scroll.
- Night: each role's whole turn (wake, act, close eyes) is inside its own step. See the
  say-aloud script in RULES.md.
- Keep a short `docs/PROGRESS.md` log: what's done, what's next, any open question.
