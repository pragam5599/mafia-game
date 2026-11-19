# Design system — "Noir" (dark only)

Figma page "Design System" (node 27:82). Token names below match the Figma variables.
Put these in `src/theme/` and use only the semantic names in screens.

## Primitives
| Name | Hex | Name | Hex |
|---|---|---|---|
| ink/950 | #08080a | blood/900 | #3a0609 |
| ink/900 | #0f0f12 | blood/700 | #7a0f16 |
| ink/800 | #17171b | blood/500 | #c1121f |
| ink/700 | #222228 | blood/400 | #e0303c |
| ink/600 | #2e2e35 | amber/900 | #3d2a0e |
| ink/500 | #4a4a52 | amber/500 | #e2a443 |
| smoke/400 | #7c766d | amber/300 | #f2c981 |
| smoke/300 | #a69f94 | teal/900 | #0f2a28 |
| smoke/200 | #cfc6b8 | teal/500 | #3e8e86 |
| paper/100 | #efe6d6 | teal/300 | #7cc4bb |
| paper/50 | #f7f1e6 | | |

## Semantic colors
| Token | Value | Token | Value |
|---|---|---|---|
| bg/base | ink/950 | accent/default | blood/500 |
| bg/surface | ink/900 | accent/hover | blood/400 |
| bg/raised | ink/800 | accent/subtle | blood/900 |
| bg/overlay | ink/700 | highlight/default | amber/500 |
| bg/inverse | paper/100 | highlight/subtle | amber/900 |
| border/subtle | ink/600 | success/default | teal/500 |
| border/strong | smoke/400 | success/subtle | teal/900 |
| border/accent | blood/500 | role/mafia | blood/400 |
| border/highlight | amber/500 | role/doctor | teal/300 |
| text/primary | paper/100 | role/detective | amber/300 |
| text/secondary | smoke/300 | role/villager | smoke/200 |
| text/muted | smoke/400 | disabled/bg | ink/700 |
| text/inverse | ink/950 | disabled/text | ink/500 |
| text/on-accent | paper/50 | | |

## Spacing and radius
- Spacing: 2xs 2 · xs 4 · sm 8 · md 12 · lg 16 · xl 20 · 2xl 24 · 3xl 32 · 4xl 40 · 5xl 48
- Radius: none 0 · sm 4 · md 8 · lg 14 · full 999

## Type (no text style changes case — show text exactly as written)
| Style | Font | Size / line | Tracking |
|---|---|---|---|
| Display/XL | Spectral ExtraBold | 40/46 | -0.5% |
| Display/L | Spectral ExtraBold | 28/34 | -0.5% |
| Display/M | Spectral Bold | 21/27 | 0 |
| Numeric/Timer | Spectral ExtraBold | 60/62 | -1% |
| Heading/S | DM Sans SemiBold | 17/24 | 0 |
| Body/M | DM Sans Regular | 15/22 | 0 |
| Body/M Strong | DM Sans Medium | 15/22 | 0 |
| Body/S | DM Sans Regular | 13/18 | 0 |
| Label/M | Barlow Condensed Bold | 16/20 | +1% |
| Label/S | Barlow Condensed SemiBold | 13/16 | +2% |

Default is sentence case. Follow the exact text in each screen.

## Effects
- Glow/Accent: shadow #c1121f @45%, blur 28, no offset
- Glow/Highlight: shadow #e2a443 @40%, blur 32, no offset
- Shadow/Card: shadow #000 @55%, blur 30, y 10

## Components (Figma node IDs, page Design System)
| Component | Node | Component | Node |
|---|---|---|---|
| Button | 28:19 | Vote Progress | 29:136 |
| Action Chip | 28:27 | Chat Bubble | 29:153 |
| Input | 28:51 | Announcement Card | 30:251 |
| OTP Cell | 28:61 | Role Card | 30:339 |
| Role Tag | 28:75 | Wordmark | 30:25 |
| Status Tag | 28:95 | Divider/Deco | 30:32 |
| Player Row | 29:51 | QR Code | 30:39 |
| Step Bar | 29:95 | Mode Card | 37:249 |
| Timer | 29:109 | Mode Select Card | 45:1939 |
| Top Bar | 29:128 | Seal | 45:1365 |
| Instruction Card | 29:129 | Pager Dots | 45:1379 |
| Icon/Lock | 45:1320 | Icon/Check | 45:1323 |

Step Bar: segments read "Step n · now / done / skipped" with the role name below;
the name is struck through when skipped.

## Illustrations (export PNG @3x from Figma)
| Name | Node | Used on |
|---|---|---|
| Illustration/Scene | 36:82 | Key art (A1, H1, A5c) |
| Illustration/Duo | 36:83 | Mafia role art, night |
| Illustration/Radio | 45:1357 | Mode II poster |
| Illustration/Role/Doctor | 47:1849 | P3b |
| Illustration/Role/Detective | 47:1957 | P3c |
| Illustration/Role/Villager | 49:1918 | P3d |
| Illustration/Role/Narrator | 49:2042 | N1 |
| Illustration/Role/Hidden | 49:2093 | P3a |
