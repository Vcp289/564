# V7.09.63 Dynamic Profiles + Keep Names — QA

## Scope
1. Remove any 5-Profile storage assumption: Profile identity is driven by `state.profiles.length`.
2. Add Profile remains dynamic: 6, 10, 20+ Profiles are valid. `PROFILE_SOFT_GUIDE=30` is guidance only, not a hard limit.
3. Settings UI renders/searches/reorders/deletes the entire dynamic Profile array.
4. History / Import / AI Ranking / WF continue to key by dynamic Profile indexes and remap on reorder/delete.
5. Clear All resets Profile content but preserves every current Profile name and the active Profile.
6. Clear All clears stale Profile delete journal and resumable WF markers before committing the new reset generation.

## Static checks
- `node --check app-r32.js`
- `node --check sw-r32.js`
- no Profile-count loop fixed to `< 5` / `<= 5` was introduced.
- version/cache query is V7.09.63 throughout index/manifest/service worker.

## Required iPhone acceptance test
A. Rename Profiles and add until there are at least 10. Example Profile 10 = `The Force`.
B. Close/open app: all names remain.
C. Clear All: all 10+ names remain, History is 0, AI/WF derived data is empty.
D. Import image History into one Profile; wait until import is complete.
E. Swipe/kill the PWA and reopen: imported History and all Profile names remain.
F. Add Profile 11+, then verify History/Analysis/Profile Ranking/Profile tabs can select it.
