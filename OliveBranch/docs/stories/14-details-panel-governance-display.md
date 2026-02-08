# User Story: 14 - Details Panel: Governance Display (Owner & Stewards)

**As a** Data Governance Lead or Data Owner,
**I want** the details panel to show the Owner (inherited from System) and any Dataset/Table stewards,
**so that** users can see governance contacts and where ownership is coming from.

## Acceptance Criteria

- The panel shows the effective Owner for the node.
- If the Owner is inherited, the panel displays the source System's name.
- Dataset nodes list Steward(s) with contact info.
- Table nodes list Steward(s) with contact info.
- When ownership is inherited, the panel includes a short explanation of the inheritance rule.

## Notes

* This implements the transcript's system-level ownership rule and stewardship visibility.
