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
