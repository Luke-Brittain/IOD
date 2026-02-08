# User Story: 5 - System-level Ownership Inheritance

**As a** Data Governance Lead,
**I want** systems to have owners and for ownership to be inherited by child assets,
**so that** ownership is clear for datasets, tables, and fields without requiring per-asset owner assignments.

## Acceptance Criteria

- A System node supports assigning an Owner (Person-in-Role).
- Assigned Owner is stored on the System node.
- Datasets, Tables, and Fields show the System Owner as their effective Owner.
- The details panel displays the source System when an Owner is inherited.

## Notes

* The transcript mandates system-level ownership only for the MVP; per-asset owners are not required in MVP.
