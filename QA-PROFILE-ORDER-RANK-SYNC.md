# QA — Profile Order Rank Sync (V7.09.67)

- Analysis `Profile Order` in AI mode now consumes the same canonical ranking as `Real-time Profile Ranking > AI Recommend`.
- Removed the old separate Profile Order comparator that prioritized confidence/samples in a different order.
- Canonical ordering includes the same latest-draw update status / Rank Score logic used by AI Recommend.
- Manual and Stat Score ordering are unchanged.
- Recent Winner / formula ranking is intentionally unchanged because it is a different metric.
- JavaScript syntax checks passed for app-r32.js and sw-r32.js.
