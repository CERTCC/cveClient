import { describe, it, expect } from "vitest";
import {
  extractCdnDeps,
  extractSourceVersions,
  extractVendoredVersion,
  extractDevDeps,
} from "../../scripts/sbom/extract.mjs";

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
