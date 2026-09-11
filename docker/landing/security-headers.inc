# Kept in one file so the two location blocks cannot drift apart.
# add_header does not inherit into a location that declares its own, which is
# the usual way these get silently dropped.

add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; form-action 'self'; base-uri 'none'; frame-ancestors 'self'" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), interest-cohort=()" always;
# HSTS belongs on the TLS-terminating edge (Cloudflare), not here.
