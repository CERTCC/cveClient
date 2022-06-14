# cveClient
A web-based client interface and a client library to cve-services 2.x to provide CVE JSON (5.x) vulnerability management for CVE Numbering Authorities (CNAs) and Roots.


# Introduction
A JavaScript library and simple HTML interface for CVE services that is like RedHat's [cvelib](https://github.com/RedHatProductSecurity/cvelib) and [Vulnogram](https://github.com/Vulnogram/Vulnogram).  Provides capabilities to interface with [cve-services](https://github.com/CVEProject/cve-services) with a JavaScript client and simple HTML UI. You can just serve the index.html file from any static content area of your webserver (Apache2, NGINX, thttpd, lighttpd, Caddy).

A JavaScript encryption toolkit is also served from [encrypt-storage.js](./encrypt-storage.js) file. This is a simple asymmetric encryption to protect your API Key while in `localStorage` (if <u>*Keep me logged in*</u> checkbox is enabled) or `sessionStorage` with PKI stored in native `indexedDB`. This provides some limited protection of your API keys.  Currently cve-services expects API key for every transaction, there is no middleware providing session capability or related CSRF protection.

Demo of the UI and client library can be accessed at [https://certcc.github.io/cveClient/](https://certcc.github.io/cveClient/).  Currently the allowed servers (cve-services servers) are limited with Content Security Policy headers to cve-services 2.x  production site, testing site and a localhost instance.

Dependency libraries for HTML UI only.
* [jQuery - 3.5.1](https://jquery.com/)
* [Bootstrap - 4.3.1](https://getbootstrap.com/)
* [Popper - 1.14.7](https://popper.js.org/)
* [SweetAlert2 - 2.11](https://sweetalert2.github.io/)
* [Bootstrap-Table - 1.19.1](https://bootstrap-table.com/)
* [Ace Editor - 1.2.4](https://ace.c9.io/)

Except for Ace Editor and SweetAlert2 library all the dependencies are served from CDN sources with sha-284 [Subsource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) checks. There is some issue with the nightly builds, so these two libraries are served from local.  Please ensure you understand their license agreements as well.

# Roll out your own using cveClientlib
If you plan to rollour your own UI, this JavaScript library is helpful.  Also note that there is another client library with similar capabilities built with ECMAScrip6 requirement at [https://github.com/xdrr/cve.js](https://github.com/xdrr/cve.js).

You can use the [cveClientlib.js](./cveClientlib.js) to do all the tasks being performed by the current UI. The file is called cveClientlib.js as Safari browsers have trouble with filename and a Class name being the same.

# Risks of using API keys in browser for CVE-Services

See the [RISKS.md](./RISKS.md) that captures some of the inherent risks of using API keys to access an API service. If you decide to use these web base clients to access `cve-services`, please be aware of these risks.


# Installation on your own webserver

See the [INSTALL.md](./INSTALL.md), if you would like to run a private version of the cveClient in your own webserver.