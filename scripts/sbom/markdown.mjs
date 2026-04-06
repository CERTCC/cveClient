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
