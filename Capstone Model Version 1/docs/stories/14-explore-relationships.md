# User Story: 14 - Explore Relationships Between Greenspace And Socioeconomic Indicators

**As a** data analyst,
**I want** to select a socioeconomic indicator and view a scatterplot (greenspace index vs. indicator) with a correlation coefficient, plus a 2x2 bivariate map showing regions classified by greenspace (low/high) and disadvantage (low/high),
**so that** I can explore potential patterns, identify priority areas with low greenspace and high disadvantage, and generate hypotheses for targeted interventions.

## Acceptance Criteria

* A "Relationships" or "Analysis" tab in the catalogue panel displays a list of available socioeconomic indicators.
* Selecting an indicator renders:
  - A scatterplot (city geography as dots, x-axis: greenspace index, y-axis: chosen indicator) with trend line and Pearson r coefficient.
  - A text note: "Correlation does not imply causation. Investigate other factors before drawing conclusions."
  - An option to toggle to a 2x2 bivariate map (greenspace low/high x indicator low/high) with four color-coded zones.
* Users can hover scatterplot points to see region names and exact values.
* A table ranks regions by priority (low greenspace + high disadvantage) with actionable summary (e.g., "18 regions with <15% parkland and >70th percentile disadvantage").
* Results update within 2–3 seconds when a new indicator is selected.

## Notes

* Precompute correlation matrices and bivariate classifications to ensure responsive interaction.
* Avoid implying causality; use neutral language like "co-occur" or "associate."

