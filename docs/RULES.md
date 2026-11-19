# Rules — Mafia Mode A (source of truth)

## Roles and player counts
A game has 4–20 players plus 1 narrator (room holds 5–21 people). The narrator is not a player.

| Players | Mafia | Doctor | Detective | Villagers |
|---|---|---|---|---|
| 4–5 | 1 | 1 | 1 | 1–2 |
| 6–9 | 2 | 1 | 1 | 2–5 |
| 10–12 | 3 | 1 | 1 | 5–7 |
| 13–20 | 4 | 2 | 2 | 5–12 |

- **Mafia:** know each other (partners shown on the role card). Each night they agree on one target. Cannot target a partner at night; may vote for one in the day.
- **Doctor:** saves one alive player each night. Can save themselves, and the same person on consecutive nights.
- **Detective:** checks one alive player each night, never themselves. The narrator answers yes/no (Mafia or not). Never learns the exact role.
- **Villager:** no night action.
- **Narrator:** picked at random, sees every role, runs the game, does not vote.
- "Town" = everyone who is not Mafia.

## Accounts and lobby
- **No login:** anonymous sign-in. First screen asks "What's your name?" (1–16 readable characters). The name is saved on the device and prefilled next time; change it from Home (tap the name chip).
- **Name:** only unique inside a room, ignoring case. If taken: "Isha is already in this room. Add a letter or pick another."
- **Mode select (A5):** after the name screen every player sees a swipeable poster carousel: Mode I "The Narrator" and Mode II "The Dealer". Backdrop changes with the focused card. Tap Play → A5c "Mode locked in" splash ~2 s → Home (H1). The picked mode is remembered on the device and decides the rooms you create; joiners follow the room's mode.
- **Mode B "The Dealer":** same lobby (5–21, QR, remove players). The host taps Proceed instead of Start game. The server picks one narrator at random and deals the same role mix as Mode A. Players hold their card to see their role; the narrator sees every role. Nothing else runs in the app (no night, vote, timers or pause): the narrator runs the game out loud. Only the narrator can Deal again, at any time (new roles, new narrator). Players can only view their role, go Back or Leave.
- **Room:** any signed-in player can create a room and becomes host. 4-character code (unique among open rooms) + QR. Join by scanning or typing the code. Empty room closes after 30 minutes.
- **Start:** host can press Start once 5 people have joined. Nobody can join after Start.
- **Narrator pick:** at Start the server picks the narrator at random from everyone, host included. Roles are then assigned at random to the rest. The host is a normal player unless picked.
- **Role check:** each player holds the card to reveal their role and taps "I have seen my role". The narrator's card also starts hidden: "Tap to reveal" (both modes). The narrator sees who has acknowledged and taps Start game. If someone hasn't acknowledged, the narrator can start after 30 seconds.
- **Play again:** host starts a new game in the same room; narrator and roles are re-picked at random.

## Game flow
Starts at Night 1, then repeats Night → Dawn → Discussion → Vote → Reveal until the win check ends it. Win check runs after Dawn and after every Reveal.

| Phase | Narrator | Players see | Screens |
|---|---|---|---|
| Role check | Sees who acknowledged, taps Start game | Role card (hold to reveal), partners if Mafia, acknowledge | N2, P3 |
| Night | Confirms 3 steps: Mafia, Doctor, Detective | Dim Night screen, identical for everyone | N3–N5, P4 |
| Dawn | Taps Announce to all | Who died (or no one), their role, auto last words, who is left | N6, P5 |
| Discussion | 3:00 timer, +1 min up to 3 times per round | Read-only timer, talk in person | N7, P6 |
| Vote | Taps Start voting, sees who voted whom | 30 s secret vote, then Vote locked with "Voted: X of N" | N8, P7, P8 |
| Reveal | Reviews result, taps Reveal to all | Eliminated player, role, last words, or "No one was eliminated" | N8, P9 |
| Round status | Alive/eliminated list, win check, next night | Updated list | N9 |
| Game over | Final roles | Winner + final roles; host gets Play again | N10, P11 |

## Night rules
The narrator wakes each role in turn, the role points at one person, the narrator taps that person and confirms. **Each role's whole turn — wake, act, close eyes — happens inside its own step.** Never put the previous role's "close your eyes" on the next step.

Say-aloud script (shown in the Instruction Card on each step):
- **Step 1, Mafia:** "Mafia, wake up. Point at one person to kill." … "Mafia, close your eyes." One Confirm button only; tapping another name changes the pick.
- **Step 2, Doctor:** "Doctor, wake up. Who do you want to save?" … "Doctor, close your eyes." Shows the Mafia target. Back and Confirm.
- **Step 3, Detective:** "Detective, wake up. Who do you want to check?" Screen shows YES/NO (is that player Mafia); narrator shows it with a thumbs up/down, then "Detective, close your eyes." Back and Finish night → Dawn, no "are you sure" pop-up.
- Hint text: "Tap who they point at. Once they agree, say the last line, then confirm."

