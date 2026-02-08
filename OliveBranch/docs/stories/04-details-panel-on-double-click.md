# User Story: 4 - Details Panel (Double-click) — View & Edit Metadata

**As a** Data Owner or Steward,
**I want** to open a right-side details panel by double-clicking a node and be able to edit metadata when I have ownership or stewardship rights,
**so that** I can correct or enrich metadata directly in-context without leaving the canvas.

## Acceptance Criteria

- Double-clicking a node opens the right-side details panel.
- The panel shows the node's core metadata fields.
- The panel shows configured business-defined fields for the node type.
- The panel displays counts of upstream and downstream relationships.
- Each relationship in the summary has a control to navigate to that related node.
- The governance section displays the effective Owner and indicates if it is inherited from a System.
- For Dataset and Table nodes, the panel lists Steward(s) and contact info.
- If the current user is Owner or Steward (or Owner of the owning System), editable controls appear for editable fields.
- Editable controls support `Save` and `Cancel` actions.
- `Save` validates input and persists changes following merge-preserving rules.
- `Cancel` discards unsaved edits and restores previous values.
- By default, blank inputs do not overwrite existing non-blank values; explicit confirmation is required to clear a value.
- Each saved change generates an audit record containing user, timestamp, node id, and changed fields.
- Users without edit rights see fields as read-only and a note stating who may edit.

## Notes

* Transcript specifies the details panel contents and the owner inheritance rule; this refinement adds in-context editing for Owner/Steward roles as requested.

## Related stories

- Story 11: Details panel open interaction — [11-details-panel-open-view.md](11-details-panel-open-view.md)
- Story 12: Metadata display — [12-details-panel-metadata-display.md](12-details-panel-metadata-display.md)
- Story 13: Relationship summary & navigation — [13-details-panel-relationship-navigation.md](13-details-panel-relationship-navigation.md)
- Story 14: Governance display (Owner & Stewards) — [14-details-panel-governance-display.md](14-details-panel-governance-display.md)
- Story 15: Edit metadata UI & save/cancel — [15-details-panel-edit-metadata.md](15-details-panel-edit-metadata.md)
- Story 16: Edit permission checks — [16-details-panel-edit-permissions.md](16-details-panel-edit-permissions.md)
- Story 17: Merge-preserving save behaviour — [17-details-panel-merge-preserve-on-save.md](17-details-panel-merge-preserve-on-save.md)
- Story 18: Audit trail for metadata edits — [18-details-panel-audit-trail.md](18-details-panel-audit-trail.md)
* Editing should respect merge-preserving CSV behaviour (blank values don't overwrite) and enforce permission checks.
