# User Story: 17 - Details Panel: Merge-Preserving Save Behaviour

**As a** Data Steward or System Administrator,
**I want** saves performed from the details panel to follow merge-preserving rules (blank values do not overwrite existing values unless confirmed),
**so that** manual edits are not accidentally lost when partial updates are submitted.

## Acceptance Criteria

- Saving from the details panel does not overwrite existing non-blank values with blank inputs by default.
- If a user clears a field, the UI prompts for confirmation before persisting the blank value.
- The save flow follows the same merge rules used by CSV import.

## Notes

* Aligns details-panel save behaviour with the transcript's CSV merge-preserving policy.
