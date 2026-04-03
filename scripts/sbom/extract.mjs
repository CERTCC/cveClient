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
  const jqueryMatch = url.match(/jquery[/-](\d+(?:\.\d+)*)/);
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
