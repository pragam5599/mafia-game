# Screens and flow

Figma file key `Ai6pEhc01eQZwiwn1nd6wQ`, page "Mode 1 Hi-fi" (node 22:2).
Fetch any screen with the Figma MCP using the node ID below.

## Screen list
| ID | Screen | Who | Node | Main content |
|---|---|---|---|---|
| A1 | Log in or sign up | Everyone | 32:3 | Phone + country code, Send code |
| A2 | Enter the code | Everyone | 32:33 | 6 OTP cells, resend timer, Verify |
| A3 | Username · available | New accounts | 32:61 | Live check, "available" |
| A4 | Username · taken | New accounts | 32:82 | "Already taken", suggestions, Continue locked |
| A5 | Choose mode · Mode A | Everyone | 38:1376 | Poster carousel, Mode I focused, Play |
| A5b | Choose mode · Mode B (locked) | Everyone | 46:3496 | Mode II focused, Coming soon |
| A5c | Mode locked in | Everyone | 46:4228 | Splash ~2 s, auto → H1 |
| H1 | Home | Everyone | 32:108 | Signed in as, Create room, Join room |
| H2 | Host lobby | Host | 32:136 | QR, code, players, Start (5+ joined) |
| P1 | Join game | Players | 35:927 | Scan QR or type code |
| P2 | Lobby (waiting) | Players | 35:950 | Player list, waiting for host |
| N1 | Narrator reveal | Narrator | 33:270 | "You are the Narrator", open control panel |
| N2 | Role check | Narrator | 33:304 | Roles, who has seen, Hide roles, Start game |
| P3a | Role reveal · hidden | Players | 49:6546 | Hold to reveal |
| P3 | Role reveal · Mafia | Players | 35:1030 | Mafia art + partners |
| P3b/c/d | Role reveal · Doctor / Detective / Villager | Players | 49:6768 / 49:7020 / 49:7298 | Role-specific art |
| N3 | Night · Mafia (scrolls) | Narrator | 33:405 | Step bar, players + roles, tap target, Confirm |
| N4 | Night · Doctor (scrolls) | Narrator | 33:510 | Shows Mafia target, Back + Confirm |
| N5 | Night · Detective (scrolls) | Narrator | 33:615 | YES/NO result, Back + Finish night |
| P4 | Night | Players | 35:1064 | Dim, identical for everyone |
| N6 | Dawn (scrolls) | Narrator | 33:725 | Result, statuses, Announce to all |
| P5 | Dawn announcement (scrolls) | Players | 35:1084 | Who died + role, last words, who is left |
| N7 | Discussion timer | Narrator | 33:819 | 3:00, +1 min (max 3), Start voting |
| P6 | Day discussion | Players | 35:1167 | Alive list, read-only timer |
| P7 | Vote | Players | 35:1198 | 30 s timer, pick a player or None |
| P8 | Vote locked | Players | 35:1286 | Waiting, Voted X of N |
| N8 | Vote results (scrolls) | Narrator | 33:845 | Who voted whom, totals, Reveal to all |
| P9 | Vote result | Players | 35:1304 | Eliminated, role, last words |
| P10 | You are out | Eliminated | 35:1376 | Own role, dead-only chat |
| N9 | Round status | Narrator | 33:945 | Alive/eliminated, win check, next night |
| N10 | Game over (scrolls) | Narrator | 33:1037 | Winner, final roles |
| P11 | Game over (host) (scrolls) | Players | 35:1413 | Winner, final roles, Play again (host) |

## One game, tap by tap
Board: page "Game flow · One game" (node 53:2). Kinds: **tap** = user action,
**auto** = happens by itself, **sync** = server pushes the change to other phones.

| # | From → To | Kind | What happens |
|---|---|---|---|
| 1 | A1 → A2 | tap | Tap "Send code" · OTP sent |
| 2 | A2 → A3 | tap | Enter 6 digits · "Verify" (new account) |
| 2b | A2 → A5 | auto | Returning player skips username |
| 3 | A3 → A5 | tap | Name available · "Continue" |
| 4 | A5 → A5c | tap | "Play Mode A" · dissolve (swiping shows Mode II, locked) |
| 5 | A5c → H1 | auto | After 2 s · dissolve |
| 6 | H1 → H2 | tap | Host taps "Create room" · QR + code (e.g. 4F7K) |
| 7 | H1 → P1 | tap | Others tap "Join room" |
| 8 | P1 → P2 | tap | Scan QR or type code · "Join room" |
| 9 | H2 → N1 | sync | Host taps "Start game" (5+ joined) · narrator picked at random |
| 10 | P2 → P3a | sync | Game starts · role assigned, card hidden |
| 11 | N1 → N2 | tap | "Open control panel" |
| 12 | P3a → P3 | tap | Hold card to reveal (art per role) |
| 13 | P3 → N2 | sync | "I have seen my role" → narrator sees "Seen" |
| 14 | N2 → N3 | tap | All seen (or 30 s) · "Start game" |
| 15 | N2 → P4 | sync | Night starts on every phone |
| 16 | N3 → N4 | tap | Mafia point · tap target · Confirm |
| 17 | N4 → N5 | tap | Doctor points · Confirm (Back allowed) |
| 18 | N5 → N6 | tap | Detective points · YES/NO · "Finish night" |
| 19 | N6 → P5 | sync | "Announce to all" |
| 20 | N6 → N7 | tap | "Announce to all" · discussion 3:00 |
| 21 | P5 → P6 | auto | Discussion starts |
| 22 | N7 → N8 | tap | +1 min (max 3) · "Start voting (30 s)" |
| 23 | N7 → P7 | sync | Vote opens on phones |
| 24 | P7 → P8 | tap | Pick a player · "Confirm vote" |
| 25 | P8 → N8 | sync | Votes arrive live · only narrator sees who voted whom |
| 26 | N8 → N9 | tap | "Reveal to all" |
| 27 | N8 → P9 | sync | Result on every phone |
| 28 | P9 → P10 | auto | On the eliminated player's phone: You are out + dead chat |
| 29 | N9 → N3 | tap | Win check: continue · "Start night 2" (repeat 14–28) |
| 30 | N9 → N10 | auto | Win reached → game over |
| 31 | N10 → P11 | sync | Win screen on every phone · host sees Play again |

Transitions: dissolve / cross-fade between screens; A5 carousel uses a horizontal swipe.
