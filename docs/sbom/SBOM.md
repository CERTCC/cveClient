# Software Bill of Materials - cveclient

**Version:** 1.0.25 | **License:** MIT | **Generated:** 2026-08-02

## Runtime Components

### Core Application Files

| Component | File | Version | License |
|-----------|------|---------|---------|
| cveInterface | cveInterface.js | 1.0.25 | MIT |
| cveClientlib | cveClientlib.js | 1.0.26 | MIT |
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
| vitest | 4.1.0 | MIT |

<details><summary>Transitive npm dependencies (112)</summary>

| Package | Version | License |
|---------|---------|---------|
| @asamuzakjp/css-color | 3.2.0 | MIT |
| @csstools/color-helpers | 5.1.0 | MIT-0 |
| @csstools/css-calc | 2.1.4 | MIT |
| @csstools/css-color-parser | 3.1.0 | MIT |
| @csstools/css-parser-algorithms | 3.0.5 | MIT |
| @csstools/css-tokenizer | 3.0.4 | MIT |
| @emnapi/core | 1.10.0 | MIT |
| @emnapi/runtime | 1.10.0 | MIT |
| @emnapi/wasi-threads | 1.2.1 | MIT |
| @jridgewell/sourcemap-codec | 1.5.5 | MIT |
| @napi-rs/wasm-runtime | 1.1.4 | MIT |
| @oxc-project/types | 0.133.0 | MIT |
| @rolldown/binding-android-arm64 | 1.0.3 | MIT |
| @rolldown/binding-darwin-arm64 | 1.0.3 | MIT |
| @rolldown/binding-darwin-x64 | 1.0.3 | MIT |
| @rolldown/binding-freebsd-x64 | 1.0.3 | MIT |
| @rolldown/binding-linux-arm-gnueabihf | 1.0.3 | MIT |
| @rolldown/binding-linux-arm64-gnu | 1.0.3 | MIT |
| @rolldown/binding-linux-arm64-musl | 1.0.3 | MIT |
| @rolldown/binding-linux-ppc64-gnu | 1.0.3 | MIT |
| @rolldown/binding-linux-s390x-gnu | 1.0.3 | MIT |
| @rolldown/binding-linux-x64-gnu | 1.0.3 | MIT |
| @rolldown/binding-linux-x64-musl | 1.0.3 | MIT |
| @rolldown/binding-openharmony-arm64 | 1.0.3 | MIT |
| @rolldown/binding-wasm32-wasi | 1.0.3 | MIT |
| @rolldown/binding-win32-arm64-msvc | 1.0.3 | MIT |
| @rolldown/binding-win32-x64-msvc | 1.0.3 | MIT |
| @rolldown/pluginutils | 1.0.1 | MIT |
| @standard-schema/spec | 1.1.0 | MIT |
| @tybys/wasm-util | 0.10.2 | MIT |
| @types/chai | 5.2.3 | MIT |
| @types/deep-eql | 4.0.2 | MIT |
| @types/estree | 1.0.9 | MIT |
| @vitest/expect | 4.1.0 | MIT |
| @vitest/mocker | 4.1.0 | MIT |
| @vitest/pretty-format | 4.1.0 | MIT |
| @vitest/runner | 4.1.0 | MIT |
| @vitest/snapshot | 4.1.0 | MIT |
| @vitest/spy | 4.1.0 | MIT |
| @vitest/utils | 4.1.0 | MIT |
| agent-base | 7.1.4 | MIT |
| assertion-error | 2.0.1 | MIT |
| chai | 6.2.2 | MIT |
| convert-source-map | 2.0.0 | MIT |
| cssstyle | 4.6.0 | MIT |
| data-urls | 5.0.0 | MIT |
| debug | 4.4.3 | MIT |
| decimal.js | 10.6.0 | MIT |
| detect-libc | 2.1.2 | Apache-2.0 |
| entities | 6.0.1 | BSD-2-Clause |
| es-module-lexer | 2.1.0 | MIT |
| estree-walker | 3.0.3 | MIT |
| expect-type | 1.3.0 | Apache-2.0 |
| fdir | 6.5.0 | MIT |
| fsevents | 2.3.3 | MIT |
| html-encoding-sniffer | 4.0.0 | MIT |
| http-proxy-agent | 7.0.2 | MIT |
| https-proxy-agent | 7.0.6 | MIT |
| iconv-lite | 0.6.3 | MIT |
| is-potential-custom-element-name | 1.0.1 | MIT |
| lightningcss | 1.32.0 | MPL-2.0 |
| lightningcss-android-arm64 | 1.32.0 | MPL-2.0 |
| lightningcss-darwin-arm64 | 1.32.0 | MPL-2.0 |
| lightningcss-darwin-x64 | 1.32.0 | MPL-2.0 |
| lightningcss-freebsd-x64 | 1.32.0 | MPL-2.0 |
| lightningcss-linux-arm-gnueabihf | 1.32.0 | MPL-2.0 |
| lightningcss-linux-arm64-gnu | 1.32.0 | MPL-2.0 |
| lightningcss-linux-arm64-musl | 1.32.0 | MPL-2.0 |
| lightningcss-linux-x64-gnu | 1.32.0 | MPL-2.0 |
| lightningcss-linux-x64-musl | 1.32.0 | MPL-2.0 |
| lightningcss-win32-arm64-msvc | 1.32.0 | MPL-2.0 |
| lightningcss-win32-x64-msvc | 1.32.0 | MPL-2.0 |
| lru-cache | 10.4.3 | ISC |
| magic-string | 0.30.21 | MIT |
| ms | 2.1.3 | MIT |
| nanoid | 3.3.16 | MIT |
| nwsapi | 2.2.23 | MIT |
| obug | 2.1.1 | MIT |
| parse5 | 7.3.0 | MIT |
| pathe | 2.0.3 | MIT |
| picocolors | 1.1.1 | ISC |
| picomatch | 4.0.4 | MIT |
| postcss | 8.5.25 | MIT |
| punycode | 2.3.1 | MIT |
| rolldown | 1.0.3 | MIT |
| rrweb-cssom | 0.8.0 | MIT |
| safer-buffer | 2.1.2 | MIT |
| saxes | 6.0.0 | ISC |
| siginfo | 2.0.0 | ISC |
| source-map-js | 1.2.1 | BSD-3-Clause |
| stackback | 0.0.2 | MIT |
| std-env | 4.1.0 | MIT |
| symbol-tree | 3.2.4 | MIT |
| tinybench | 2.9.0 | MIT |
| tinyexec | 1.2.4 | MIT |
| tinyglobby | 0.2.17 | MIT |
| tinyrainbow | 3.1.0 | MIT |
| tldts | 6.1.86 | MIT |
| tldts-core | 6.1.86 | MIT |
| tough-cookie | 5.1.2 | BSD-3-Clause |
| tr46 | 5.1.1 | MIT |
| tslib | 2.8.1 | 0BSD |
| vite | 8.0.16 | MIT |
| w3c-xmlserializer | 5.0.0 | MIT |
| webidl-conversions | 7.0.0 | BSD-2-Clause |
| whatwg-encoding | 3.1.1 | MIT |
| whatwg-mimetype | 4.0.0 | MIT |
| whatwg-url | 14.2.0 | MIT |
| why-is-node-running | 2.3.0 | MIT |
| ws | 8.21.1 | MIT |
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
