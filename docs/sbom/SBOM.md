# Software Bill of Materials - cveclient

**Version:** 1.0.25 | **License:** MIT | **Generated:** 2026-04-07

## Runtime Components

### Core Application Files

| Component | File | Version | License |
|-----------|------|---------|---------|
| cveInterface | cveInterface.js | 1.0.25 | MIT |
| cveClientlib | cveClientlib.js | 1.0.25 | MIT |
| schemaToForm | schemaToForm.js | 1.0.10 | MIT |
| autoCompleter | autoCompleter.js | 1.0.12 | MIT |
| encrypt-storage | encrypt-storage.js | 1.1.15 | MIT |
| cveInterface | cveInterface.css | 2.0.12 | MIT |
| bootstrap |  | 4.3.1 |  |
| bootstrap-table |  | 1.19.1 |  |

### CDN Dependencies

| Component | Version | URL | SRI Hash | License |
|-----------|---------|-----|----------|---------|
| jquery | 3.5.1 | https://code.jquery.com/jquery-3.5.1.min.js | sha384-ZvpUoO/+PpLXR1lu4jmpXWu80pZlYUAfxl5NsBMWOEPSjUn/6Z/hRTt8+pR6L4N2 |  |
| popper.js | 1.14.7 | https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js | sha384-UO2eT0CpHqdSJQ6hJty5KVphtPhzWj9WO1clHTMGa3JDZwrnQq4sF86dIHNDz0W1 |  |
| bootstrap | 4.3.1 | https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js | sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM |  |
| bootstrap-table | 1.19.1 | https://unpkg.com/bootstrap-table@1.19.1/dist/bootstrap-table.min.js | sha384-c6BpBD7+QRK09NF7WgSPQpBF4z1UdPVJEFAvOnQoNyqtMMuJW/hF+iw3pHlKvmxF |  |

### Vendored Dependencies

| Component | Version | License |
|-----------|---------|---------|
| sweetalert2 | 11.26.24 | MIT |
| ace-editor | 1.4.12 | Apache-2.0 |

### Schema/Data Files

| File | Path |
|------|------|
| CVE_Record_Format_bundled.json | schema/CVE_Record_Format_bundled.json |
| CVE_Record_Format_bundled_adpContainer.json | schema/CVE_Record_Format_bundled_adpContainer.json |
| CVE_Record_Format_bundled_cnaPublishedContainer.json | schema/CVE_Record_Format_bundled_cnaPublishedContainer.json |
| CVE_Record_Format_bundled_cnaRejectedContainer.json | schema/CVE_Record_Format_bundled_cnaRejectedContainer.json |
| adp-tags.json | schema/adp-tags.json |
| cna-tags.json | schema/cna-tags.json |
| reference-tags.json | schema/reference-tags.json |

## Dev/CI Dependencies

### npm Dev Dependencies (Direct)

| Package | Version | License |
|---------|---------|---------|
| jsdom | 26.1.0 | MIT |
| vitest | 3.2.4 | MIT |

<details><summary>Transitive npm dependencies (135)</summary>

