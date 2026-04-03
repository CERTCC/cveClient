# SBOM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate comprehensive SBOMs (CycloneDX 1.6, SPDX 2.3 JSON, SPDX 2.3 tag-value, and Markdown) for all cveClient runtime and dev components, automated via GitHub Actions.

**Architecture:** A modular Node.js generator under `scripts/sbom/` extracts component data from project source files, then serializes to four output formats in `docs/sbom/`. A GitHub Action runs the generator on relevant file changes and opens a PR via `gh`.

**Tech Stack:** Node.js (built-in `fs`, `path`, `crypto`), Vitest (testing), `npx ajv-cli` (CI validation), GitHub Actions + `gh` CLI (automation).

---

## File Structure

```
scripts/
  generate-sbom.mjs            # Main entry point - orchestrates extraction and generation
  sbom/
    extract.mjs                # Extracts component data from project files
    cyclonedx.mjs              # Generates CycloneDX 1.6 JSON
    spdx.mjs                   # Generates SPDX 2.3 JSON and tag-value
    markdown.mjs               # Generates SBOM.md summary

tests/
  sbom/
    extract.test.js            # Tests for data extraction
    cyclonedx.test.js          # Tests for CycloneDX output
    spdx.test.js               # Tests for SPDX JSON and tag-value output
    markdown.test.js           # Tests for Markdown output

docs/sbom/                     # Output directory (generated files)
  cyclonedx-runtime.json
  cyclonedx-dev.json
  spdx-runtime.json
  spdx-dev.json
  spdx-runtime.spdx
  spdx-dev.spdx
  SBOM.md

.github/workflows/
  generate-sbom.yml            # GitHub Action workflow
```

**Why `.mjs` for scripts:** The project's `package.json` has no `"type": "module"`, so `.mjs` enables ESM imports without affecting existing code. Test files stay `.js` since vitest handles ESM natively.

---

### Task 1: Component Data Extraction Module

**Files:**

- Create: `scripts/sbom/extract.mjs`
- Create: `tests/sbom/extract.test.js`

This is the core module - it reads project files and returns structured component inventories.

- [ ] **Step 1: Write failing tests for HTML CDN extraction**

Create `tests/sbom/extract.test.js`:

```js
import { describe, it, expect } from "vitest";
import { extractCdnDeps } from "../../scripts/sbom/extract.mjs";

describe("extractCdnDeps", () => {
  it("extracts script tags with integrity hashes", () => {
    const html = `
      <script src="https://code.jquery.com/jquery-3.5.1.min.js"
          integrity="sha384-ZvpUoO/+PpLXR1lu4jmpXWu80pZlYUAfxl5NsBMWOEPSjUn/6Z/hRTt8+pR6L4N2"
          crossorigin="anonymous"></script>
    `;
    const deps = extractCdnDeps(html);
    expect(deps).toHaveLength(1);
    expect(deps[0]).toMatchObject({
      name: "jquery",
      version: "3.5.1",
      url: "https://code.jquery.com/jquery-3.5.1.min.js",
      integrity:
        "sha384-ZvpUoO/+PpLXR1lu4jmpXWu80pZlYUAfxl5NsBMWOEPSjUn/6Z/hRTt8+pR6L4N2",
      type: "script",
    });
  });

  it("extracts link tags with integrity hashes", () => {
    const html = `
      <link rel="stylesheet"
        href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css"
        integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T"
        crossorigin="anonymous">
    `;
    const deps = extractCdnDeps(html);
    expect(deps).toHaveLength(1);
    expect(deps[0]).toMatchObject({
      name: "bootstrap",
      version: "4.3.1",
      type: "stylesheet",
    });
  });

  it("extracts multiple deps from full HTML", () => {
    const html = `
      <script src="https://code.jquery.com/jquery-3.5.1.min.js"
          integrity="sha384-ZvpUoO" crossorigin="anonymous"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js"
          integrity="sha384-UO2eT" crossorigin="anonymous"></script>
      <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js"
          integrity="sha384-JjSmV" crossorigin="anonymous"></script>
      <link rel="stylesheet"
        href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css"
        integrity="sha384-ggOyR" crossorigin="anonymous">
      <link rel="stylesheet"
        href="https://unpkg.com/bootstrap-table@1.19.1/dist/bootstrap-table.min.css"
        integrity="sha384-ppHVq" crossorigin="anonymous">
      <script src="https://unpkg.com/bootstrap-table@1.19.1/dist/bootstrap-table.min.js"
          integrity="sha384-c6BpB" crossorigin="anonymous"></script>
    `;
    const deps = extractCdnDeps(html);
    expect(deps).toHaveLength(6);
    const names = deps.map((d) => d.name);
    expect(names).toContain("jquery");
    expect(names).toContain("popper.js");
    expect(names).toContain("bootstrap");
    expect(names).toContain("bootstrap-table");
  });

  it("skips local scripts without integrity", () => {
    const html = `
      <script src="cveClientlib.js"></script>
      <script src="https://code.jquery.com/jquery-3.5.1.min.js"
          integrity="sha384-ZvpUoO" crossorigin="anonymous"></script>
    `;
    const deps = extractCdnDeps(html);
    expect(deps).toHaveLength(1);
    expect(deps[0].name).toBe("jquery");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/sbom/extract.test.js`
Expected: FAIL - module not found

- [ ] **Step 3: Write failing tests for source file version extraction**

Append to `tests/sbom/extract.test.js`:

```js
import { extractSourceVersions } from "../../scripts/sbom/extract.mjs";

describe("extractSourceVersions", () => {
  it("extracts this._version pattern", () => {
    const content = `class Foo {\n  constructor() {\n    this._version = "1.0.12";\n  }\n}`;
    const version = extractSourceVersions.parseVersion(content);
    expect(version).toBe("1.0.12");
  });

  it("extracts const _version pattern", () => {
    const content = `const _version = "1.0.25";`;
    const version = extractSourceVersions.parseVersion(content);
    expect(version).toBe("1.0.25");
  });

  it("extracts const name_version pattern", () => {
    const content = `const encrypt_storage_version = "1.1.15";`;
    const version = extractSourceVersions.parseVersion(content);
    expect(version).toBe("1.1.15");
  });
});
```

- [ ] **Step 4: Write failing tests for vendored dependency extraction**

Append to `tests/sbom/extract.test.js`:

