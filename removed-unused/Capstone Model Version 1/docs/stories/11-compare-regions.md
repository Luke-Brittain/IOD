# User Story: 11 - Compare Two Regions Side-By-Side

**As a** policy maker,
**I want** to pin a region, then select a second region and view a side-by-side comparison of greenspace metrics, socioeconomic indicators, and rankings,
**so that** I can quickly identify disparities and make evidence-informed decisions about resource allocation.

## Acceptance Criteria

* A "Pin" or "Compare" button in the region details panel pins the currently selected region.
* When a second region is selected, a side-by-side comparison panel displays both regions' greenspace stats and chosen indicators.
* Comparison columns clearly highlight differences: values are color-coded (green for higher greenspace/indicator, grey for lower).
* Percentile rankings for both regions are shown to contextualize differences relative to city-wide distribution.
* Users can unpin a region or swap regions in the comparison with one click.
* The comparison persists when toggling layers or adjusting map view; it closes when a third region is selected.
* A "Download comparison" button exports a CSV with both regions' metrics.

## Notes

* Comparison metrics should match the indicators and geographies selected in the catalogue.
* Consider defaulting to top-5 most relevant indicators for faster scanning.

