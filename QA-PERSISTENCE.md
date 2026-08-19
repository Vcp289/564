# V7.09.62 Persistence QA

Checked 2026-08-19

- JavaScript syntax: PASS (`node --check app-r32.js`)
- PWA version alignment: PASS
  - APP_VERSION V7.09.62
  - index asset query 70962resetimport
  - manifest start_url 70962resetimport
  - service worker cache V7.09.62
- Reset -> Import race: FIXED
  - Reset handler is async and waits for durable full-state + source checkpoint commits.
  - History source checkpoint writes are serialized in invocation order.
  - A compact synchronous localStorage source journal is committed before IndexedDB yields.
- Default profiles after Reset: PASS by code invariant
  - Reset clones DEFAULT_STATE which contains Taiwan, Korea, Hong, Profile 4, Profile 5.
  - No manual Add Profile action is required before import.
- Import durability path: PASS by code invariant
  - Imported actualDraws are committed to MAIN state.
  - Reset tombstone is removed on successful import.
  - Compact sync History source journal is written.
  - Full IndexedDB History source checkpoint is awaited.
  - Final durable commit is awaited before 100% is shown.

Note: Browser/iOS process-kill behavior cannot be physically reproduced in this container. The code-level race that could produce the reported symptom has been removed and redundant recovery paths are in place.
