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
