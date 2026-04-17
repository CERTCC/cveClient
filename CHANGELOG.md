# cveClient Changelog

## Version 1.0.25 — 2026-03-28
- Bug: Bug fix in `cveClientLib.js` where query params such {active: false} will not work due to weak coercion
- Updated `cveClientLib.js` to version 1.0.26, should support npm usage as well.

## Version 1.0.24 — 2026-03-28

- Security: Fixed XSS vulnerability — use `.text()` instead of `.html()` for CVE ID in modal title CVE-2026-35466
- Security: Prevent plaintext API key storage and harden encryption key handling CVE-2026-35467
- Security: Added prototype pollution protection to `queryParser` and removed sensitive logging CVE-2026-35466
- Updated SweetAlert2 from 11.4.9 to 11.26.24
- Made schema references version-agnostic with automatic schema version detection
- Added ADP (Authorized Data Publisher) read and delete support

## Version 1.0.23 — 2025-12-15

- Updates to resolve bugs including security issues (CVE-pending)
- Updates after demo to CVE AWG
- Login bug fixes
- Updated `check_json` function validation

## Version 1.0.22 — 2025-06-26

- Resolved a bug as filed in #31 — multiple versions under affected tree
- Moved from jQuery `.data()` to `.attr("data-")` to avoid unexpected behaviors
- ProblemTypes can be array of array with only one dictionary object — fixed issue where m\*n array can be consistent in JSON view and Friendly (Minimal) view

## Version 1.0.21 — 2025-06-24

- Added a new version of CVE Chatbot
- Ask ChatGPT button
- Fixed bugs on multi-row elements
- Added `cwe-common.json` for CWE autocomplete lookup

## Version 1.0.20 — 2023-08-21

- Added `schemaToForm.js` generic library to support conversion of CVE schema
- Added updates to support viewing of full schema as presented by CVE 5.0 schema

## Version 1.0.19 — 2023-08-21

- Fixed bugs on `cveInterface.js` related to `apply_diff`
- Added the ability to download CVE JSON from repositories for edit/duplicate
- Moved display capabilities using CSS

## Version 1.0.18 — 2023-08-09

- Fixed bugs on `cveInterface.js` related to `from_json` and `to_json` routines
- The `cveClientlib.js` on 1.0.14 now supports ADP capability
- User Management interface bug fixes on duplicate ID or duplicate name field
- ADP client interface is available only via JSON editor at this time
- Require at least one product to have status "affected" or "unknown"

## Version 1.0.17 — 2023-08-09

- Allow entry of CVE data without being logged in just to create mock records
- Implemented offload download button for CVE records
- Fixed XSS issue due to changes to CVE Services RSUS interface
- Pagination issues resolved
