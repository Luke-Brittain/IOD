# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Implemented RBAC for `OliveBranch` (externalized role→permission mapping, `hasPermission()` helper, and authorization middleware).
- Admin UI and API for editing role mappings with validation and audit logging (Zod validation, file-based audit with rotation).
- Unit tests covering RBAC and middleware; updated tests to pass in CI.

### Changed
- CI and test environment fixes: added `@supabase/supabase-js` to resolve runtime import issues in CI and adjusted lint/type fixes.
- Refactored TypeScript to remove unsafe `any` usage and improve type safety across `OliveBranch`.

### Security / Ops
- Audit logging for role configuration changes added (file-based; consider migrating to a DB/S3 for production).

## [1.1.0] - 2026-02-08

### Added
- Release representing RBAC and admin-roles feature merge (see Unreleased for details).
