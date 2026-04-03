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
