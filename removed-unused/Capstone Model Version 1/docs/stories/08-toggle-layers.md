# User Story: 8 - Toggle Layers And Adjust Visualization

**As a** map analyst,
**I want** to toggle map layers (classification overlay, administrative boundaries, optional context layers) on and off and adjust transparency for each layer,
**so that** I can customize the map view to focus on specific information and reduce visual clutter.

## Acceptance Criteria

* A left-side panel displays checkboxes for each available layer (classification raster, boundaries, basemap, optional contextual layers).
* Each layer has a corresponding opacity/transparency slider (0–100%).
* Toggling a layer updates the map within 500 ms without visual jitter.
* The legend automatically updates to show only visible layers and their symbology.
* Layer state persists in the session or browser local storage.
* Toggling layers does not reset the current selection or statistics panel.
* Layer toggles are accessible via keyboard navigation and screen readers.

## Notes

* Avoid layer conflicts; disable incompatible layer combinations if necessary and explain why via tooltip.
* Default layer state: classification raster visible (100%), boundaries visible (70%), optional layers off.

