# User Story: 3 - CSV Import: Merge-Preserving Upsert

**As a** System Administrator or Data Steward,
**I want** to import assets and relationships via a CSV template that upserts by stable keys and preserves manual changes,
**so that** I can bulk-ingest lineage metadata without losing edits made in the UI.

## Acceptance Criteria

- The importer upserts nodes and edges using stable keys.
- Blank CSV cells do not overwrite existing non-blank values.
- The import flow displays a preview of nodes and fields that will be created or updated.
- Conflicting fields are highlighted in the preview for manual confirmation.
- Edges included in the CSV are added; no existing edges are removed by default.

## Notes

* The transcript requires merge-preserving behavior for the MVP ingestion path (CSV first).
