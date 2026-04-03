# SBOM Feature Design Spec — cveClient

**Date:** 2026-04-02
**Issue:** https://github.com/CERTCC/cveClient/issues/53
**Status:** Draft

## Goal

Add a comprehensive Software Bill of Materials (SBOM) to cveClient that identifies all components, dependencies, and tooling used in the project. The SBOM serves both security/compliance auditors (machine-readable formats) and developers (human-readable summaries).

## Scope

### Runtime SBOM

Components that ship to end users in the browser:

**Core application files:**

- `cveInterface.js` (v1.0.25)
- `cveClientlib.js` (v1.0.25)
- `schemaToForm.js` (v1.0.10)
- `autoCompleter.js` (v1.0.12)
- `encrypt-storage.js` (v1.1.15)
- `cveInterface.css` (v1.0.12)

**CDN dependencies (with SRI hashes):**

- jQuery 3.5.1
- Bootstrap 4.3.1 (CSS + JS)
- Popper.js 1.14.7
- Bootstrap-Table 1.19.1 (CSS + JS)

**Vendored dependencies:**

- Ace Editor ~1.2.4 (Apache-2.0)
- SweetAlert2 11.26.24 (MIT)

**Schema/data files:**

- CVE JSON 5.0 schema files (`schema/` directory)
- `cwe-common.json`
- `language-codes.json`

### Dev SBOM

Components used for development, testing, and CI/CD:

**npm dev dependencies:**

- vitest 3.2.4 + transitive deps
- jsdom 26.1.0 + transitive deps

**CI/CD toolchain:**

- GitHub Actions workflow files (`.github/workflows/`)
- Referenced Actions (e.g., `actions/checkout`, `actions/setup-node`)
- The SBOM generator script itself

## Output Files

All outputs go to `docs/sbom/`:

| File                     | Format             | Purpose                                                    |
| ------------------------ | ------------------ | ---------------------------------------------------------- |
| `cyclonedx-runtime.json` | CycloneDX 1.6 JSON | Machine-readable runtime SBOM for scanners/tooling         |
| `cyclonedx-dev.json`     | CycloneDX 1.6 JSON | Machine-readable dev SBOM for scanners/tooling             |
| `spdx-runtime.json`      | SPDX 2.3 JSON      | Machine-readable runtime SBOM (ISO standard)               |
| `spdx-dev.json`          | SPDX 2.3 JSON      | Machine-readable dev SBOM (ISO standard)                   |
| `spdx-runtime.spdx`      | SPDX 2.3 tag-value | Human-readable standard format for runtime                 |
| `spdx-dev.spdx`          | SPDX 2.3 tag-value | Human-readable standard format for dev                     |
| `SBOM.md`                | Markdown           | Summary page for GitHub browsers with links to other files |

### SBOM.md Structure

The markdown file serves as a quick-glance summary and navigation page:

- Project metadata (name, version, license, generation date)
- Runtime components table (component, version, license, type, source)
- CDN dependencies table (component, version, source URL, SRI hash, license)
- Vendored dependencies table (component, version, license)
- Schema/data files table
- Dev dependencies summary table
- CI/CD toolchain table (component, version/ref, purpose)
- Validation results (CycloneDX and SPDX schema pass/fail)
- Links to all machine-readable and tag-value files

### CycloneDX JSON Structure

Follows CycloneDX 1.6 specification:

- `bomFormat`: "CycloneDX"
- `specVersion`: "1.6"
- `serialNumber`: URN UUID
- `version`: 1
- `metadata`: tool info, component (cveClient), timestamp
- `components[]`: each with type, name, version, purl (for npm packages), cpe (where applicable), licenses, externalReferences (download URLs, SRI hashes)

### SPDX JSON Structure

Follows SPDX 2.3 specification:

- `spdxVersion`: "SPDX-2.3"
- `dataLicense`: "CC0-1.0"
- `SPDXID`: "SPDXRef-DOCUMENT"
- `documentNamespace`: unique URI
- `name`: document name
- `packages[]`: each with SPDXID, name, versionInfo, downloadLocation, licenseConcluded, checksums
- `relationships[]`: DESCRIBES, DEPENDS_ON relationships

### SPDX Tag-Value Structure

Same data as SPDX JSON but in human-readable key-value format:

```
SPDXVersion: SPDX-2.3
DataLicense: CC0-1.0
SPDXID: SPDXRef-DOCUMENT
DocumentName: cveClient-runtime-sbom
...

PackageName: jQuery
SPDXID: SPDXRef-jquery
PackageVersion: 3.5.1
PackageDownloadLocation: https://code.jquery.com/jquery-3.5.1.min.js
PackageLicenseConcluded: MIT
...
```

## Generator Script

### Location

`scripts/generate-sbom.js` — a single Node.js script with no external dependencies.

### Data Extraction

The script extracts component information from these sources:

1. **`index.html`** — regex extraction of CDN `<script>` and `<link>` tags to get URLs, versions, and SRI integrity hashes
2. **`package.json`** — project metadata (name, version, license, repository) and devDependencies
3. **`package-lock.json`** — resolved versions for dev dependency tree
4. **Vendored directories:**
   - `sweetalert2/sweetalert2.all.min.js` — extract version from file header comment
   - `ace-builds/` — extract version from `ace.js` header or README reference
