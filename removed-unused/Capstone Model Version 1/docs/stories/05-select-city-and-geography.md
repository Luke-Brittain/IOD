# User Story: 5 - Select City And Analysis Geography

**As a** urban analyst,
**I want** to select a city from a preconfigured list or upload a custom boundary file and choose an analysis geography (neighbourhoods, wards, administrative units),
**so that** I can begin exploring greenspace and socioeconomic patterns relevant to my region of interest.

## Acceptance Criteria

* A landing page displays a preconfigured list of available cities with basic metadata (city name, year, model version).
* Users can click a city card to select it and proceed to the explorer.
* Users can upload a GeoJSON boundary file for a supported city that is not in the preconfigured list.
* After city selection, users can choose an analysis geography (e.g., SA2, wards, neighbourhoods) from a dropdown menu.
* The app loads the selected city boundary, administrative regions, and raster tiles within 3 seconds.
* A brief explanation of the four greenspace classes is displayed on the landing page.
* Selected city and geography persist in the browser session or URL state for sharing/bookmarking.

## Notes

* Preconfigured cities should include metadata: boundary file, available geographies, census vintage, model version.
* GeoJSON upload should validate geometry and ensure the boundary is within Earth Engine or supported region.
* Consider adding search/filter for cities if the list grows beyond 20 entries.

