# LuckyNumber V7.09.30 — AI GL Hybrid / Dynamic History Rank

## AI GL rules

- Parents: Classic L (safety) + AI L (learning)
- Input: same five digits
- Search: same eight L patterns
- Mutable cells: columns 2–4 only
- Locked cells: row anchors A/B/C and all column 5 cells from Classic L
- Warm-up: 8 linked draws
- AUTO evidence: at least 14 Trusted rows
- Activation: AI GL must beat Classic by at least 5 percentage points and beat AI L on the same Trusted evidence; ties keep AI L
- Historical testing: strict Walk-Forward, using only rows dated before each target draw

## Integration

- Calculate and formula snapshots
- AI Center and manual preview
- History (engine columns sorted by Trusted Hit rate descending, WIN fixed rightmost, AUTO badge under 3D/2D without overlap)
- Analysis, Total Score, behavior cards, and recent winners
- ML Select
- Profile remapping, deletion, import, backup/restore, and PWA cache/versioning

## Verification completed

- JavaScript syntax checks passed for app and service worker
- AI GL anchor and column-5 lock invariants passed
- Source/offset bounds passed
- Activation-gate unit check passed
- ML Select includes GL
- History contains GL, removes the dedicated Auto column, and keeps WIN
- AI page includes AI GL and does not render the old Master AI card
- PWA asset/version references are internally consistent
