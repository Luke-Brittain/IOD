# User Story: 16 - Details Panel: Edit Permission Checks & Read-only Behaviour

**As a** System Administrator or Governance Lead,
**I want** the details panel to enforce Owner/Steward edit permissions and show read-only views to others,
**so that** only authorized users can modify metadata and others can see who has edit rights.

## Acceptance Criteria

- The system determines if the current user is the Owner or a Steward for the node, or Owner of the owning System.
- If authorized, the UI shows editable controls for permitted fields.
- If unauthorized, the UI shows read-only fields and a message listing who can edit.
- Any attempt to use edit endpoints without permission is blocked and recorded in logs.

## Notes

* This story focuses on permission evaluation and UI state changes; authentication/identity is assumed to be provided by the wider platform.
