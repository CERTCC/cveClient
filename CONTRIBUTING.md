# Contributing to cveClient

This guide covers the technical details for developers contributing to cveClient.

## Architecture

cveClient is a pure client-side JavaScript application with no backend, no build system, and no transpilation.

### Core Files

| File                                         | Description                                                                                                                                                                                                           |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`cveClientlib.js`](./cveClientlib.js)       | Reusable API client library. Class `cveClient` wraps the CVE Services REST API with `rfetch()` (Fetch API wrapper that injects API key auth). Methods for CVE CRUD, user management, and org info.                    |
| [`cveInterface.js`](./cveInterface.js)       | Main UI logic (~2000 lines). Handles login/logout, CVE operations, user management, and form-to-JSON conversion.                                                                                                      |
| [`schemaToForm.js`](./schemaToForm.js)       | Dynamically generates HTML forms from the CVE JSON 5.x schema. Bidirectional: `FormToObject()` extracts JSON from form fields, `ObjectToForm()` populates forms from JSON. Fields linked via `data-field` attributes. |
| [`autoCompleter.js`](./autoCompleter.js)     | Autocomplete/suggestion UI for input fields with dynamic URL fetching (used for CWE lookup).                                                                                                                          |
| [`encrypt-storage.js`](./encrypt-storage.js) | RSA-OAEP 4096-bit encryption for API keys in browser storage using Web Crypto API + IndexedDB for key persistence.                                                                                                    |
| [`index.html`](./index.html)                 | Single-page app with Bootstrap modals for all operations.                                                                                                                                                             |

### How It Works

1. User logs in with CNA short name, username, and API key
2. API key is encrypted and stored in browser storage (localStorage or sessionStorage)
3. All API calls go directly from the browser to CVE Services — no proxy or middleware
4. The CVE JSON 5.x schema is fetched at runtime from the [CVE Schema Project](https://github.com/CVEProject/cve-schema) to dynamically generate the "All Fields" form
5. Form data is converted to/from CVE JSON using `data-field` attribute mappings

### Key Patterns

- Heavy jQuery DOM manipulation with Bootstrap modals
- Promise-based async/await for all API calls
- State: global `client` object (session), localStorage/sessionStorage (credentials), IndexedDB (encryption keys)
- Dynamic HTML generation for array fields (versions, descriptions, references) using `duplicate()`/`unduplicate()`
- Version branches named `version-X.X.X`, PRs merged to `main`

## Local Development

There is no build step. Serve the files from any local web server:

```bash
python3 -m http.server 8080
# or
npx serve .
# or
php -S localhost:8080
```

Then open `http://localhost:8080` in your browser.

**Note:** Opening `index.html` directly from the filesystem (`file://`) will not work — browsers block network requests from local files.

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
