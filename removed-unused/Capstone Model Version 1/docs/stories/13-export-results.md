# User Story: 13 - Export Map, Statistics, And Narrative

**As a** researcher,
**I want** to export a map image (with legend and citation), a CSV file of region statistics and chosen indicators, and a short narrative summary (templated but editable),
**so that** I can include findings in reports, share results with stakeholders, and document my analysis.

## Acceptance Criteria

* An "Export" button in the region details panel opens an export modal with three tabs: Map, Data (CSV), and Narrative.
* Map export:
  - Generates a PNG image of the current map view with selected region highlighted.
  - Includes a legend, scale bar, north arrow, and a footer citation (model version, data year, source attribution).
  - Resolution is at least 1200 x 800 px (higher resolution on request).
* Data export:
  - Exports a CSV with rows for each selected region (or comparison regions) and columns for all displayed metrics.
  - Includes metadata headers (city name, analysis geography, data year, greenspace model version).
  - CSV is downloadable within seconds.
* Narrative export:
  - Users can view, edit, and customize the auto-generated narrative before export.
  - Exports as a .docx or .pdf with formatted text, embedded map, and data table.
  - Includes a methods section and a sources/license attribution table.
* All exports include a timestamp and user-configurable title/project name.

## Notes

* Map export should handle complex layer configurations gracefully (toggle all layers visible for export by default).
* Implement rate limiting to prevent abuse of export functionality.

