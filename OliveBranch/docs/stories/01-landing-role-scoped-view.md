# User Story: 1 - Landing: Role-scoped "Lay of the Land" View

**As a** Person-in-Role (Data Governance Lead / Data Steward / Data Owner),
**I want** to land on a role-scoped "lay of the land" graph centered on my Person-in-Role node,
**so that** I can immediately see the assets I own or steward and their connected lineage relevant to my responsibilities.

## Acceptance Criteria

- The view opens centered on the current user's Person-in-Role node.
- Owned assets are visible in the initial subgraph.
- Stewarded assets are visible in the initial subgraph.
- Upstream and downstream neighbors of those assets are included until no more edges remain or the cap is reached.
- When the expansion cap is reached, an `Expand more` control is shown.

## Notes

* Based on the transcript: default experience is role-scoped and expansion is capped for performance and clarity.
