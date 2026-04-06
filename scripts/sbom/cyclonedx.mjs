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
