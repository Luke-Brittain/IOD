# User Story: 10 - CSV Import: Edges Additive & Preview

**As a** System Administrator or Data Steward,
**I want** CSV-imported edges to be additive by default and for the import flow to preview changes,
**so that** I can safely add lineage relationships in bulk without accidentally removing existing links.

## Acceptance Criteria

- The import preview lists nodes and edges that will be created or updated.
- By default, edges in the CSV are added and existing edges are retained.
- The preview flags CSV cells that are blank but would overwrite existing non-blank values.
- Users must explicitly confirm any overwrite of an existing value with a blank.

## Notes

* Aligns with transcript: "Edges are additive by default" and "blank values do not overwrite existing values."
