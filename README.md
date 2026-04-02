# cveClient

A browser-based CVE management client for [CVE Services 2.x](https://github.com/CVEProject/cve-services) API, built for CVE Numbering Authorities (CNAs) and Roots. Manage CVE records using CVE JSON 5.x directly from your browser — no software to install, no data collected, no backend required.

**[Live Demo](https://certcc.github.io/cveClient/)** | **[CERT/CC Demo](https://democert.org/cveClient)**

> **Privacy:** This application runs entirely in your browser. It does not store any data on a server, does not track usage, and does not phone home. Your API key is encrypted locally using RSA-OAEP 4096-bit encryption before being stored in browser storage.

## Compatibility

|                      | Version                                                                                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **CVE Services API** | 2.x ([API docs](https://cveawg.mitre.org/api-docs/), [local OpenAPI spec](./api-docs/openapi.json))                        |
| **CVE JSON Schema**  | 5.x ([schema docs](https://github.com/CVEProject/cve-schema/blob/main/schema/docs/versions.md), [local schema](./schema/)) |

### Supported Environments

| Environment | URL                                 | Use Case                    |
| ----------- | ----------------------------------- | --------------------------- |
| Production  | `https://cveawg.mitre.org/api`      | Live CVE record management  |
| Test        | `https://cveawg-test.mitre.org/api` | Testing and training        |
| Local       | `http://127.0.0.1:3000/api`         | Local CVE Services instance |

Select your environment from the dropdown at login.

## Features

- **CVE Record Management** — Create, update, reject, and reserve CVE IDs
- **Form-Based Editor** — Tabs for Minimal (required fields only), All Fields (full schema), JSON (direct editing with Ace editor), and ADP views
- **Guided CVE Chatbot** — Step-by-step wizard that walks you through building a CVE record field by field, with CWE autocomplete
- **AI Review** — Review your CVE record with ChatGPT, Claude, or Gemini before publication. Shows the full prompt for transparency, then copies to clipboard and opens your chosen provider.
- **User Management** — Create, update, and list users within your CNA organization (admin role required)
- **Organization Info** — View org details and remaining CVE ID quota
- **Offline Mode** — Click "Skip" at login to create and edit mock CVE records without connecting to CVE Services, useful for drafting or training
- **Encrypted Credentials** — API keys are encrypted with RSA-OAEP 4096-bit keys before storage. See [RISKS.md](./RISKS.md) for a full discussion of browser API key security.

## Getting Started

### Use the Public Demo

Visit [https://certcc.github.io/cveClient/](https://certcc.github.io/cveClient/) and log in with your CNA short name, username, and API key. No installation required. The demo connects directly to CVE Services and does not store any data.

### Run Your Own Instance

cveClient is a static web application — just serve the files from any web server:

```bash
git clone https://github.com/CERTCC/cveClient.git
cd cveClient

# Any of these will work:
python3 -m http.server 8080
npx serve .
php -S localhost:8080
```

Open `http://localhost:8080` and log in. For production deployment with Content-Security-Policy headers, Apache/Nginx configuration examples, and more, see [INSTALL.md](./INSTALL.md).

## API Key Security

Using API keys in a browser carries inherent risks. See [RISKS.md](./RISKS.md) for:

- Why browser-based API key usage is a known risk for CNAs
- Precautions your organization should take (browser hardening, user audits, key rotation)
- How cveClient mitigates risk with RSA-OAEP encryption
- Content-Security-Policy recommendations for self-hosted deployments

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for the full version history.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for architecture details, local development setup, Node.js library usage, running tests, and dependency information.

## License

See [LICENSE](./LICENSE) for license information.

---

<p align="center">
<img src="https://img.shields.io/github/license/CERTCC/cveClient" alt="License" />
<img src="https://img.shields.io/github/v/release/CERTCC/cveClient" alt="Release" />
<img src="https://img.shields.io/github/issues/CERTCC/cveClient" alt="Issues" />
<img src="https://img.shields.io/github/last-commit/CERTCC/cveClient" alt="Last Commit" />
</p>
