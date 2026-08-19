# V7.09.68 Last Profile Derived Data Guard

Issue reproduced from UI: a Profile could show saved History rows but 0 trusted checks / no AI evidence when it became the final Profile after deleting another Profile.

Fix:
- Added a position-independent derived-data guard for the active Profile.
- Missing generated daily tables are rebuilt only from that Profile's own saved actual results.
- Legacy History linkage is re-synced after table repair.
- Missing/stale WF cache is invalidated and queued for strict prior-only background rebuild when History >= 8 draws.
- The guard runs on History, Analysis, and immediately after Profile deletion, so the new final Profile cannot remain 0/0 merely because its index changed.
- No future/same-day prediction data is synthesized; WF remains strict prior-only.

Checks:
- app-r32.js syntax: PASS
- sw-r32.js syntax: PASS
- manifest JSON: PASS
- ZIP integrity: PASS
