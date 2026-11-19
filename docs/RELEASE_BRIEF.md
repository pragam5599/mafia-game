# Release brief: play with friends (APK + web + GitHub)

Goal: Pragam's friends can play from their own phones, anywhere, with no setup.
Android: install an APK. iPhone: open the game in the browser (and "Add to Home Screen").
Anyone joins by scanning the room QR or typing the room code. The code is on GitHub.

Pragam is a designer, not a developer. Do everything you can yourself on this Mac.
When a step needs him (accounts, payment card, logins), stop and give exact, numbered
clicks in plain words, then wait. Keep credits lean: no extra features.

## Decisions (already made, do not re-ask)
1. **Server: real Firebase project online** (Auth, Firestore, Cloud Functions, Hosting).
   Pragam creates the project with his Google account and upgrades to Blaze (card needed;
   small games stay in the free usage). Region `asia-south1`. Set a budget alert (e.g. ₹200)
   in Google Cloud Billing and show him how.
2. **No login.** Remove phone number + OTP (A1 phone, A2 code) and the global unique
   username (A3/A4). Use Firebase **anonymous auth**. First screen: "What's your name?"
   (1–16 characters, anything readable). Save the name on the device and prefill it next
   time; let the player change it from Home (tap the name chip). Names only need to be
   unique **inside a room**: if a name is already in the room, ask for another
   ("Isha is already in this room. Add a letter or pick another.").
   New flow: Name → Choose mode (A5) → Mode locked in (A5c) → Home (H1). Keep the Back
   buttons. Remove `sendCode/verifyCode/checkUsername/claimUsername` and their tests, or
   replace them with a `setName` path. Keep everything else in RULES.md.
3. **Web version for iPhone (and anyone):** `npx expo export -p web`, deploy to Firebase
   Hosting (`https://<project>.web.app`). Add a web app manifest + the app icon so
   "Add to Home Screen" looks like an app. Camera QR scanning in the web app is optional;
   typing the code must work.
4. **QR = a web link:** the room QR encodes `https://<project>.web.app/join/<CODE>`.
   Any phone camera opens it: the browser game opens straight into that room's join.
   The in-app scanner (APK) also reads the code out of that link.
5. **Android APK:** EAS Build, profile `preview` with `android.buildType: "apk"`.
   Pragam makes a free Expo account (expo.dev) and logs in (`npx eas login`).
   Set the `EXPO_PUBLIC_FIREBASE_*` keys for the live project in `eas.json` / env.
6. **GitHub:** public repo `mafia-game` under Pragam's account (`gh auth login` first).
   Never commit: `.env*` with secrets, `.emulator-data/`, `*-debug.log`, `node_modules`,
   service-account files. (Firebase web config keys are fine to be public; security comes
   from `firestore.rules`.) Put the APK in a **GitHub Release**, not in the repo.
7. **iPhone native app:** out of scope (needs Apple Developer, $99/year). Web only.
8. Dev-only buttons ("Dev: add fake players") must not appear in the live build.
   Keep the emulator setup working for local testing.

## Steps
1. Make the code changes (decisions 2, 4, 8). Update tests; `npm test`,
   `npm run test:emulator` and `npm run typecheck` must pass. Check the flow in the web
   preview with 2 browser windows.
2. Pragam: create Firebase project + Blaze + budget alert (guide him). Add a Web app in
   Firebase to get the config. Enable Anonymous sign-in.
3. Deploy: `firestore.rules`, indexes, functions, hosting. Test a full game on the live
   web link with fake players turned off (use 2–5 browser windows / phones).
4. Pragam: Expo account + login. Build the APK with EAS; test install on an Android phone.
5. Pragam: `gh auth login`. Create the repo, push, create Release v1.0.0 with the APK.
6. README (top of repo) for friends, in plain words:
   - Android: download the APK from Releases (allow "install unknown apps").
   - iPhone: open the web link in Safari → Share → Add to Home Screen.
   - How to play (short) + room rules (5 to 21 people, one narrator).
   Also a short "for Pragam" section: how to update and re-release.
7. Update `docs/PROGRESS.md` and `CLAUDE.md` (stack: anonymous auth, live Firebase).

## Done when
- A friend with Android installs the APK, types a name, scans the QR, and plays.
- A friend with iPhone scans the QR with the Camera app and plays in Safari.
- The repo is on GitHub with the APK in Releases and a clear README.
