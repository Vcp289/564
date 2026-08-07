LuckyNumber V6.4.1 — iOS UI Polish (UI/Asset only)

Changes only:
- History Compare: mobile two-row layout to reduce crowding on iPhone.
- Short visual status labels on mobile: ตรง / กลับ / ไม่ตรง.
- Added whitespace, softer borders, rounded container and Apple-like spacing.
- New Home Screen / PWA icon from selected lighthouse option #7.
- Added apple-touch-icon + PWA 192/512 icons.

Protected / unchanged:
- app.js calculation and AI logic is byte-for-byte identical to V6.4.
- History data structure/storage logic unchanged.
- Classic, AI L, Independent AI, Master AI algorithms unchanged.
- Ranking/scoring/prediction logic unchanged.

Validation:
- Node syntax check app.js: PASS
- Node syntax check sw.js: PASS
- Manifest JSON parse: PASS
- CSS brace validation: PASS
- app.js SHA-256 matches V6.4 source: PASS
