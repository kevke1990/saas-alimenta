\
#!/bin/sh
set -eu
certbot renew --quiet
systemctl reload nginx
