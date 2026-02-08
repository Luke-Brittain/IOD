# User Story: 12 - Get Natural Language Interpretation Of Selected Region

**As a** urban analyst,
**I want** to click an "Explain" or "Interpret" button for a selected region and receive a short natural language narrative that describes what stands out, how the region compares to the city, and 2–3 hypotheses to investigate,
**so that** I can quickly understand the significance of the region's metrics without manually interpreting numbers and patterns.

## Acceptance Criteria

* An "Explain" button is visible in the region details panel.
* Clicking "Explain" generates and displays a narrative (150–300 words) that:
  - Describes the region's greenspace composition and index relative to city-wide distribution.
  - Highlights any noteworthy socioeconomic indicators and potential connections to greenspace.
  - Presents 2–3 evidence-grounded hypotheses (e.g., "Low parkland availability may correlate with higher disadvantage; investigate intervention opportunities.").
  - Includes a disclaimer about correlation vs. causation and data limitations.
* The narrative references only metrics provided by the app; no external data is cited.
* Generation completes within 3–5 seconds; a loading state is shown during generation.
* Users can regenerate the narrative or edit/customize it before export.

## Notes

* Use a grounded LLM prompt that constrains outputs to available metrics and enforces cautious language.
* Narrative should avoid stigmatizing language (e.g., use "lower greenspace availability" not "green desert").
* Include a "Methods" note describing how statistics were calculated.