```js
import { extractVendoredVersion } from "../../scripts/sbom/extract.mjs";

describe("extractVendoredVersion", () => {
  it("extracts SweetAlert2 version from header comment", () => {
    const content = `/*!\n* sweetalert2 v11.26.24\n* Released under the MIT License.\n*/`;
    const result = extractVendoredVersion.parseSweetalert(content);
    expect(result).toMatchObject({
      name: "sweetalert2",
      version: "11.26.24",
      license: "MIT",
    });
  });

  it("extracts Ace Editor version from source", () => {
    const content = `version="1.4.12"}),ace.define("ace/mouse"`;
    const result = extractVendoredVersion.parseAce(content);
    expect(result).toMatchObject({
      name: "ace-editor",
      version: "1.4.12",
      license: "Apache-2.0",
    });
  });
});
```

- [ ] **Step 5: Write failing tests for dev dependency extraction**

Append to `tests/sbom/extract.test.js`:

```js
import { extractDevDeps } from "../../scripts/sbom/extract.mjs";

describe("extractDevDeps", () => {
  it("extracts npm dev dependencies from package.json and lock", () => {
    const pkg = {
      devDependencies: { vitest: "^3.1.0", jsdom: "^26.1.0" },
    };
    const lock = {
      packages: {
        "node_modules/vitest": { version: "3.2.4", license: "MIT" },
        "node_modules/jsdom": { version: "26.1.0", license: "MIT" },
        "node_modules/chai": { version: "5.2.0", license: "MIT" },
      },
    };
    const result = extractDevDeps.fromNpm(pkg, lock);
    // Direct deps
    expect(result.direct).toHaveLength(2);
    expect(result.direct[0]).toMatchObject({
      name: "vitest",
      version: "3.2.4",
    });
    // Transitive deps
    expect(result.transitive.length).toBeGreaterThan(0);
    expect(result.transitive[0]).toMatchObject({
      name: "chai",
      version: "5.2.0",
    });
  });

  it("extracts GitHub Actions from workflow YAML", () => {
    const yaml = `
name: Tests
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm test
`;
    const actions = extractDevDeps.fromWorkflowYaml(yaml);
    expect(actions).toHaveLength(2);
    expect(actions[0]).toMatchObject({
      name: "actions/checkout",
      version: "v4",
    });
    expect(actions[1]).toMatchObject({
      name: "actions/setup-node",
      version: "v4",
    });
  });
});
```

- [ ] **Step 6: Implement `scripts/sbom/extract.mjs`**

Create `scripts/sbom/extract.mjs`:

```js
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Extract CDN dependencies from HTML string.
 * Finds <script> and <link> tags with integrity attributes.
 */
export function extractCdnDeps(html) {
  const deps = [];

  // Match script tags with src and integrity
  const scriptRe =
    /<script\s+[^>]*src=["']([^"']+)["'][^>]*integrity=["']([^"']+)["'][^>]*>/gi;

  let m;
  while ((m = scriptRe.exec(html)) !== null) {
    const url = m[1];
    const integrity = m[2];
    const parsed = parseCdnUrl(url);
    if (parsed) {
      deps.push({ ...parsed, url, integrity, type: "script" });
    }
  }

  // Match link tags with href and integrity
  const linkRe =
    /<link\s+[^>]*href=["']([^"']+)["'][^>]*integrity=["']([^"']+)["'][^>]*>/gi;
  while ((m = linkRe.exec(html)) !== null) {
    const url = m[1];
    const integrity = m[2];
    const parsed = parseCdnUrl(url);
    if (parsed) {
      deps.push({ ...parsed, url, integrity, type: "stylesheet" });
    }
  }

  return deps;
}

/**
 * Parse a CDN URL to extract package name and version.
 */
function parseCdnUrl(url) {
  // jquery: code.jquery.com/jquery-3.5.1.min.js
  const jqueryMatch = url.match(/jquery[/-]([\d.]+)/);
  if (jqueryMatch) return { name: "jquery", version: jqueryMatch[1] };

  // unpkg: unpkg.com/<pkg>@<ver>/...
  const unpkgMatch2 = url.match(/unpkg\.com\/([\w-]+)@([\d.]+)/);
  if (unpkgMatch2) return { name: unpkgMatch2[1], version: unpkgMatch2[2] };

  // cdnjs: cdnjs.cloudflare.com/ajax/libs/<name>/<version>/...
  const cdnjsMatch = url.match(
    /cdnjs\.cloudflare\.com\/ajax\/libs\/([\w.-]+)\/([\d.]+)/,
  );
  if (cdnjsMatch) return { name: cdnjsMatch[1], version: cdnjsMatch[2] };

  // stackpath/bootstrapcdn: stackpath.bootstrapcdn.com/bootstrap/<version>/...
  const stackpathMatch = url.match(/bootstrapcdn\.com\/([\w-]+)\/([\d.]+)/);
  if (stackpathMatch)
    return { name: stackpathMatch[1], version: stackpathMatch[2] };

  return null;
}

/**
 * Extract version strings from JavaScript source content.
 */
export const extractSourceVersions = {
  parseVersion(content) {
    // Matches: this._version = "X.X.X"
    const m1 = content.match(/this\._version\s*=\s*["']([\d.]+)["']/);
    if (m1) return m1[1];

    // Matches: const _version = "X.X.X" or const xyz_version = "X.X.X"
    const m2 = content.match(/const\s+\w*version\s*=\s*["']([\d.]+)["']/i);
    if (m2) return m2[1];

    return null;
  },

  /**
   * Read all core source files and return version info.
   * @param {string} projectRoot - absolute path to project root
   */
  fromFiles(projectRoot) {
    const files = [
      { file: "cveInterface.js", name: "cveInterface" },
      { file: "cveClientlib.js", name: "cveClientlib" },
      { file: "schemaToForm.js", name: "schemaToForm" },
      { file: "autoCompleter.js", name: "autoCompleter" },
      { file: "encrypt-storage.js", name: "encrypt-storage" },
    ];
    return files.map(({ file, name }) => {
      const content = readFileSync(join(projectRoot, file), "utf8");
      const version = this.parseVersion(content);
      return { name, file, version, license: "MIT", type: "application" };
    });
  },
};

/**
 * Extract vendored dependency versions.
 */
export const extractVendoredVersion = {
  parseSweetalert(content) {
    const m = content.match(/sweetalert2\s+v([\d.]+)/);
    const licenseM = content.match(/Released under the (\S+) License/);
    return m
      ? {
          name: "sweetalert2",
          version: m[1],
          license: licenseM ? licenseM[1] : "MIT",
        }
      : null;
  },

  parseAce(content) {
    const m = content.match(/version=["']([\d.]+)["']/);
    return m
      ? { name: "ace-editor", version: m[1], license: "Apache-2.0" }
      : null;
  },

  /**
   * Read vendored dirs and return version info.
   * @param {string} projectRoot
   */
  fromFiles(projectRoot) {
    const results = [];
    const swalPath = join(projectRoot, "sweetalert2", "sweetalert2.all.min.js");
    const swalContent = readFileSync(swalPath, "utf8").slice(0, 200);
    const swal = this.parseSweetalert(swalContent);
    if (swal) results.push({ ...swal, type: "library" });

    const acePath = join(
      projectRoot,
      "ace-builds",
      "src-min-noconflict",
      "ace.js",
    );
    const aceContent = readFileSync(acePath, "utf8").slice(0, 50000);
    const ace = this.parseAce(aceContent);
    if (ace) results.push({ ...ace, type: "library" });

    return results;
  },
};

/**
 * Extract dev/CI dependencies.
 */
export const extractDevDeps = {
  /**
   * Extract npm dev dependencies, split into direct and transitive.
   */
  fromNpm(pkg, lock) {
    const directNames = Object.keys(pkg.devDependencies || {});
    const direct = [];
    const transitive = [];

    for (const [key, info] of Object.entries(lock.packages || {})) {
      if (!key.startsWith("node_modules/")) continue;
      const name = key.replace("node_modules/", "");
      // Skip nested deps (node_modules/x/node_modules/y)
      if (name.includes("node_modules/")) continue;
      const entry = {
        name,
        version: info.version,
        license: info.license || "NOASSERTION",
        type: "library",
      };
      if (directNames.includes(name)) {
        direct.push(entry);
      } else {
        transitive.push(entry);
      }
    }
    return { direct, transitive };
  },

  /**
   * Extract GitHub Actions references from workflow YAML.
   * Simple regex parser - no YAML library needed.
   */
  fromWorkflowYaml(yaml) {
    const actions = [];
    const re = /uses:\s*([\w-]+\/[\w-]+)@(\S+)/g;
    let m;
    while ((m = re.exec(yaml)) !== null) {
      actions.push({ name: m[1], version: m[2], type: "github-action" });
    }
    return actions;
  },

  /**
   * Read all workflow files and return actions.
   * @param {string} projectRoot
   */
  fromWorkflowFiles(projectRoot) {
    const workflowDir = join(projectRoot, ".github", "workflows");
    let files;
    try {
      files = readdirSync(workflowDir).filter(
        (f) => f.endsWith(".yml") || f.endsWith(".yaml"),
      );
    } catch {
      return [];
    }
    const allActions = [];
    const seen = new Set();
    for (const file of files) {
      const content = readFileSync(join(workflowDir, file), "utf8");
      for (const action of this.fromWorkflowYaml(content)) {
        const key = `${action.name}@${action.version}`;
        if (!seen.has(key)) {
          seen.add(key);
          allActions.push({ ...action, sourceFile: file });
        }
      }
    }
    return allActions;
  },
};

/**
 * Extract CSS version from index.html query parameter.
 */
export function extractCssVersion(html) {
  const m = html.match(/cveInterface\.css\?v=([\d.]+)/);
  return m
    ? {
        name: "cveInterface",
        file: "cveInterface.css",
        version: m[1],
        license: "MIT",
        type: "stylesheet",
      }
    : null;
}

/**
 * List schema files.
 */
export function listSchemaFiles(projectRoot) {
  const schemaDir = join(projectRoot, "schema");
  return readdirSync(schemaDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ name: f, file: join("schema", f), type: "data" }));
}

/**
 * Master extraction - reads all project sources and returns full inventory.
 * @param {string} projectRoot
 * @returns {{ project: object, runtime: object[], dev: object }}
 */
export function extractAll(projectRoot) {
  const pkgPath = join(projectRoot, "package.json");
  const lockPath = join(projectRoot, "package-lock.json");
  const htmlPath = join(projectRoot, "index.html");

  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const lock = JSON.parse(readFileSync(lockPath, "utf8"));
  const html = readFileSync(htmlPath, "utf8");

  const project = {
    name: pkg.name || "cveclient",
    version: pkg.version,
    license: "MIT",
    repository: "https://github.com/CERTCC/cveClient",
  };

  const cdnDeps = extractCdnDeps(html);
  const sourceFiles = extractSourceVersions.fromFiles(projectRoot);
  const vendored = extractVendoredVersion.fromFiles(projectRoot);
  const css = extractCssVersion(html);
  const schemas = listSchemaFiles(projectRoot);

  const runtime = [
    ...sourceFiles,
    ...(css ? [css] : []),
    ...cdnDeps,
    ...vendored,
    ...schemas,
  ];

  const npmDeps = extractDevDeps.fromNpm(pkg, lock);
  const actions = extractDevDeps.fromWorkflowFiles(projectRoot);

  const dev = {
    direct: npmDeps.direct,
    transitive: npmDeps.transitive,
    actions,
  };

  return { project, runtime, dev };
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx vitest run tests/sbom/extract.test.js`
Expected: All 9 tests PASS

- [ ] **Step 8: Commit**

```bash
git add scripts/sbom/extract.mjs tests/sbom/extract.test.js
git commit -m "feat(sbom): add component data extraction module with tests"
```

---

### Task 2: CycloneDX 1.6 JSON Generator

**Files:**

- Create: `scripts/sbom/cyclonedx.mjs`
- Create: `tests/sbom/cyclonedx.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/sbom/cyclonedx.test.js`:

```js
import { describe, it, expect } from "vitest";
import { generateCycloneDX } from "../../scripts/sbom/cyclonedx.mjs";

const mockProject = {
  name: "cveclient",
  version: "1.0.25",
  license: "MIT",
  repository: "https://github.com/CERTCC/cveClient",
};

const mockRuntime = [
  {
    name: "jquery",
    version: "3.5.1",
    url: "https://code.jquery.com/jquery-3.5.1.min.js",
    integrity: "sha384-ZvpUoO",
    type: "script",
    license: "MIT",
  },
  {
    name: "cveClientlib",
    file: "cveClientlib.js",
    version: "1.0.25",
    license: "MIT",
    type: "application",
  },
];

const mockDev = {
  direct: [
    { name: "vitest", version: "3.2.4", license: "MIT", type: "library" },
  ],
  transitive: [
    { name: "chai", version: "5.2.0", license: "MIT", type: "library" },
  ],
  actions: [{ name: "actions/checkout", version: "v4", type: "github-action" }],
};

describe("generateCycloneDX", () => {
  it("produces valid top-level structure for runtime", () => {
    const bom = generateCycloneDX(mockProject, mockRuntime, "runtime");
    expect(bom.bomFormat).toBe("CycloneDX");
    expect(bom.specVersion).toBe("1.6");
    expect(bom.version).toBe(1);
    expect(bom.serialNumber).toMatch(/^urn:uuid:/);
    expect(bom.metadata.component.name).toBe("cveclient");
    expect(bom.components).toHaveLength(2);
  });

  it("sets correct purl for npm-sourced CDN deps", () => {
    const bom = generateCycloneDX(mockProject, mockRuntime, "runtime");
    const jquery = bom.components.find((c) => c.name === "jquery");
    expect(jquery.purl).toBe("pkg:npm/jquery@3.5.1");
  });

  it("includes SRI hash in externalReferences", () => {
    const bom = generateCycloneDX(mockProject, mockRuntime, "runtime");
    const jquery = bom.components.find((c) => c.name === "jquery");
    const ref = jquery.externalReferences.find(
      (r) => r.type === "distribution",
    );
    expect(ref.url).toBe("https://code.jquery.com/jquery-3.5.1.min.js");
    expect(ref.hashes).toBeDefined();
  });

  it("produces dev BOM with all dep categories", () => {
    const devComponents = [
      ...mockDev.direct,
      ...mockDev.transitive,
      ...mockDev.actions,
    ];
    const bom = generateCycloneDX(mockProject, devComponents, "dev");
    expect(bom.components).toHaveLength(3);
    const action = bom.components.find((c) => c.name === "actions/checkout");
    expect(action.type).toBe("application");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/sbom/cyclonedx.test.js`
Expected: FAIL - module not found

- [ ] **Step 3: Implement `scripts/sbom/cyclonedx.mjs`**

```js
import { randomUUID } from "node:crypto";

/**
 * Map component type to CycloneDX component type.
 */
function cdxType(type) {
  switch (type) {
    case "application":
    case "github-action":
      return "application";
    case "library":
    case "script":
    case "stylesheet":
      return "library";
    case "data":
      return "data";
    default:
      return "library";
  }
}

/**
 * Build a purl for a component if possible.
 */
function buildPurl(comp) {
  if (comp.type === "github-action") {
    return `pkg:github/${comp.name}@${comp.version}`;
  }
  if (comp.version && comp.name && !comp.file?.endsWith(".json")) {
    return `pkg:npm/${comp.name}@${comp.version}`;
  }
  return undefined;
}

/**
 * Build external references for a component.
 */
function buildExternalRefs(comp) {
  const refs = [];
  if (comp.url) {
    const ref = { type: "distribution", url: comp.url };
    if (comp.integrity) {
      // SRI format: sha384-<base64>
      const [algo, hash] = comp.integrity.split("-", 2);
      ref.hashes = [
        { alg: algo.toUpperCase().replace("SHA", "SHA-"), content: hash },
      ];
    }
    refs.push(ref);
  }
  return refs.length > 0 ? refs : undefined;
}

/**
 * Generate CycloneDX 1.6 JSON BOM.
 *
 * @param {object} project - { name, version, license, repository }
 * @param {object[]} components - array of component objects
 * @param {string} scope - "runtime" or "dev"
 * @returns {object} CycloneDX BOM object
 */
export function generateCycloneDX(project, components, scope) {
  return {
    $schema: "https://cyclonedx.org/schema/bom-1.6.schema.json",
    bomFormat: "CycloneDX",
    specVersion: "1.6",
    serialNumber: `urn:uuid:${randomUUID()}`,
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      tools: [{ name: "cveClient-sbom-generator", version: project.version }],
      component: {
        type: "application",
        name: project.name,
        version: project.version,
        licenses: [{ license: { id: project.license } }],
      },
    },
    components: components.map((comp) => {
      const entry = {
        type: cdxType(comp.type),
        name: comp.name,
      };
      if (comp.version) entry.version = comp.version;
      const purl = buildPurl(comp);
      if (purl) entry.purl = purl;
      if (comp.license) {
        entry.licenses = [{ license: { id: comp.license } }];
      }
      const refs = buildExternalRefs(comp);
      if (refs) entry.externalReferences = refs;
      return entry;
    }),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/sbom/cyclonedx.test.js`
Expected: All 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/sbom/cyclonedx.mjs tests/sbom/cyclonedx.test.js
git commit -m "feat(sbom): add CycloneDX 1.6 JSON generator with tests"
```

---

### Task 3: SPDX 2.3 Generators (JSON + Tag-Value)

**Files:**

- Create: `scripts/sbom/spdx.mjs`
- Create: `tests/sbom/spdx.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/sbom/spdx.test.js`:

```js
import { describe, it, expect } from "vitest";
import {
  generateSpdxJson,
  generateSpdxTagValue,
} from "../../scripts/sbom/spdx.mjs";

const mockProject = {
  name: "cveclient",
  version: "1.0.25",
  license: "MIT",
  repository: "https://github.com/CERTCC/cveClient",
};

const mockComponents = [
  {
    name: "jquery",
    version: "3.5.1",
    url: "https://code.jquery.com/jquery-3.5.1.min.js",
    license: "MIT",
    type: "script",
  },
  {
    name: "cveClientlib",
    file: "cveClientlib.js",
    version: "1.0.25",
    license: "MIT",
    type: "application",
  },
];

describe("generateSpdxJson", () => {
  it("produces valid SPDX 2.3 structure", () => {
    const doc = generateSpdxJson(mockProject, mockComponents, "runtime");
    expect(doc.spdxVersion).toBe("SPDX-2.3");
    expect(doc.dataLicense).toBe("CC0-1.0");
    expect(doc.SPDXID).toBe("SPDXRef-DOCUMENT");
    expect(doc.name).toContain("cveclient");
    expect(doc.documentNamespace).toMatch(/^https:\/\//);
    expect(doc.packages).toHaveLength(3); // root + 2 components
  });

  it("creates root package for the project", () => {
    const doc = generateSpdxJson(mockProject, mockComponents, "runtime");
    const root = doc.packages.find((p) => p.SPDXID === "SPDXRef-root");
    expect(root.name).toBe("cveclient");
    expect(root.versionInfo).toBe("1.0.25");
  });

  it("creates DESCRIBES and DEPENDS_ON relationships", () => {
    const doc = generateSpdxJson(mockProject, mockComponents, "runtime");
    const describes = doc.relationships.find(
      (r) => r.relationshipType === "DESCRIBES",
    );
    expect(describes.spdxElementId).toBe("SPDXRef-DOCUMENT");
    expect(describes.relatedSpdxElement).toBe("SPDXRef-root");

    const dependsOn = doc.relationships.filter(
      (r) => r.relationshipType === "DEPENDS_ON",
    );
    expect(dependsOn).toHaveLength(2);
  });

  it("sets downloadLocation for CDN deps", () => {
    const doc = generateSpdxJson(mockProject, mockComponents, "runtime");
    const jquery = doc.packages.find((p) => p.name === "jquery");
    expect(jquery.downloadLocation).toBe(
      "https://code.jquery.com/jquery-3.5.1.min.js",
    );
  });
});

describe("generateSpdxTagValue", () => {
  it("produces valid SPDX tag-value header", () => {
    const tv = generateSpdxTagValue(mockProject, mockComponents, "runtime");
    expect(tv).toContain("SPDXVersion: SPDX-2.3");
    expect(tv).toContain("DataLicense: CC0-1.0");
    expect(tv).toContain("SPDXID: SPDXRef-DOCUMENT");
  });

  it("contains package entries", () => {
    const tv = generateSpdxTagValue(mockProject, mockComponents, "runtime");
    expect(tv).toContain("PackageName: jquery");
    expect(tv).toContain("PackageVersion: 3.5.1");
    expect(tv).toContain("PackageLicenseConcluded: MIT");
  });

  it("contains relationship entries", () => {
    const tv = generateSpdxTagValue(mockProject, mockComponents, "runtime");
    expect(tv).toContain(
      "Relationship: SPDXRef-DOCUMENT DESCRIBES SPDXRef-root",
    );
    expect(tv).toContain("Relationship: SPDXRef-root DEPENDS_ON SPDXRef-");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/sbom/spdx.test.js`
Expected: FAIL - module not found

- [ ] **Step 3: Implement `scripts/sbom/spdx.mjs`**

```js
import { randomUUID } from "node:crypto";

/**
 * Create a sanitized SPDX ID from a component name.
 * SPDX IDs: [a-zA-Z0-9.-]+ only.
 */
function spdxId(name) {
  return "SPDXRef-" + name.replace(/[^a-zA-Z0-9.-]/g, "-");
}

/**
 * Generate SPDX 2.3 JSON document.
 */
export function generateSpdxJson(project, components, scope) {
  const uuid = randomUUID();
  const timestamp = new Date().toISOString();

  const rootPkg = {
    SPDXID: "SPDXRef-root",
    name: project.name,
    versionInfo: project.version,
    downloadLocation: project.repository,
    licenseConcluded: project.license,
    licenseDeclared: project.license,
    copyrightText: "NOASSERTION",
    supplier: "Organization: CERT/CC",
    primaryPackagePurpose: "APPLICATION",
  };

  const packages = [rootPkg];
  const relationships = [
    {
      spdxElementId: "SPDXRef-DOCUMENT",
      relatedSpdxElement: "SPDXRef-root",
      relationshipType: "DESCRIBES",
    },
  ];

  for (const comp of components) {
    const id = spdxId(comp.name);
    const pkg = {
      SPDXID: id,
      name: comp.name,
      downloadLocation: comp.url || "NOASSERTION",
      licenseConcluded: comp.license || "NOASSERTION",
      licenseDeclared: comp.license || "NOASSERTION",
      copyrightText: "NOASSERTION",
    };
    if (comp.version) pkg.versionInfo = comp.version;
    packages.push(pkg);

    relationships.push({
      spdxElementId: "SPDXRef-root",
      relatedSpdxElement: id,
      relationshipType: "DEPENDS_ON",
    });
  }

  return {
    spdxVersion: "SPDX-2.3",
    dataLicense: "CC0-1.0",
    SPDXID: "SPDXRef-DOCUMENT",
    name: `${project.name}-${scope}-sbom`,
    documentNamespace: `https://github.com/CERTCC/cveClient/spdx/${scope}/${uuid}`,
    creationInfo: {
      created: timestamp,
      creators: [
        "Tool: cveClient-sbom-generator-" + project.version,
        "Organization: CERT/CC",
      ],
    },
    packages,
    relationships,
  };
}

/**
 * Generate SPDX 2.3 tag-value format string.
 */
export function generateSpdxTagValue(project, components, scope) {
  const doc = generateSpdxJson(project, components, scope);
  const lines = [];

  // Document header
  lines.push(`SPDXVersion: ${doc.spdxVersion}`);
  lines.push(`DataLicense: ${doc.dataLicense}`);
  lines.push(`SPDXID: ${doc.SPDXID}`);
  lines.push(`DocumentName: ${doc.name}`);
  lines.push(`DocumentNamespace: ${doc.documentNamespace}`);
  lines.push(`Creator: ${doc.creationInfo.creators[0]}`);
  lines.push(`Creator: ${doc.creationInfo.creators[1]}`);
  lines.push(`Created: ${doc.creationInfo.created}`);
  lines.push("");

  // Packages
  for (const pkg of doc.packages) {
    lines.push(`PackageName: ${pkg.name}`);
    lines.push(`SPDXID: ${pkg.SPDXID}`);
    if (pkg.versionInfo) lines.push(`PackageVersion: ${pkg.versionInfo}`);
    lines.push(`PackageDownloadLocation: ${pkg.downloadLocation}`);
    lines.push(`PackageLicenseConcluded: ${pkg.licenseConcluded}`);
    lines.push(`PackageLicenseDeclared: ${pkg.licenseDeclared}`);
    lines.push(`PackageCopyrightText: ${pkg.copyrightText}`);
    if (pkg.supplier) lines.push(`PackageSupplier: ${pkg.supplier}`);
    if (pkg.primaryPackagePurpose) {
      lines.push(`PrimaryPackagePurpose: ${pkg.primaryPackagePurpose}`);
    }
    lines.push("");
  }

  // Relationships
  for (const rel of doc.relationships) {
    lines.push(
      `Relationship: ${rel.spdxElementId} ${rel.relationshipType} ${rel.relatedSpdxElement}`,
    );
  }
  lines.push("");

  return lines.join("\n");
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/sbom/spdx.test.js`
Expected: All 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/sbom/spdx.mjs tests/sbom/spdx.test.js
git commit -m "feat(sbom): add SPDX 2.3 JSON and tag-value generators with tests"
```

---

### Task 4: Markdown Summary Generator

**Files:**

- Create: `scripts/sbom/markdown.mjs`
- Create: `tests/sbom/markdown.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/sbom/markdown.test.js`:

```js
import { describe, it, expect } from "vitest";
import { generateMarkdown } from "../../scripts/sbom/markdown.mjs";

const mockProject = {
  name: "cveclient",
  version: "1.0.25",
  license: "MIT",
  repository: "https://github.com/CERTCC/cveClient",
};

const mockRuntime = [
  {
    name: "cveClientlib",
    file: "cveClientlib.js",
    version: "1.0.25",
    license: "MIT",
    type: "application",
  },
  {
    name: "jquery",
    version: "3.5.1",
    url: "https://code.jquery.com/jquery-3.5.1.min.js",
    integrity: "sha384-ZvpUoO",
    license: "MIT",
    type: "script",
  },
  { name: "sweetalert2", version: "11.26.24", license: "MIT", type: "library" },
  {
    name: "CVE_Record_Format_bundled.json",
    file: "schema/CVE_Record_Format_bundled.json",
    type: "data",
  },
];

const mockDev = {
  direct: [
    { name: "vitest", version: "3.2.4", license: "MIT", type: "library" },
  ],
  transitive: [
    { name: "chai", version: "5.2.0", license: "MIT", type: "library" },
  ],
  actions: [{ name: "actions/checkout", version: "v4", type: "github-action" }],
};

describe("generateMarkdown", () => {
  it("includes project header", () => {
    const md = generateMarkdown(mockProject, mockRuntime, mockDev);
    expect(md).toContain("# Software Bill of Materials");
    expect(md).toContain("cveclient");
    expect(md).toContain("1.0.25");
  });

  it("has runtime components section", () => {
    const md = generateMarkdown(mockProject, mockRuntime, mockDev);
    expect(md).toContain("## Runtime Components");
    expect(md).toContain("cveClientlib");
    expect(md).toContain("jquery");
    expect(md).toContain("sweetalert2");
  });

  it("has CDN dependencies with SRI hashes", () => {
    const md = generateMarkdown(mockProject, mockRuntime, mockDev);
    expect(md).toContain("sha384-ZvpUoO");
  });

  it("has dev dependencies section", () => {
    const md = generateMarkdown(mockProject, mockRuntime, mockDev);
    expect(md).toContain("## Dev/CI Dependencies");
    expect(md).toContain("vitest");
    expect(md).toContain("actions/checkout");
  });

  it("has schema/data files section", () => {
    const md = generateMarkdown(mockProject, mockRuntime, mockDev);
    expect(md).toContain("CVE_Record_Format_bundled.json");
  });

  it("links to machine-readable files", () => {
    const md = generateMarkdown(mockProject, mockRuntime, mockDev);
    expect(md).toContain("cyclonedx-runtime.json");
    expect(md).toContain("spdx-runtime.spdx");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/sbom/markdown.test.js`
Expected: FAIL - module not found

- [ ] **Step 3: Implement `scripts/sbom/markdown.mjs`**

```js
/**
 * Generate SBOM.md markdown summary.
 *
 * @param {object} project
 * @param {object[]} runtime
 * @param {object} dev - { direct, transitive, actions }
 * @returns {string}
 */
export function generateMarkdown(project, runtime, dev) {
  const date = new Date().toISOString().slice(0, 10);
  const lines = [];

  lines.push(`# Software Bill of Materials - ${project.name}`);
  lines.push("");
  lines.push(
    `**Version:** ${project.version} | **License:** ${project.license} | **Generated:** ${date}`,
  );
  lines.push("");

  // Split runtime by type
  const appFiles = runtime.filter((c) => c.type === "application");
  const stylesheets = runtime.filter((c) => c.type === "stylesheet");
  const cdnDeps = runtime.filter((c) => c.type === "script");
  const vendored = runtime.filter((c) => c.type === "library");
  const dataFiles = runtime.filter((c) => c.type === "data");

  // Core Application Files
  lines.push("## Runtime Components");
  lines.push("");
  lines.push("### Core Application Files");
  lines.push("");
  lines.push("| Component | File | Version | License |");
  lines.push("|-----------|------|---------|---------|");
  for (const c of [...appFiles, ...stylesheets]) {
    lines.push(
      `| ${c.name} | ${c.file || ""} | ${c.version || ""} | ${c.license || ""} |`,
    );
  }
  lines.push("");

  // CDN Dependencies
  if (cdnDeps.length > 0) {
    lines.push("### CDN Dependencies");
    lines.push("");
    lines.push("| Component | Version | URL | SRI Hash | License |");
    lines.push("|-----------|---------|-----|----------|---------|");
    for (const c of cdnDeps) {
      lines.push(
        `| ${c.name} | ${c.version} | ${c.url || ""} | ${c.integrity || ""} | ${c.license || ""} |`,
      );
    }
    lines.push("");
  }

  // Vendored Dependencies
  if (vendored.length > 0) {
    lines.push("### Vendored Dependencies");
    lines.push("");
    lines.push("| Component | Version | License |");
    lines.push("|-----------|---------|---------|");
    for (const c of vendored) {
      lines.push(`| ${c.name} | ${c.version} | ${c.license} |`);
    }
    lines.push("");
  }

  // Schema/Data Files
  if (dataFiles.length > 0) {
    lines.push("### Schema/Data Files");
    lines.push("");
    lines.push("| File | Path |");
    lines.push("|------|------|");
    for (const c of dataFiles) {
      lines.push(`| ${c.name} | ${c.file || ""} |`);
    }
    lines.push("");
  }

  // Dev Dependencies
  lines.push("## Dev/CI Dependencies");
  lines.push("");

  if (dev.direct.length > 0) {
    lines.push("### npm Dev Dependencies (Direct)");
    lines.push("");
    lines.push("| Package | Version | License |");
    lines.push("|---------|---------|---------|");
    for (const c of dev.direct) {
      lines.push(`| ${c.name} | ${c.version} | ${c.license} |`);
    }
    lines.push("");
  }

  if (dev.transitive.length > 0) {
    lines.push(
      `<details><summary>Transitive npm dependencies (${dev.transitive.length})</summary>`,
    );
    lines.push("");
    lines.push("| Package | Version | License |");
    lines.push("|---------|---------|---------|");
    for (const c of dev.transitive) {
      lines.push(`| ${c.name} | ${c.version} | ${c.license} |`);
    }
    lines.push("");
    lines.push("</details>");
    lines.push("");
  }

  if (dev.actions.length > 0) {
    lines.push("### CI/CD Toolchain (GitHub Actions)");
    lines.push("");
    lines.push("| Action | Version |");
    lines.push("|--------|---------|");
    for (const c of dev.actions) {
      lines.push(`| ${c.name} | ${c.version} |`);
    }
    lines.push("");
  }

  // Links to machine-readable files
  lines.push("## Machine-Readable Formats");
  lines.push("");
  lines.push("| File | Format |");
  lines.push("|------|--------|");
  lines.push(
    "| [cyclonedx-runtime.json](cyclonedx-runtime.json) | CycloneDX 1.6 JSON |",
  );
  lines.push(
    "| [cyclonedx-dev.json](cyclonedx-dev.json) | CycloneDX 1.6 JSON |",
  );
  lines.push("| [spdx-runtime.json](spdx-runtime.json) | SPDX 2.3 JSON |");
  lines.push("| [spdx-dev.json](spdx-dev.json) | SPDX 2.3 JSON |");
  lines.push("| [spdx-runtime.spdx](spdx-runtime.spdx) | SPDX 2.3 Tag-Value |");
  lines.push("| [spdx-dev.spdx](spdx-dev.spdx) | SPDX 2.3 Tag-Value |");
  lines.push("");

  return lines.join("\n");
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/sbom/markdown.test.js`
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/sbom/markdown.mjs tests/sbom/markdown.test.js
git commit -m "feat(sbom): add Markdown summary generator with tests"
```

---

### Task 5: Main Entry Point Script

**Files:**

- Create: `scripts/generate-sbom.mjs`
- Create: `docs/sbom/` (output directory)

- [ ] **Step 1: Implement `scripts/generate-sbom.mjs`**

```js
#!/usr/bin/env node

/**
 * SBOM Generator for cveClient
 *
 * Reads project source files and generates:
 *   - CycloneDX 1.6 JSON (runtime + dev)
 *   - SPDX 2.3 JSON (runtime + dev)
 *   - SPDX 2.3 tag-value (runtime + dev)
 *   - Markdown summary
 *
 * Usage: node scripts/generate-sbom.mjs [project-root]
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { extractAll } from "./sbom/extract.mjs";
import { generateCycloneDX } from "./sbom/cyclonedx.mjs";
import { generateSpdxJson, generateSpdxTagValue } from "./sbom/spdx.mjs";
import { generateMarkdown } from "./sbom/markdown.mjs";

const projectRoot = resolve(process.argv[2] || ".");
const outDir = join(projectRoot, "docs", "sbom");

console.log(`SBOM Generator - scanning ${projectRoot}`);

// Extract all component data
const { project, runtime, dev } = extractAll(projectRoot);

console.log(`  Project: ${project.name} v${project.version}`);
console.log(`  Runtime components: ${runtime.length}`);
console.log(`  Dev direct deps: ${dev.direct.length}`);
console.log(`  Dev transitive deps: ${dev.transitive.length}`);
console.log(`  CI/CD actions: ${dev.actions.length}`);

// Flatten dev for generators that take a flat array
const devAll = [...dev.direct, ...dev.transitive, ...dev.actions];

// Generate all formats
const cdxRuntime = generateCycloneDX(project, runtime, "runtime");
const cdxDev = generateCycloneDX(project, devAll, "dev");
const spdxRuntimeJson = generateSpdxJson(project, runtime, "runtime");
const spdxDevJson = generateSpdxJson(project, devAll, "dev");
const spdxRuntimeTv = generateSpdxTagValue(project, runtime, "runtime");
const spdxDevTv = generateSpdxTagValue(project, devAll, "dev");
const markdown = generateMarkdown(project, runtime, dev);

// Write output files
mkdirSync(outDir, { recursive: true });

const files = [
  ["cyclonedx-runtime.json", JSON.stringify(cdxRuntime, null, 2)],
  ["cyclonedx-dev.json", JSON.stringify(cdxDev, null, 2)],
  ["spdx-runtime.json", JSON.stringify(spdxRuntimeJson, null, 2)],
  ["spdx-dev.json", JSON.stringify(spdxDevJson, null, 2)],
  ["spdx-runtime.spdx", spdxRuntimeTv],
  ["spdx-dev.spdx", spdxDevTv],
  ["SBOM.md", markdown],
];

for (const [name, content] of files) {
  const path = join(outDir, name);
  writeFileSync(path, content, "utf8");
  console.log(`  Wrote: ${path}`);
}

console.log("\nDone - 7 SBOM files generated.");
```

- [ ] **Step 2: Create output directory and run the script**

Run: `node scripts/generate-sbom.mjs`
Expected: Script runs, prints component counts, writes 7 files to `docs/sbom/`

- [ ] **Step 3: Verify output files exist and are non-empty**

Run: `ls -la docs/sbom/ && head -5 docs/sbom/cyclonedx-runtime.json && head -5 docs/sbom/spdx-runtime.spdx`
Expected: All 7 files listed; CycloneDX shows valid JSON start; SPDX tag-value shows header

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-sbom.mjs docs/sbom/
git commit -m "feat(sbom): add main generator script and initial SBOM output"
```

---

### Task 6: GitHub Action Workflow

**Files:**

- Create: `.github/workflows/generate-sbom.yml`

- [ ] **Step 1: Create the workflow file**

Create `.github/workflows/generate-sbom.yml`:

```yaml
name: Generate SBOM

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
      - "scripts/generate-sbom.mjs"
      - "scripts/sbom/**"
      - ".github/workflows/**"
  workflow_dispatch:

permissions:
  contents: write
  pull-requests: write

jobs:
  generate-sbom:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci

      - name: Generate SBOMs
        run: node scripts/generate-sbom.mjs

      - name: Validate CycloneDX schemas
        run: |
          npx ajv-cli validate \
            -s https://cyclonedx.org/schema/bom-1.6.schema.json \
            -d docs/sbom/cyclonedx-runtime.json \
            --spec=draft2020 \
            -c ajv-formats 2>&1 | tee /tmp/cdx-runtime-validation.txt || true

          npx ajv-cli validate \
            -s https://cyclonedx.org/schema/bom-1.6.schema.json \
            -d docs/sbom/cyclonedx-dev.json \
            --spec=draft2020 \
            -c ajv-formats 2>&1 | tee /tmp/cdx-dev-validation.txt || true

      - name: Validate SPDX schemas
        run: |
          npx ajv-cli validate \
            -s https://raw.githubusercontent.com/spdx/spdx-spec/development/v2.3/schemas/spdx-schema.json \
            -d docs/sbom/spdx-runtime.json \
            --spec=draft2020 \
            -c ajv-formats 2>&1 | tee /tmp/spdx-runtime-validation.txt || true

          npx ajv-cli validate \
            -s https://raw.githubusercontent.com/spdx/spdx-spec/development/v2.3/schemas/spdx-schema.json \
            -d docs/sbom/spdx-dev.json \
            --spec=draft2020 \
            -c ajv-formats 2>&1 | tee /tmp/spdx-dev-validation.txt || true

      - name: Collect validation results
        id: validation
        run: |
          CDX_RT=$(grep -c "valid" /tmp/cdx-runtime-validation.txt && echo "PASS" || echo "FAIL")
          CDX_DEV=$(grep -c "valid" /tmp/cdx-dev-validation.txt && echo "PASS" || echo "FAIL")
          SPDX_RT=$(grep -c "valid" /tmp/spdx-runtime-validation.txt && echo "PASS" || echo "FAIL")
          SPDX_DEV=$(grep -c "valid" /tmp/spdx-dev-validation.txt && echo "PASS" || echo "FAIL")
          echo "cdx_runtime=$CDX_RT" >> "$GITHUB_OUTPUT"
          echo "cdx_dev=$CDX_DEV" >> "$GITHUB_OUTPUT"
          echo "spdx_runtime=$SPDX_RT" >> "$GITHUB_OUTPUT"
          echo "spdx_dev=$SPDX_DEV" >> "$GITHUB_OUTPUT"

      - name: Check for changes
        id: diff
        run: |
          git diff --name-only docs/sbom/ > /tmp/changed_files.txt || true
          git diff --stat docs/sbom/ > /tmp/diff_stat.txt || true
          if [ -s /tmp/changed_files.txt ]; then
            echo "has_changes=true" >> "$GITHUB_OUTPUT"
          else
            # Also check for untracked new files
            git ls-files --others --exclude-standard docs/sbom/ > /tmp/new_files.txt || true
            if [ -s /tmp/new_files.txt ]; then
              echo "has_changes=true" >> "$GITHUB_OUTPUT"
            else
              echo "has_changes=false" >> "$GITHUB_OUTPUT"
            fi
          fi

      - name: Create PR
        if: steps.diff.outputs.has_changes == 'true'
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          DATE=$(date +%Y-%m-%d)
          BRANCH="sbom/update-${DATE}"

          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

          git checkout -b "$BRANCH"
          git add docs/sbom/
          git commit -m "chore: update SBOM inventory (${DATE})"
          git push origin "$BRANCH"

          RUNTIME_COUNT=$(node -e "
            import {readFileSync} from 'node:fs';
            const d = JSON.parse(readFileSync('docs/sbom/cyclonedx-runtime.json','utf8'));
            console.log(d.components.length);
          ")
          DEV_COUNT=$(node -e "
            import {readFileSync} from 'node:fs';
            const d = JSON.parse(readFileSync('docs/sbom/cyclonedx-dev.json','utf8'));
            console.log(d.components.length);
          ")

          gh pr create \
            --title "chore: update SBOM inventory" \
            --body "$(cat <<'PREOF'
          ## SBOM Update

          ### Summary
          Automated SBOM regeneration triggered by changes to dependency-relevant files.

          ### Validation Results
          - CycloneDX 1.6 runtime: ${{ steps.validation.outputs.cdx_runtime }}
          - CycloneDX 1.6 dev: ${{ steps.validation.outputs.cdx_dev }}
          - SPDX 2.3 runtime: ${{ steps.validation.outputs.spdx_runtime }}
          - SPDX 2.3 dev: ${{ steps.validation.outputs.spdx_dev }}

          ### Generated Files
          - docs/sbom/SBOM.md - Human-readable summary
          - docs/sbom/cyclonedx-runtime.json - CycloneDX runtime
          - docs/sbom/cyclonedx-dev.json - CycloneDX dev
          - docs/sbom/spdx-runtime.json - SPDX JSON runtime
          - docs/sbom/spdx-dev.json - SPDX JSON dev
          - docs/sbom/spdx-runtime.spdx - SPDX tag-value runtime
          - docs/sbom/spdx-dev.spdx - SPDX tag-value dev
          PREOF
          )"

      - name: Skip - no changes
        if: steps.diff.outputs.has_changes != 'true'
        run: echo "No SBOM changes detected - skipping PR."
```

- [ ] **Step 2: Validate YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/generate-sbom.yml'))"`
Expected: No error (valid YAML)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/generate-sbom.yml
git commit -m "ci: add GitHub Action to auto-generate and PR SBOM updates"
```

---

### Task 7: End-to-End Validation

**Files:**

- Modify: `docs/sbom/*` (verify content)

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass (existing + new SBOM tests)

- [ ] **Step 2: Regenerate SBOMs and inspect output**

Run: `node scripts/generate-sbom.mjs`
Expected: Clean run, all 7 files regenerated

- [ ] **Step 3: Spot-check CycloneDX runtime output**

Run: `node --input-type=module -e "import {readFileSync} from 'node:fs'; const d=JSON.parse(readFileSync('docs/sbom/cyclonedx-runtime.json','utf8')); console.log('Components:', d.components.length); d.components.forEach(c => console.log(' ', c.name, c.version))"`

Expected output (approximately):

```
Components: ~20
  cveInterface 1.0.25
  cveClientlib 1.0.25
  schemaToForm 1.0.10
  autoCompleter 1.0.12
  encrypt-storage 1.1.15
  cveInterface (css) 2.0.12
  jquery 3.5.1
  popper.js 1.14.7
  bootstrap 4.3.1
  bootstrap 4.3.1
  bootstrap-table 1.19.1
  bootstrap-table 1.19.1
  sweetalert2 11.26.24
  ace-editor 1.4.12
  (+ schema/data files)
```

- [ ] **Step 4: Spot-check SPDX tag-value output**

Run: `head -25 docs/sbom/spdx-runtime.spdx`
Expected: Valid SPDX tag-value header and first package entry

- [ ] **Step 5: Spot-check SBOM.md**

Run: `head -40 docs/sbom/SBOM.md`
Expected: Clean markdown with project header and runtime components table

- [ ] **Step 6: Final commit with any adjustments**

```bash
git add docs/sbom/
git commit -m "chore(sbom): regenerate SBOM files after validation"
```
