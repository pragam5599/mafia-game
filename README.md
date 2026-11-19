# Mafia

A party game of lies, played in one room. One person is the narrator; everyone else gets a secret role on
their own phone, votes in secret and sees the announcements. No sign-up: you just type your name.

**Play now: https://mafia5599.web.app**

---

## Get the game

### Android

1. Open the [latest release](../../releases/latest) on your phone and tap **Mafia.apk** to download it.
2. Open the downloaded file. If Android asks, allow **"Install unknown apps"** for your browser
   (Settings → Apps → your browser → Install unknown apps → Allow), then go back and tap **Install**.
3. Open **Mafia**, type your name, and you're in.

### iPhone

1. Open **https://mafia5599.web.app** in **Safari**.
2. Tap **Share** (the square with the arrow) → **Add to Home Screen** → **Add**.
3. Open **Mafia** from your home screen. It runs like an app.

Anyone can also just open the link in a browser, on any phone or computer.

---

## How to play

- **Room:** one person taps **Create room**. Everyone else scans the room's QR code with their phone camera
  (or taps **Join room** and types the 4-letter code). **5 to 21 people**, all in the same room in real life.
- **The narrator** is picked at random when the game starts. The narrator doesn't play; they run the game
  out loud from their phone.
- **Roles:** Mafia, Doctor, Detective and Villagers. Hold your card to see your role. Don't show anyone.
- **Night:** everyone closes their eyes. The narrator wakes the Mafia (pick someone to kill), the Doctor
  (save someone) and the Detective (check someone).
- **Day:** the narrator announces who died. You get 3 minutes to argue, then a **30-second secret vote**.
  The top player is out if they have at least 2 votes and there's no tie.
- **Winning:** Town wins when every Mafia is out. Mafia wins when they equal the Town.

Two modes:

- **Mode I · The Narrator:** the full game runs on the phones (night steps, votes, timers).
- **Mode II · The Dealer:** the app only deals the roles. The narrator runs everything else out loud and can
  deal again for the next round.

Room rules: the host can remove people from the lobby; names must be different inside a room.

---

## For Pragam: update and re-release

Everything is on free plans, no card: **Firebase Spark** (sign-in, database, the web link) and **Vercel
Hobby** (the game server). You're already logged in to both, and to Expo and GitHub, on this Mac.

Open Terminal and go to the project first:

```bash
cd "/Users/pragamsingh/Desktop/Pragam/Portfolio/MAFIA Game/mafia-app"
```

**Update the web game (iPhone link):**

```bash
npm run deploy
```

**Update the game server** (only if `functions/` or `src/game/` changed):

```bash
npm run deploy:server
```

**New Android APK:**

1. In `app.json`, raise `"version"` (e.g. `1.0.1`) and `android.versionCode` by 1.
2. Build it (takes 10–40 minutes on Expo's free servers; you get a download link):

```bash
EAS_NO_VCS=1 npx eas-cli build -p android --profile preview
```

3. Download the `.apk`, then publish it as a new GitHub release (change the version and file path):

```bash
gh release create v1.0.1 ~/Downloads/Mafia.apk --title "Mafia 1.0.1" --notes "What changed"
```

**Save the code to GitHub:**

```bash
git add -A && git commit -m "What changed" && git push
```

Secrets stay off GitHub: the server key lives in `~/.mafia-secrets/` and in Vercel's settings only.

---

## For developers

| What | Command |
|---|---|
| Rules engine tests | `npm test` |
| Server + privacy tests, emulators **stopped** | `npm run test:emulator` |
| Same, emulators already running | `npx vitest run -c vitest.emulator.config.ts` |
| Type check | `npm run typecheck` |
| Local server (Firebase emulators) | `npm run emulators` |
| App against the local server | `npx expo start` (Expo Go) or `npx expo start --web` |

Local testing is free and offline: the emulators run on the Mac, and **Dev: add fake players** appears only
there (never in a release).

```
app/            screens (expo-router): name, mode, home, join/[code], room/[code]
src/theme/      design tokens from docs/DESIGN.md
src/components/ one file per design-system component
src/game/       pure TypeScript rules engine (shared with the server), unit-tested
src/firebase/   client setup, typed calls, live hooks
src/screens/    lobby + game screens (narrator N1–N10, players P3–P11)
functions/      the server: names, rooms, the game. Emulators locally; Vercel (api/[name].js) live
firestore.rules privacy: own role only, narrator-only roles and votes, dead chat for the dead
```

The server decides everything (roles, night result, votes, wins, timers). Phones only send taps.

## Troubleshooting

- **"Can not reach the game server"**: check the internet connection. Locally: the emulators are not running.
- **Android won't install**: allow "Install unknown apps" for the app you downloaded it with (see above).
- **iPhone shows browser bars**: open it from the home-screen icon, not from Safari.
