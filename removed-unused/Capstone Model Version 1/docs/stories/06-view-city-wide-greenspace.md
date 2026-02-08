# User Story: 6 - View City-Wide Greenspace Overview

**As a** urban planner,
**I want** to see city-wide greenspace composition (% water, % urban, % green_residential, % parkland) and a greenspace index across the entire city on an interactive map,
**so that** I can understand baseline greenspace distribution and identify broad patterns before drilling into specific regions.

## Acceptance Criteria

* The explorer map loads with the classified raster overlay displayed by default (four classes color-coded and distinguishable).
* A legend clearly identifies each class (water, urban, green_residential, parkland) with corresponding colors and descriptions.
* A statistics panel displays city-wide % values for each class and the greenspace index (calculated as % green_residential + % parkland).
* The map renders city boundaries and optional administrative boundaries as semi-transparent overlay.
* Users can pan, zoom, and interact with the map without lag.
* A choropleth mode option allows toggling to a greenspace-index heatmap for quick visual scanning.
* Color palette complies with WCAG AA contrast for accessibility; alternative colorblind-friendly palettes are available.

## Notes

* Precompute city-wide statistics to ensure instant display.
* Use web-friendly tile formats (COG, XYZ, or MBTiles) for responsive rendering.
* City-wide stats should update only when the selected geography or filters change, not on pan/zoom.

