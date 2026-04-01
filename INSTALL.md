# Installing cveClient

cveClient is a pure static web application — all files are served directly to the browser with no build step, no transpilation, and no server-side processing.

## Quick Start (Local Development)

Any local web server will work. Pick whichever you have installed:

```bash
# Python
python3 -m http.server 8080

# Node.js
npx serve .

# PHP
php -S localhost:8080

# Ruby
ruby -run -e httpd . -p 8080
```

Then open `http://localhost:8080` in your browser.

**Note:** Opening `index.html` directly from the filesystem (`file://`) will not work — browsers block network requests from local files.

## Production Deployment (Apache, Nginx, IIS)

Clone the repository into a web-accessible folder on your web server:

```bash
git clone https://github.com/CERTCC/cveClient.git /var/www/html/cveClient
```

Then visit your server's URL at `/cveClient/`. Ensure your web server's default index file includes `index.html`.

### Content-Security-Policy

If you use Content-Security-Policy (CSP) headers on your web server or reverse proxy, the following CSP is recommended for the cveClient folder:

```
default-src 'self' blob: http://127.0.0.1:* http://localhost:*;
connect-src 'self' http://127.0.0.1:* http://localhost:* *.mitre.org;
script-src 'self' https://stackpath.bootstrapcdn.com https://code.jquery.com https://cdnjs.cloudflare.com https://unpkg.com https://apis.google.com blob:;
style-src 'self' https://stackpath.bootstrapcdn.com 'unsafe-inline' https://unpkg.com;
img-src 'self' data: blob:;
object-src 'self'
```

### Apache Example

Add to your `.htaccess` or virtual host configuration:

```apache
<Directory /var/www/html/cveClient>
    Header set Content-Security-Policy "default-src 'self' blob: http://127.0.0.1:* http://localhost:*; connect-src 'self' http://127.0.0.1:* http://localhost:* *.mitre.org; script-src 'self' https://stackpath.bootstrapcdn.com https://code.jquery.com https://cdnjs.cloudflare.com https://unpkg.com https://apis.google.com blob:; style-src 'self' https://stackpath.bootstrapcdn.com 'unsafe-inline' https://unpkg.com; img-src 'self' data: blob:; object-src 'self'"
</Directory>
```

### Nginx Example

```nginx
location /cveClient/ {
    add_header Content-Security-Policy "default-src 'self' blob: http://127.0.0.1:* http://localhost:*; connect-src 'self' http://127.0.0.1:* http://localhost:* *.mitre.org; script-src 'self' https://stackpath.bootstrapcdn.com https://code.jquery.com https://cdnjs.cloudflare.com https://unpkg.com https://apis.google.com blob:; style-src 'self' https://stackpath.bootstrapcdn.com 'unsafe-inline' https://unpkg.com; img-src 'self' data: blob:; object-src 'self'";
}
```

## CVE Services Endpoints

The application connects to one of three CVE Services environments, selectable at login:

| Environment | URL                                 |
| ----------- | ----------------------------------- |
| Production  | `https://cveawg.mitre.org/api`      |
| Test        | `https://cveawg-test.mitre.org/api` |
| Local       | `http://127.0.0.1:3000/api`         |

If you need to connect to a different endpoint, modify the `<select>` element in `index.html` (around line 670).
