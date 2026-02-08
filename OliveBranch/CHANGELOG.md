# Changelog

## [Unreleased]

### Fixed
- Recovered and stabilized generated CSV import handler. Replaced corrupted concatenated artifact with a canonical re-export to `importCsvStubClean.ts` and updated API route to use the canonical path. Tests in `OliveBranch/tests` pass locally.

### Notes
- A temporary corrupted backup file `importCsvStub.corrupted.ts` was removed during cleanup. See PR `feature/import-csv-stub-stabilize` for details.
