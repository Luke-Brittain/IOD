# User Story: 18 - Details Panel: Audit Trail for Metadata Edits

**As a** Compliance Officer or Governance Lead,
**I want** all metadata edits performed via the details panel to be recorded with user, timestamp, and changed fields,
**so that** we have traceability for changes and can investigate or revert if necessary.


## Acceptance Criteria

- Each successful metadata save creates an audit record containing: user id, timestamp, node id, and changed fields with old and new values.
- Audit records are persisted to durable storage.
- The details panel displays a recent-changes summary showing who changed the node and when (last 3 changes).
- Admin tooling can retrieve audit records (storage and query interface design is out of scope for this story but records must be queryable).

## Notes

* Audit persistence and admin query interfaces are implementation details; this story ensures the existence and minimal visibility of audit records.
