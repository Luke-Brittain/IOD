# User Story: 7 - Drill Down Into Region And View Statistics

**As a** researcher,
**I want** to click or select an administrative region (or draw a custom polygon) and see detailed statistics for that region (% class values, greenspace index, area, population if available) update immediately,
**so that** I can explore spatial variation in greenspace and compare it against city-wide baseline.

## Acceptance Criteria

* Clicking a region highlights it on the map and displays a region details card with summary metrics.
* A box-select or lasso tool allows users to draw a custom area-of-interest (AOI) polygon.
* AOI size is capped to prevent excessive compute; a warning is shown if the user attempts to exceed the limit.
* Statistics update within 1–2 seconds; a loading spinner indicates computation is in progress.
* The selected region is labeled with its name (or coordinates if custom AOI).
* A percentile comparison shows how the selected region ranks relative to the city distribution for each metric.
* Selection persists when toggling layers or opening the data catalogue.
* Users can search for a region by name and auto-select it from a dropdown.

## Notes

* Precompute zonal statistics for all administrative regions to support fast updates.
* For custom AOIs, enforce a minimum pixel resolution and maximum area to keep server compute manageable.
* Percentile rankings should be calculated from precomputed summary tables.

