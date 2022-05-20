# Risk of using API keys in browser for CVE-Services


The [cve-services](https://github.com/CVEProject/cve-services)' API interface is protected by an API key to perform CNA functions to manage CVE records.  An API-key assigned to a user with Admin role (administrator) is also able manage users under their organization.  

Any browser-based client to cve-services requires unencrypted access to the API key to perform each transaction with the cve-services endpoints.  The browser-based clients such as Vulnogram and cveClient depend on the browser to protect these API keys. API key, unlike passwords, are rarely changed and could be stolen from the browser where the API key was entered.  This is a known risk in using browser-based clients when accessing CVE program capabilities as a CNA.  Although there are several technologies such as [ServiceWorkers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers) and [Storage APIs](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#storage-apis), the browser needs to repeatedly retrieve and use the API keys making this data available in its raw form to support CAN activities. 

If a CNA decides to use these clients, they should be aware of the risks that the API key could be stolen from the browser. The CNA should take necessary precautions as appropriate for their organization to protect the API keys.  

If a CNA chooses to use this or other web based interfaces to access the cve-services, here are some precautionary measures the CNA may adapt to reduce risk of abuse of their cve-services credentials. 
* Secure the browser. 
Ensure the organization’s computer and browser software are well-managed and kept up to date with security updates. Limit the browser plugins to ensure secure and audited plugins are installed on the browser. Use automatic updates and timely restart of the browser to reduce long-running unpatched software.
* Audit and manage users.  
Organization audits and verifies the users who belong to their organization and timely disables the users who have left the organization or have no longer need the role to manage CVE records for the organization. 
* Regenerate your API keys periodically. 
The cve-program allows for regeneration of the API keys for users in an organization. This is recommended to match the organization password and API credentials lifecycle management policy.  This can also allow for timely auditing and detection of rogue users and stray accounts that are part of your organization
* Protect web server, if you run your own.
The software Vulnogram can be accessed at [https://vulnogram.github.io](https://vulnogram.github.io) for a client only solution from GitHub site. Similarly cveClient is also accessible from [https://certcc.github.io/cveClient/](https://certcc.github.io/cveClient/).  These are static websites hosted at GitHub and do not collect any information from your browser but only serve static web content. However, if you wish to run a cloned or forked version of Vulnogram or cveClient software from GitHub, ensure your publishing web server is protected from Cross-Site Scripting (XSS) attacks using something like [Content-Security-Policy headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy).












