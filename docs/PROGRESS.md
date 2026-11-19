# Progress

## Phase 1 · Setup + design system — done (2026-10-21), waiting for Pragam's review
- Tools on the Mac (free, no password): Node 22 (nvm), Firebase CLI, Java 21. Git repo started.
- Expo SDK 58 + TypeScript + expo-router. App name "Mafia", dark only.
- `src/theme/`: colors (primitives + semantic), spacing, radius, type scale, effects. All from DESIGN.md / Figma.
- Fonts: Spectral, DM Sans, Barlow Condensed + Bodoni Moda Black (the Figma Wordmark uses it; not in DESIGN.md).
- `src/components/`: Button, Action Chip, Input, OTP Cell, Role Tag, Status Tag, Player Row, Step Bar, Timer,
  Top Bar, Instruction Card, Vote Progress, Chat Bubble, Announcement Card, Role Card, Wordmark, Divider/Deco,
  QR Code (real, scannable), Seal, Pager Dots, Icons, Mode Card, Mode Select Card, Screen frame (glow + gutters).
- Illustrations: rendered from the Figma vectors to PNG @3x in `assets/illustrations/` (checked against Figma renders).
- Preview: the app opens on `app/dev/components.tsx` (every component and variant, interactive).

## Phase 2 · Rules engine + tests — done (2026-10-21), waiting for Pragam's review
- `src/game/`: pure TypeScript, no phone or Firebase code, so Cloud Functions run the same rules.
  - `engine.ts`: the whole game as one state + actions (role check → night → dawn → discussion → vote →
    reveal → round status → game over), with pause, presence, leave, host handover, end game, play again.
  - `roles`, `night`, `vote`, `win`, `timer`, `room`, `username`, `copy`, `visibility` (who may see which role / vote).
  - State is plain JSON (Firestore-ready). Randomness is injected (secure on the server, seeded in tests).
- Tests: `npm test` → 100 passing. `acceptance.test.ts` has one test per RULES.md acceptance line, in the same
  words. `simulation.test.ts` plays 300 random full games (5–21 people) and checks the rules at every step.

