# User Story: 9 - Browse Data Catalogue And Understand Indicators

**As a** data analyst,
**I want** to explore a data catalogue that lists all available indicators (census tables, derived indices, environmental layers) with metadata (source, year, geography, update frequency, license, limitations) and a field dictionary,
**so that** I can understand what data is available, how it was calculated, and make informed decisions about which indicators to use in my analysis.

## Acceptance Criteria

* A data catalogue page or modal displays a searchable/filterable table of all available datasets.
* Each dataset row includes: name, source, vintage year, geography unit, update cadence, license, and a "details" button.
* Clicking "details" expands or opens a modal showing full metadata, calculation notes, known limitations, and recommended use cases.
* A field dictionary is available for each dataset, listing variable names, units, descriptions, and data completeness (% non-null).
* Users can select an indicator to preview: a map showing the indicator's spatial distribution, a histogram of values, and top/bottom regions by value.
* License attribution is clearly displayed; users can export license details with any exported data.
* A "Compare" button allows users to select an indicator and see its correlation with the greenspace index in a scatterplot.

## Notes

* Precompute correlation matrices and store as JSON for instant retrieval.
* Field dictionaries should be machine-readable (e.g., JSON) to support future automation.
* Include a note if data is missing or significantly delayed for a given year/geography.

