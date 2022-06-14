### Installing cveClient on your webserver (apache2, IIS, nginx, tinyhttp)

All the files in this repository are client utilities expected to served from a webserver to run inside a web browser.  Directly accessing the index.html file inside a browser will NOT work as most browsers will not allow network activity from static files on your local or network attached drive/storage.

Clone this repository to a web accessible folder in your webserver says into a folder called `cveClient` using git command `git clone https://github.com/CERTCC/cveClient`.  Once you have cloned this folder, you can visit your webserver's relative URL at `/cveClient/` to the folder where the repository was cloned. Ensure your webserver's default index file is `index.html`

If you use Content-Security-Policy (CSP) headers on your webserver or on your web reverse proxy, make sure the appropriate domain URLs are allowed for the folder that was cloned (`cveClient`). Below is the sample Content-Security-Policy header recommended for this folder:

`default-src 'self' blob: http://127.0.0.1:* http://localhost:*; connect-src 'self' http://127.0.0.1:* http://localhost:* *.mitre.org; script-src 'self' https://stackpath.bootstrapcdn.com https://code.jquery.com https://cdnjs.cloudflare.com https://unpkg.com blob:; style-src 'self' https://stackpath.bootstrapcdn.com 'unsafe-inline' https://unpkg.com; img-src 'self' data: blob:;object-src 'self'`



