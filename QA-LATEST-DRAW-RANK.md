# QA — Latest Draw Ranking Update (V7.09.66)

## Required behavior
- Device date 2026-08-19, newest complete result date = 2026-08-18 → dashboard target is 18 Aug.
- If any complete 2026-08-19 result is saved → dashboard target advances to 19 Aug.
- A profile is Updated only when it has complete 3D + 2D for the current target date.
- Rank movement baseline uses evidence strictly before the target draw date, not before the device calendar date.
- Movement badge is shown after the profile name only for Updated profiles: ↑ #rank / ↓ #rank / • #rank.
- No future-dated result may become the target.

## Static checks
- APP display version V7.09.66.
- JS/CSS/manifest/SW cache query all use 70966latestdrawrank.
- `node --check app-r32.js` passes.
