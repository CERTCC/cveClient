# cveClient

A browser-based CVE management client and JavaScript library for [CVE Services 2.x](https://github.com/CVEProject/cve-services) API. Provides CVE JSON 5.x vulnerability management for CVE Numbering Authorities (CNAs) and Roots.

**[Live Demo](https://certcc.github.io/cveClient/)** | **[CERT/CC Demo](https://democert.org/cveClient)**


## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Using cveClientlib in Node.js](#using-cveclientlib-in-nodejs)
- [Running Tests](#running-tests)
- [Installation on Your Own Server](#installation-on-your-own-server)
- [API Key Security](#api-key-security)
- [Dependencies](#dependencies)
- [Changelog](#changelog)
- [License](#license)

## Features

- **CVE Record Management** — Create, update, reject, and reserve CVE IDs through CVE Services 2.x API
- **CVE JSON 5.x Editor** — Form-based editor with tabs for Minimal, All Fields, JSON, and ADP views, dynamically generated from the CVE JSON schema
- **Guided CVE Chatbot** — Step-by-step wizard that walks you through creating a CVE record field by field
- **AI Review** — Review your CVE record with ChatGPT, Claude, or Gemini before publication (copies prompt to clipboard, opens your chosen provider)
- **User Management** — Create, update, and list users within your CNA organization (admin role)
- **Organization Info** — View org details and CVE ID quota
- **Encrypted API Key Storage** — RSA-OAEP 4096-bit encryption for API keys in browser storage using Web Crypto API and IndexedDB
- **No Backend Required** — Pure static web application, serve from any web server
- **No Data Collection** — This application does not store any data or track usage

## Quick Start

cveClient is a static web application with no build step. Serve the files from any web server:

```bash
# Clone the repository
git clone https://github.com/CERTCC/cveClient.git
cd cveClient

# Serve with any local web server
python3 -m http.server 8080
# or
npx serve .
# or
php -S localhost:8080
```

Then open `http://localhost:8080` in your browser. Enter your CNA short name, username, and API key to log in.

You can also use the public demo at [https://certcc.github.io/cveClient/](https://certcc.github.io/cveClient/) — it connects directly to CVE Services and does not store any data.

## Architecture

cveClient is a pure client-side JavaScript application with no backend, no build system, and no transpilation.

### Core Files

| File                                         | Description                                                                                                                                                                                        |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`cveClientlib.js`](./cveClientlib.js)       | Reusable API client library. Class `cveClient` wraps the CVE Services REST API with `rfetch()` (Fetch API wrapper that injects API key auth). Methods for CVE CRUD, user management, and org info. |
| [`cveInterface.js`](./cveInterface.js)       | Main UI logic (~2000 lines). Handles login/logout, CVE operations, user management, AI review integration, and form-to-JSON conversion.                                                            |
| [`schemaToForm.js`](./schemaToForm.js)       | Dynamically generates HTML forms from the CVE JSON 5.x schema. Bidirectional: `FormToObject()` extracts JSON from form fields, `ObjectToForm()` populates forms from JSON.                         |
| [`autoCompleter.js`](./autoCompleter.js)     | Autocomplete/suggestion UI for input fields with dynamic URL fetching (used for CWE lookup).                                                                                                       |
| [`encrypt-storage.js`](./encrypt-storage.js) | RSA-OAEP 4096-bit encryption for API keys in browser storage using Web Crypto API + IndexedDB for key persistence.                                                                                 |
| [`index.html`](./index.html)                 | Single-page app with Bootstrap modals for all operations.                                                                                                                                          |

### How It Works

1. User logs in with CNA short name, username, and API key
2. API key is encrypted and stored in browser storage (localStorage or sessionStorage)
3. All API calls go directly from the browser to CVE Services — no proxy or middleware
4. The CVE JSON 5.x schema is fetched at runtime from the [CVE Schema Project](https://github.com/CVEProject/cve-schema) to dynamically generate the "All Fields" form
5. Form data is converted to/from CVE JSON using `data-field` attribute mappings

## Using cveClientlib in Node.js

The `cveClientlib.js` file includes conditional exports for Node.js environments. You can use it directly in Node.js scripts (`fetch` is available natively in Node 18+):

```javascript
const cveClient = require("./cveClientlib.js");

const client = new cveClient(
  "your_org_short_name",
  "your_username",
  "your_api_key",
  "https://cveawg.mitre.org/api",
);

// Get CVE details
client.getcvedetail("CVE-2024-1234").then(function (cve) {
  console.log(JSON.stringify(cve, null, 2));
});

// Reserve a CVE ID
client.reservecve(1).then(function (result) {
  console.log("Reserved:", result);
});

// Get org quota
client.getquota().then(function (quota) {
  console.log("Quota:", quota);
});
```

For older Node.js versions without native `fetch`, use [node-fetch](https://github.com/node-fetch/node-fetch):

```javascript
const fetch = require("node-fetch");
globalThis.fetch = fetch;
const cveClient = require("./cveClientlib.js");
```

## Running Tests

Tests use [Vitest](https://vitest.dev/) with jsdom. Requires Node.js 22+.

```bash
npm ci
npm test
```

Test suites:

- **Pure function tests** (24 tests) — `get_deep`, `set_deep`, `simpleCopy`, `checkurl`, `check_json`, `queryParser`
- **Security regression tests** (13 tests) — prototype pollution protection, XSS prevention via `safeHTML` and `cleanHTML`
- **API client tests** (14 tests) — URL construction, auth headers, CVE/ADP operations

## Installation on Your Own Server

See [INSTALL.md](./INSTALL.md) for detailed instructions on deploying cveClient to your own web server (Apache, Nginx, IIS, or any static file server).

The short version:

```bash
git clone https://github.com/CERTCC/cveClient.git /var/www/html/cveClient
```

Then visit `/cveClient/` on your web server. If you use Content-Security-Policy headers, see INSTALL.md for the recommended CSP configuration.

## API Key Security

Using API keys in a browser carries inherent risks. See [RISKS.md](./RISKS.md) for a detailed discussion of:

- Why browser-based API key usage is a known risk
- Precautions CNAs should take (browser security, user audits, key rotation)
- How cveClient mitigates risk with RSA-OAEP encryption of stored keys
- Content-Security-Policy recommendations

## Dependencies

All dependencies are for the HTML UI only. The `cveClientlib.js` library has zero dependencies.

| Library                                         | Version | Source | Integrity   |
| ----------------------------------------------- | ------- | ------ | ----------- |
| [jQuery](https://jquery.com/)                   | 3.5.1   | CDN    | SHA-384 SRI |
| [Bootstrap](https://getbootstrap.com/)          | 4.3.1   | CDN    | SHA-384 SRI |
| [Popper.js](https://popper.js.org/)             | 1.14.7  | CDN    | SHA-384 SRI |
| [Bootstrap-Table](https://bootstrap-table.com/) | 1.19.1  | CDN    | SHA-384 SRI |
| [SweetAlert2](https://sweetalert2.github.io/)   | 11.x    | Local  | —           |
| [Ace Editor](https://ace.c9.io/)                | 1.2.4   | Local  | —           |

CDN dependencies use [Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) (SRI) checks. SweetAlert2 and Ace Editor are served from local copies due to build issues with their CDN versions — please review their respective license agreements.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for the full version history.

## License

See [LICENSE](./LICENSE) for license information.

---

<p align="center">
<img src="https://img.shields.io/github/license/CERTCC/cveClient" alt="License" />
<img src="https://img.shields.io/github/v/release/CERTCC/cveClient" alt="Release" />
<img src="https://img.shields.io/github/issues/CERTCC/cveClient" alt="Issues" />
<img src="https://img.shields.io/github/last-commit/CERTCC/cveClient" alt="Last Commit" />
</p>