5. **Core source files** — extract version constants from each `.js` file via regex
6. **`cveInterface.css`** — extract version from query parameter in `index.html` or file header
7. **`schema/`** — list all schema files with descriptions
8. **`.github/workflows/`** — parse YAML to extract referenced Actions and their versions

### Output Generation

The script builds internal component lists, then serializes to all seven output formats:

1. Build runtime component inventory
2. Build dev component inventory
3. Generate CycloneDX 1.6 JSON (runtime + dev)
4. Generate SPDX 2.3 JSON (runtime + dev)
5. Generate SPDX 2.3 tag-value (runtime + dev)
6. Generate SBOM.md summary
7. Write all seven files to `docs/sbom/`

### Exit Codes

- `0` — success, files written
- `1` — error (missing source files, parse failures)

Script logs what it found and what it generated to stdout for CI visibility.

## GitHub Action

### Workflow File

`.github/workflows/generate-sbom.yml`

### Triggers

```yaml
on:
  push:
    branches: [main]
    paths:
      - "index.html"
      - "package.json"
      - "package-lock.json"
      - "*.js"
      - "*.css"
      - "ace-builds/**"
      - "sweetalert2/**"
      - "schema/**"
      - "scripts/generate-sbom.js"
      - ".github/workflows/**"
  workflow_dispatch:
```

### Steps

1. **Checkout** — `actions/checkout` with full history
2. **Setup Node.js** — `actions/setup-node` (match existing CI version)
3. **Generate SBOMs** — `node scripts/generate-sbom.js`
4. **Validate CycloneDX** — fetch official CycloneDX 1.6 JSON schema, validate both JSON outputs using `npx ajv-cli validate`
5. **Validate SPDX** — fetch official SPDX 2.3 JSON schema, validate both JSON outputs using `npx ajv-cli validate`
6. **Diff check** — compare generated files against existing `docs/sbom/` content; exit early if nothing changed
7. **Create branch** — `sbom/update-YYYY-MM-DD`
8. **Commit** — commit all seven updated files
9. **Push + open PR** — using `gh pr create` with detailed body

### PR Body Format

The PR body will include:

```markdown
## SBOM Update — YYYY-MM-DD

### Summary

Automated SBOM regeneration triggered by changes to dependency-relevant files.

### Changes Detected

- [list of components added/removed/version-bumped, generated by diffing old vs new]

### Component Counts

| Category         | Runtime | Dev |
| ---------------- | ------- | --- |
| Total components | N       | N   |
| New              | N       | N   |
| Removed          | N       | N   |
| Version changed  | N       | N   |

### Validation Results

- CycloneDX 1.6 runtime: PASS/FAIL
- CycloneDX 1.6 dev: PASS/FAIL
- SPDX 2.3 runtime: PASS/FAIL
- SPDX 2.3 dev: PASS/FAIL

### Generated Files

- [`docs/sbom/SBOM.md`](link) — Human-readable summary
- [`docs/sbom/cyclonedx-runtime.json`](link) — CycloneDX runtime
- [`docs/sbom/cyclonedx-dev.json`](link) — CycloneDX dev
- [`docs/sbom/spdx-runtime.json`](link) — SPDX JSON runtime
- [`docs/sbom/spdx-dev.json`](link) — SPDX JSON dev
- [`docs/sbom/spdx-runtime.spdx`](link) — SPDX tag-value runtime
- [`docs/sbom/spdx-dev.spdx`](link) — SPDX tag-value dev
```

### Permissions

The workflow needs `contents: write` and `pull-requests: write` permissions to create branches and PRs.

## Schema Validation

The CI step validates machine-readable outputs against official schemas:

- **CycloneDX 1.6:** `https://cyclonedx.org/schema/bom-1.6.schema.json`
- **SPDX 2.3:** `https://raw.githubusercontent.com/spdx/spdx-spec/development/v2.3/schemas/spdx-schema.json`

Validation uses `npx ajv-cli` (no permanent install needed). Validation results are included in both the CI logs and the PR body. Validation failure does NOT block PR creation — the PR is still opened but the failure is prominently noted so it can be addressed in review.

## Component Identification

Where possible, components include standard identifiers:

- **purl** (Package URL) for npm packages: `pkg:npm/vitest@3.2.4`
- **purl** for CDN components: `pkg:npm/jquery@3.5.1` (since CDN serves npm packages)
- **CPE** where applicable for well-known libraries
- **Download URLs** for all external dependencies
- **SRI hashes** for CDN dependencies (already present in `index.html`)
- **License identifiers** using SPDX license expression syntax (e.g., `MIT`, `Apache-2.0`)

## Non-Goals

- No runtime SBOM viewer in the web UI (this is repo-level documentation only)
- No SBOM signing or attestation (can be added later)
- No automatic vulnerability cross-referencing (leave that to consumers of the SBOM files)
- No SBOM generation for downstream consumers who use `cveClientlib.js` as a library
