# User Story: 15 - Details Panel: Edit Metadata (Owners/Stewards)

**As a** Owner or Steward,
**I want** to edit core and business-defined metadata for nodes I own or steward from the details panel,
**so that** I can correct or enrich metadata in-context.


## Acceptance Criteria

- Users with Owner/Steward rights see editable form controls for permitted fields.
- The panel shows `Save` and `Cancel` buttons when edits are present.
- Clicking `Save` validates inputs and persists permitted changes.
- Clicking `Cancel` discards unsaved changes and restores previous values.
- After a successful save, the panel displays the updated values and a success message.

## Notes

* Permission checks are covered in a separate story; this story focuses on the edit UI and save/cancel flow for authorized users.