## Phase 3 · Firebase — done (2026-10-21)
- Expo moved from SDK 58 to SDK 57: Expo Go for SDK 58 is not in the App Store / Play Store yet.
- Runs on the local Firebase emulators (project `demo-mafia`): free, no account, nothing online.
  `npm run emulators` starts Auth + Firestore + Functions (UI at http://localhost:4000).
- `functions/`: `sendCode` / `verifyCode` (test mode: any number + 123456; real SMS later inside
  `deliverCode`), `checkUsername` (live check + 3 free suggestions), `claimUsername` (once, unique ignoring
  case), `createRoom` / `joinRoom` / `leaveRoom`. The rules engine is copied in at build time.
- `firestore.rules`: own role only (+ partners), narrator-only roles and votes, server-only state,
  dead chat for eliminated players only. Phone numbers never stored in Firestore.
- `src/firebase/`: client setup (phones reach the emulators on the Mac's Wi-Fi address), typed API, live hooks.
- Tests: `npm run test:emulator` → 24 passing (login, usernames, rooms, privacy rules).

## Phase 4 · Account + host screens — done (2026-10-22)
- A1 login (country-code picker), A2 code (6 cells, resend timer, test-mode hint), A3/A4 username (live check,
  3 free suggestions), A5/A5b swipe carousel (backdrops cross-fade, Mode B locked), A5c splash (2 s → H1),
  H1 home, H2 host lobby (real QR, Start from 5), P1 join (camera QR scan in Expo Go, or typed code), P2 lobby.
- Not in Figma, built in the same style: How to play, country picker sheet, Leave chip, "Room not found".
- Phone numbers never go in URLs (kept in memory between A1 and A2).

## Phase 5 · Game — done (2026-10-22)
- Narrator N1–N10 and players P3–P11, all live from the server. Hide roles and Pause on narrator screens.
- Server: `startGame`, `gameAction` (every tap, server sets who is acting), `playAgain`. Three views per state:
  public room doc, private role doc per player, narrator-only control panel.
- Emulator-only test aids: `devAddFakePlayers` (fakes acknowledge and vote by themselves) and a dev narrator
  pick; refused outside the emulators.
- Checked in the web preview end to end: a full game as narrator, and a full game as a player (role reveal,
  night, dawn, discussion, vote, result, killed → "You are out" + dead chat, game over, play again).

## Phase 6 · Edge cases — done (2026-10-22)
- Heartbeats every 15 s; silent 45 s = offline. Narrator offline pauses (host can End game after 2 min, overlay
  shows the countdown); narrator back resumes. Host offline 2 min passes host to the next online in join order
  (with a notice). Narrator screen kept awake.
- Leave game (players): eliminated, role hidden until game over. Back to your room from Home after a dropped
  phone (server keeps `users/{uid}/private/current`, owner-only).
- Heartbeats only write views when something visible changed (keeps real-Firebase costs down later).

## Phase 7 · Polish + README — done (2026-10-22)
- README with plain "how to run on my phone" steps. Tests: 111 engine + 29 server/privacy, all passing.

## Next
- Pragam: try it on iPhone and Android with Expo Go (README).
- App icon added (2026-10-27, from Figma page "App icon"): icon.png 1024, Android adaptive foreground/background/monochrome 512, splash-icon 1024 (moon + hat on transparent), favicon 48. Expo Go shows its own icon; these appear in a dev/store build.

## Notes and open questions
- Expo SDK 57 (not 58) until Expo Go for SDK 58 reaches the stores.
- Decided (Pragam): narrator save card uses the name: "Mafia chose Isha. The Doctor saved Isha."
- Decided (Pragam): keep RULES.md last words "No one died tonight." and "No one was eliminated."
- Rules I had to interpret (tell me if any is wrong):
  - Host can End game only after the narrator has been offline 2 min (not at any time).
  - A narrator who drops and comes back resumes automatically; one who pressed Pause stays paused.
  - The voted-out player dies at "Reveal to all", not when the vote closes.
  - Someone leaving does not trigger a win check; it happens at the next Dawn / Reveal, as RULES.md says.
  - With 2 Detectives, neither can be checked. A Mafia who dies stops seeing partners (sees only own role).
- Figma Chat Bubble (Me) has the "You" label in black on dark red (hard to read). Built with text/secondary. OK?
- Hi-fi screen A2 renders "STEP 2 OF 3" / "VERIFY" in capitals, but the components and rules say sentence case.
  Building sentence case everywhere, as CLAUDE.md says.
- Phones: `npx expo start` in a terminal, scan the QR with Expo Go. The Claude browser preview needs
  `CI=1 npx expo start --web` (its launcher stalls the interactive CLI).

## Release (docs/RELEASE_BRIEF.md)
### Step 1 · Code changes — done (2026-11-20)
- No login: anonymous sign-in. New first screen `app/name.tsx` ("What's your name?", 1–16 characters), saved on
  the device (AsyncStorage) and prefilled; Home name chip opens it to change the name. Flow: Name → A5 → A5c → H1.
- Removed phone + OTP + global usernames (A1–A4 screens, `sendCode`/`verifyCode`/`checkUsername`/`claimUsername`,
  their tests). New `setName` function. Names are unique only inside a room: "Isha is already in this room. Add
  a letter or pick another." (join screen offers Change name). Renaming in a lobby renames you there; not mid-game.
- Room QR = `https://<project>.web.app/join/<CODE>` (`joinLink` in `src/firebase/config.ts`). New route
  `app/join/[code].tsx`: asks the name if needed, then joins that room. The in-app scanner reads the link too.
- Web: `public/index.html` + `manifest.json` + icons, so "Add to Home Screen" looks like an app.
  `firebase.json` hosting serves `dist/`. `npm run build:web`, `npm run deploy`.
- Functions run in `asia-south1` (max 10 instances). Dev fake players stay emulator-only.
- Checks: `npm test` 108, `npm run test:emulator` 24, typecheck clean. Web preview with 2 windows: name,
  join link, name clash, rename, lobby sync — all OK.
- Host can remove players in the lobby (Pragam's request, 2026-11-20): H2 now lists every player; tap a row →
  "Remove Isha?" → `removePlayer` (host only, before Start). The removed phone shows "Room not found … the host
  removed you." They can rejoin with the code. Not in Figma.
- Vote always runs the full 30 s (Pragam, 2026-11-20): it no longer closes early when everyone has voted. Narrator
  (N8) sees the countdown and who voted whom live; at 0 the result appears, then Reveal to all.
- Mode B "The Dealer" (Pragam, 2026-11-20): deal-only mode. Room has `mode`; Proceed deals roles (same engine,
  same privacy rules); players see their card, narrator sees `DealtRoles`; host Deal again (`playAgain` any phase).
  Mode card copy and A5c splash for B are my wording (not in Figma). Back added on N1 / P3 after Play again.
### Step 2–3 · Live, all free (2026-11-20)
- Pragam's rule: no cost, no card. Firebase stays on Spark. Project `mafia5599`: Anonymous auth on, Firestore
  in asia-south1 (production rules deployed), web app registered, Hosting live at https://mafia5599.web.app.
- Server on Vercel Hobby (team pragam-mafia, project mafia-server, bom1): https://mafia-server-ten.vercel.app.
  `functions/api/[name].js` runs the existing functions with the callable protocol. `jose` pinned to 5
  (Vercel's runtime cannot require ESM-only jose 6). Admin key = Vercel sensitive env FIREBASE_SERVICE_ACCOUNT.
- Live test (5 real guest accounts, no fakes): full game to "Town wins"; players cannot read others' roles
  or the narrator panel on the live database.
- Open: an unused second admin key (id 7fc68e6278…) exists; delete it in Google Cloud → IAM → Service accounts.
### Step 4 · APK — next (needs a free Expo account)
