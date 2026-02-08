# User Story: 10 - View Socioeconomic Indicators For Selected Region

**As a** social researcher,
**I want** to see a ranked list of socioeconomic indicators for a selected region (linked from the census/indicator tables) with units, notes, and percentile comparisons,
**so that** I can understand the demographic and economic context of the region and identify potential inequity patterns.

## Acceptance Criteria

* The region details panel displays a sortable list of available socioeconomic indicators with values, units, and data year.
* Each indicator shows a percentile badge (e.g., "78th percentile") indicating how the region ranks city-wide.
* Indicators marked as missing or low-confidence display a warning icon and brief explanation.
* Users can hover/click an indicator for a tooltip showing calculation notes, data source, and confidence level.
* A small sparkline or distribution chart shows the city-wide distribution with the selected region marked.
* Indicators can be filtered by category (e.g., income, employment, health, housing) via a dropdown.
* A "Pin" button allows users to compare the selected region with another region side-by-side.

## Notes

* Socioeconomic data should be sourced from official census tables (e.g., ABS in Australia) with clear vintage dates.
* Ensure all percentile calculations account for geography-specific distributions (e.g., SA2-level percentiles for SA2 analysis).

