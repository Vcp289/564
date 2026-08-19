# QA — V7.09.69 Combo Pair Fusion

Scope: manual COMBO result view only. AUTO / AI training / History are unchanged.

## Test rounds
1. Classic + AI L: merge two ranked lists, canonical dedup, consensus first.
2. Classic + AI GL: merge with leading-zero candidates, canonical dedup, consensus first.
3. AI L + AI GL: merge with reversed permutations, canonical dedup, consensus first.

Expected invariant in every round:
- no duplicate canonical 3-digit result remains;
- candidates present in both source lists are ranked before one-source candidates;
- source engine labels are not required on result cards; COMBO is a result-only view;
- changing COMBO pair does not alter AUTO mode.