Rules:
- Only alive players are listed. Mafia can't pick a partner. Detective can't pick themselves. Doctor can pick anyone alive, including themselves.
- If the Doctor saves the Mafia target, no one dies and status stays Alive. Otherwise the target dies.
- Dead roles are skipped (the app doesn't ask a dead role). With 2 Doctors/Detectives, skip only when both are dead.
- 13+ players: both Doctors (or both Detectives) wake together, agree, and the narrator enters one person.
- Undo: Back on step 2 returns to step 1; step 1 has no Back.
- **Hide roles:** every narrator screen listing roles has a Hide roles button; hides all roles until tapped again.
- Player phones at night: very dim, identical for everyone.

## Day rules
- **Dawn:** narrator taps Announce to all. Players see who died + role (or "No one died tonight"), an auto last-words line, and who is left.
- **Discussion:** 3:00 default, spoken in person. Narrator can add 1 min up to 3 times per round (cap resets each round). Players see a read-only timer.
- **Vote:** narrator taps Start voting. Each alive player (not narrator, not dead) has 30 s to pick a player or None. No vote in 30 s = None. The vote always runs the full 30 s (even if everyone has voted); the narrator watches who voted whom live, then sees the result when it closes and taps Reveal to all. Mafia may vote for partners. No one can vote for themselves.
- **Secrecy:** players see only "Voted: X of N". Only the narrator sees who voted whom and totals.
- **Result:** None votes are ignored. Top player is eliminated only if they have ≥ 2 votes and no tie. A tie, or top count under 2 → no one eliminated.
- **Reveal:** narrator reviews and taps Reveal to all. Players see the eliminated player, role and last words, or "No one was eliminated".
- **Eliminated players:** see only their own role; can chat in-app with other eliminated players only.
- **Last words:** written by the app from the cause of death; never mention the role.

## Win conditions
- Town wins when every Mafia is dead.
- Mafia wins when alive Mafia ≥ alive Town.
- Checked after Dawn and after every Reveal. Roles of players who left stay hidden but still count.
- Win screen shows automatically to everyone: winner + final roles. Host sees Play again; others see a waiting message.

## Edge cases
| Situation | Rule |
|---|---|
| A player's phone drops | No action and no vote. Can reconnect with the same account. |
| A player leaves for good | Eliminated. Role stays hidden until game ends. |
| Narrator disconnects | Game pauses. Host can end it after narrator is offline 2 min. |
| Host disconnects | Keeps host if back within 2 min. After 2 min offline (or leaving), host passes to next person in join order; if they return they're a normal player. |
| Late joiner | Not allowed after Start. |
| Role not acknowledged | Narrator can start after 30 s. |
| New game, same room | Narrator and roles re-picked. Nobody joins or leaves between games. |
| Empty room | Closes after 30 min. |

- Host powers: Start, End game, Play again.
- Pause: narrator can pause and resume on purpose. Timers stop while paused.

## Copy
Auto last words (pick one at random):
| Cause | Lines |
|---|---|
| Killed at night | "The night was not kind." / "Found at first light." / "Gone before dawn." / "The Mafia chose quietly." |
| Voted out | "The town has spoken." / "The vote was cast." / "Not everyone agreed." / "The room chose." |
| Target saved | "No one died tonight." |
| Tie / under 2 votes | "No one was eliminated." |

Key strings:
- Narrator reveal: "You are the Narrator"
- Night (players): "Close your eyes. The narrator will wake your role."
- Vote: "Votes are secret. Only the narrator sees who voted whom. No vote in 30 seconds counts as None."
- Name: "Other players see this name in the room."
- Taken: "[name] is already taken. Pick another."
- Phone: "Your number is private. Other players never see it."
- All other copy: take it exactly from the hi-fi screens.

## States still to design (build sensibly in the same style)
Hide roles on; skipped Doctor/Detective step; two-Doctor / two-Detective step; Dawn where the target dies; tie or under-2 result; narrator offline or paused (Pause/Resume on narrator screens); host handover notice; loading, error and offline states.

## Acceptance tests
Scripted 9-player game (2 Mafia, 1 Doctor, 1 Detective, 5 Villagers) + narrator:
- Start stays locked until 5 people have joined.
- Doctor saves the Mafia target → no one dies, status stays Alive.
- Back on the Doctor step lets the narrator change the Mafia target.
- Dead Doctor → Doctor step skipped.
- Vote tie → no one eliminated. Top count of 1 → no one eliminated.
- None votes ignored. No vote in 30 s = None.
- Players never see who voted whom; the narrator does.
- Mafia equal to Town after Dawn → Mafia win.
- Narrator offline pauses the game; host can end it after 2 min.
- Host offline 2 min → host passes to next in join order.
- Two players in one room cannot share a name ("Isha" = "isha"); other rooms can.
- A player who leaves is eliminated and their role stays hidden until the game ends.
