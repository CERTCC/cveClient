# Risk of Using API Keys in Browser for CVE Services

The [CVE Services](https://github.com/CVEProject/cve-services) API interface is protected by an API key to perform CNA functions to manage CVE records. An API key assigned to a user with the Admin role is also able to manage users under their organization.

Any browser-based client to CVE Services requires unencrypted access to the API key to perform each transaction with the CVE Services endpoints. Browser-based clients such as Vulnogram and cveClient depend on the browser to protect these API keys. API keys, unlike passwords, are rarely changed and could be stolen from the browser where the API key was entered. This is a known risk in using browser-based clients when accessing CVE program capabilities as a CNA. Although there are several technologies such as [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers) and [Storage APIs](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#storage-apis), the browser needs to repeatedly retrieve and use the API keys making this data available in its raw form to support CNA activities.

If a CNA decides to use these clients, they should be aware of the risks that the API key could be stolen from the browser. The CNA should take necessary precautions as appropriate for their organization to protect the API keys.

## Precautions

If a CNA chooses to use this or other web-based interfaces to access CVE Services, here are some precautionary measures the CNA may adopt to reduce risk of abuse of their CVE Services credentials:

- **Secure the browser.**
  Ensure the organization's computer and browser software are well-managed and kept up to date with security updates. Limit browser plugins to ensure only secure and audited plugins are installed. Use automatic updates and timely restart of the browser to reduce long-running unpatched software.

- **Audit and manage users.**
  Audit and verify the users who belong to your organization. Timely disable users who have left the organization or no longer need the role to manage CVE records.

- **Regenerate your API keys periodically.**
  The CVE program allows for regeneration of API keys for users in an organization. This is recommended to match the organization's password and API credentials lifecycle management policy. This also allows for timely auditing and detection of rogue users and stray accounts.

- **Protect your web server, if you run your own.**
  The software can be accessed at [https://certcc.github.io/cveClient/](https://certcc.github.io/cveClient/) — a static website hosted on GitHub that does not collect any information from your browser. However, if you wish to run a cloned or forked version from GitHub, ensure your publishing web server is protected from Cross-Site Scripting (XSS) attacks using [Content-Security-Policy headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy). See [INSTALL.md](./INSTALL.md) for recommended CSP configuration.

## How cveClient Mitigates Risk

cveClient includes an encryption layer ([`encrypt-storage.js`](./encrypt-storage.js)) that provides RSA-OAEP 4096-bit asymmetric encryption of API keys before storing them in `localStorage` or `sessionStorage`. The encryption keys are persisted in the browser's native `indexedDB`. While this does not eliminate all risk (the key must be decrypted for each API call), it provides protection against casual inspection of browser storage.
