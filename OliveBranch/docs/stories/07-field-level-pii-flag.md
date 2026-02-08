# User Story: 7 - Field-level PII Flagging

**As a** Data Owner or Steward,
**I want** to mark Fields with a mandatory PII Yes/No flag,
**so that** privacy-sensitive attributes are clearly identified for governance and filtering.

## Acceptance Criteria

- Each Field node has a `PII` property with values `Yes` or `No`.
- The `PII` property is required when creating or editing a Field node.
- The details panel shows the Field's `PII` value near the top of the metadata.
- There is a filter option to display only nodes/fields with `PII = Yes`.

## Notes

* Transcript requires PII at Field level as a mandatory, manual attribute for MVP.
