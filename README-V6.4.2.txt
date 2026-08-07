LuckyNumber V6.4.2 — Backup Safety

Base: V6.4.1 iOS History Polish + Lighthouse 7

Added only data-safety features:
- Auto Backup JSON after saving an actual result.
- Auto Backup JSON after confirmed bulk image import.
- Safety Backup before deleting an actual result.
- Safety Backup before deleting a Profile.
- Safety Backup before Restore overwrites current data.
- Safety Backup before Clear All.
- Settings toggles for both automatic behaviors.
- Existing LocalStorage + IndexedDB dual persistence retained unchanged.
- Existing manual Export/Import JSON retained.

iPhone note:
- iOS deletes PWA-owned storage when the Home Screen app is removed.
- The generated JSON backup is outside the PWA storage. If Safari Downloads is configured to iCloud Drive, the backup survives deleting/reinstalling the Home Screen app.
- Browser security does not allow a PWA to silently write directly into a chosen iCloud folder without the iOS download/file flow.

Protected / unchanged:
- Calculation formulas.
- Classic AI L, Independent AI, Master AI.
- AI ranking/scoring/prediction logic.
- History/table data structures.
- Lighthouse #7 app icons and V6.4.1 UI polish.
