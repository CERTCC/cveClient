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
