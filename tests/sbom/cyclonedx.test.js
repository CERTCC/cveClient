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