| Package | Version | License |
|---------|---------|---------|
| @asamuzakjp/css-color | 3.2.0 | MIT |
| @csstools/color-helpers | 5.1.0 | MIT-0 |
| @csstools/css-calc | 2.1.4 | MIT |
| @csstools/css-color-parser | 3.1.0 | MIT |
| @csstools/css-parser-algorithms | 3.0.5 | MIT |
| @csstools/css-tokenizer | 3.0.4 | MIT |
| @esbuild/aix-ppc64 | 0.27.4 | MIT |
| @esbuild/android-arm | 0.27.4 | MIT |
| @esbuild/android-arm64 | 0.27.4 | MIT |
| @esbuild/android-x64 | 0.27.4 | MIT |
| @esbuild/darwin-arm64 | 0.27.4 | MIT |
| @esbuild/darwin-x64 | 0.27.4 | MIT |
| @esbuild/freebsd-arm64 | 0.27.4 | MIT |
| @esbuild/freebsd-x64 | 0.27.4 | MIT |
| @esbuild/linux-arm | 0.27.4 | MIT |
| @esbuild/linux-arm64 | 0.27.4 | MIT |
| @esbuild/linux-ia32 | 0.27.4 | MIT |
| @esbuild/linux-loong64 | 0.27.4 | MIT |
| @esbuild/linux-mips64el | 0.27.4 | MIT |
| @esbuild/linux-ppc64 | 0.27.4 | MIT |
| @esbuild/linux-riscv64 | 0.27.4 | MIT |
| @esbuild/linux-s390x | 0.27.4 | MIT |
| @esbuild/linux-x64 | 0.27.4 | MIT |
| @esbuild/netbsd-arm64 | 0.27.4 | MIT |
| @esbuild/netbsd-x64 | 0.27.4 | MIT |
| @esbuild/openbsd-arm64 | 0.27.4 | MIT |
| @esbuild/openbsd-x64 | 0.27.4 | MIT |
| @esbuild/openharmony-arm64 | 0.27.4 | MIT |
| @esbuild/sunos-x64 | 0.27.4 | MIT |
| @esbuild/win32-arm64 | 0.27.4 | MIT |
| @esbuild/win32-ia32 | 0.27.4 | MIT |
| @esbuild/win32-x64 | 0.27.4 | MIT |
| @jridgewell/sourcemap-codec | 1.5.5 | MIT |
| @rollup/rollup-android-arm-eabi | 4.60.1 | MIT |
| @rollup/rollup-android-arm64 | 4.60.1 | MIT |
| @rollup/rollup-darwin-arm64 | 4.60.1 | MIT |
| @rollup/rollup-darwin-x64 | 4.60.1 | MIT |
| @rollup/rollup-freebsd-arm64 | 4.60.1 | MIT |
| @rollup/rollup-freebsd-x64 | 4.60.1 | MIT |
| @rollup/rollup-linux-arm-gnueabihf | 4.60.1 | MIT |
| @rollup/rollup-linux-arm-musleabihf | 4.60.1 | MIT |
| @rollup/rollup-linux-arm64-gnu | 4.60.1 | MIT |
| @rollup/rollup-linux-arm64-musl | 4.60.1 | MIT |
| @rollup/rollup-linux-loong64-gnu | 4.60.1 | MIT |
| @rollup/rollup-linux-loong64-musl | 4.60.1 | MIT |
| @rollup/rollup-linux-ppc64-gnu | 4.60.1 | MIT |
| @rollup/rollup-linux-ppc64-musl | 4.60.1 | MIT |
| @rollup/rollup-linux-riscv64-gnu | 4.60.1 | MIT |
| @rollup/rollup-linux-riscv64-musl | 4.60.1 | MIT |
| @rollup/rollup-linux-s390x-gnu | 4.60.1 | MIT |
| @rollup/rollup-linux-x64-gnu | 4.60.1 | MIT |
| @rollup/rollup-linux-x64-musl | 4.60.1 | MIT |
| @rollup/rollup-openbsd-x64 | 4.60.1 | MIT |
| @rollup/rollup-openharmony-arm64 | 4.60.1 | MIT |
| @rollup/rollup-win32-arm64-msvc | 4.60.1 | MIT |
| @rollup/rollup-win32-ia32-msvc | 4.60.1 | MIT |
| @rollup/rollup-win32-x64-gnu | 4.60.1 | MIT |
| @rollup/rollup-win32-x64-msvc | 4.60.1 | MIT |
| @types/chai | 5.2.3 | MIT |
| @types/deep-eql | 4.0.2 | MIT |
| @types/estree | 1.0.8 | MIT |
| @vitest/expect | 3.2.4 | MIT |
| @vitest/mocker | 3.2.4 | MIT |
| @vitest/pretty-format | 3.2.4 | MIT |
| @vitest/runner | 3.2.4 | MIT |
| @vitest/snapshot | 3.2.4 | MIT |
| @vitest/spy | 3.2.4 | MIT |
| @vitest/utils | 3.2.4 | MIT |
| agent-base | 7.1.4 | MIT |
| assertion-error | 2.0.1 | MIT |
| cac | 6.7.14 | MIT |
| chai | 5.3.3 | MIT |
| check-error | 2.1.3 | MIT |
| cssstyle | 4.6.0 | MIT |
| data-urls | 5.0.0 | MIT |
| debug | 4.4.3 | MIT |
| decimal.js | 10.6.0 | MIT |
| deep-eql | 5.0.2 | MIT |
| entities | 6.0.1 | BSD-2-Clause |
| es-module-lexer | 1.7.0 | MIT |
| esbuild | 0.27.4 | MIT |
| estree-walker | 3.0.3 | MIT |
| expect-type | 1.3.0 | Apache-2.0 |
| fdir | 6.5.0 | MIT |
| fsevents | 2.3.3 | MIT |
| html-encoding-sniffer | 4.0.0 | MIT |
| http-proxy-agent | 7.0.2 | MIT |
| https-proxy-agent | 7.0.6 | MIT |
| iconv-lite | 0.6.3 | MIT |
| is-potential-custom-element-name | 1.0.1 | MIT |
| js-tokens | 9.0.1 | MIT |
| loupe | 3.2.1 | MIT |
| lru-cache | 10.4.3 | ISC |
| magic-string | 0.30.21 | MIT |
| ms | 2.1.3 | MIT |
| nanoid | 3.3.11 | MIT |
| nwsapi | 2.2.23 | MIT |
| parse5 | 7.3.0 | MIT |
| pathe | 2.0.3 | MIT |
| pathval | 2.0.1 | MIT |
| picocolors | 1.1.1 | ISC |
| picomatch | 4.0.4 | MIT |
| postcss | 8.5.8 | MIT |
| punycode | 2.3.1 | MIT |
| rollup | 4.60.1 | MIT |
| rrweb-cssom | 0.8.0 | MIT |
| safer-buffer | 2.1.2 | MIT |
| saxes | 6.0.0 | ISC |
| siginfo | 2.0.0 | ISC |
| source-map-js | 1.2.1 | BSD-3-Clause |
| stackback | 0.0.2 | MIT |
| std-env | 3.10.0 | MIT |
| strip-literal | 3.1.0 | MIT |
| symbol-tree | 3.2.4 | MIT |
| tinybench | 2.9.0 | MIT |
| tinyexec | 0.3.2 | MIT |
| tinyglobby | 0.2.15 | MIT |
| tinypool | 1.1.1 | MIT |
| tinyrainbow | 2.0.0 | MIT |
| tinyspy | 4.0.4 | MIT |
| tldts | 6.1.86 | MIT |
| tldts-core | 6.1.86 | MIT |
| tough-cookie | 5.1.2 | BSD-3-Clause |
| tr46 | 5.1.1 | MIT |
| vite | 7.3.2 | MIT |
| vite-node | 3.2.4 | MIT |
| w3c-xmlserializer | 5.0.0 | MIT |
| webidl-conversions | 7.0.0 | BSD-2-Clause |
| whatwg-encoding | 3.1.1 | MIT |
| whatwg-mimetype | 4.0.0 | MIT |
| whatwg-url | 14.2.0 | MIT |
| why-is-node-running | 2.3.0 | MIT |
| ws | 8.20.0 | MIT |
| xml-name-validator | 5.0.0 | Apache-2.0 |
| xmlchars | 2.2.0 | MIT |

</details>

### CI/CD Toolchain (GitHub Actions)

| Action | Version |
|--------|---------|
| actions/checkout | v4 |
| actions/setup-node | v4 |
| actions/checkout | v6 |
| actions/setup-node | v6 |

## Machine-Readable Formats

| File | Format |
|------|--------|
| [cyclonedx-runtime.json](cyclonedx-runtime.json) | CycloneDX 1.6 JSON |
| [cyclonedx-dev.json](cyclonedx-dev.json) | CycloneDX 1.6 JSON |
| [spdx-runtime.json](spdx-runtime.json) | SPDX 2.3 JSON |
| [spdx-dev.json](spdx-dev.json) | SPDX 2.3 JSON |
| [spdx-runtime.spdx](spdx-runtime.spdx) | SPDX 2.3 Tag-Value |
| [spdx-dev.spdx](spdx-dev.spdx) | SPDX 2.3 Tag-Value |
