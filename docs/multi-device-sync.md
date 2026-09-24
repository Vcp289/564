# Multi-device History synchronization: staged rollout

The deployed app currently stores the whole state in Firebase Storage at
`userStates/{uid}/state.json`. It does **not** use Firestore, and cloud backup
restores replace the local state. Do not turn on row synchronization on one
device while another device still uploads `state.json`: the older client can
overwrite newer History.

`cloud-row-delta.js` provides a tested, data-only three-way comparison for
profiles, actual draws, records and daily tables. It reports deletions and
same-row conflicts; it never silently picks a winner. This module is not yet
connected to Firebase and does not change the currently deployed sync.

Before activation:

1. Create and secure a Firestore database; enforce authenticated ownership at
   `users/{uid}` for all row and metadata documents. Do not permit anonymous or
   cross-user reads or writes.
2. Create a **versioned, immutable** Storage backup of each account's existing
   `state.json`; verify that its draw count and checksum match the source.
3. Import all existing History into per-row Firestore documents in resumable
   batches. Publish a migration-complete marker only after the import is fully
   verified. Carry deletion tombstones and stable row IDs over to the new store.
4. Deploy clients that can read both formats, then stop all legacy full-state
   uploads for that account before Firestore becomes authoritative.
5. Keep local IndexedDB as the offline copy. On reconnect, read server-side
   row revisions and changed documents, compare against an acknowledged
   ancestor, and write with transaction preconditions. Surface same-row edit
   conflicts to the user; never resolve them based solely on row count.
6. Verify iPhone and MacBook show identical History and edits/deletions across
   both devices. Only then use Storage full snapshots as recovery backups.

The first import/open may still fetch all rows. Later updates can download
only changed rows, but require Firestore setup and per-document usage charges.
