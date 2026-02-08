# User Story: 9 - Primary System Anchor for Calculated Metrics

**As a** Data Governance Lead,
**I want** Calculated Metrics (and Reports) to have a Primary System attribute that anchors accountability,
**so that** ownership and governance for cross-system derived outputs are clear in the short term.

## Acceptance Criteria

- Calculated Metric nodes have a `Primary System` reference field.
- The `Primary System` field accepts a reference to one existing System node.
- The metric's effective Owner is the Owner of its `Primary System`.
- The details panel shows the metric's `Primary System` and the inherited Owner.
- The graph can still display derivation edges from multiple systems for the same metric.

## Notes

* This is the transcript-adopted Option A: Primary System anchor; Option B (Accountability overlay) is reserved for future enhancement.
