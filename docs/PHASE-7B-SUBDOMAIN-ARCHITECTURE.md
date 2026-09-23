# Subdomain architecture — Stap 16

Alimenta gebruikt de bestaande unieke Organization.slug als basis voor tenant-subdomeinen. Er wordt geen tweede tenant- of domeinopslag toegevoegd.

Canonieke vorm: <organization-slug>.<ALIMENTA_BASE_DOMAIN>

Host-routing bepaalt alleen een kandidaat-tenant. De bestaande server-side tenant authorization blijft de autoriteit voor toegang tot organisaties, dossiers en cliënten.

Securityregels:
- Alleen hosts onder ALIMENTA_BASE_DOMAIN.
- Exact één tenant-label.
- Slugs zijn lowercase letters, cijfers en hyphens, maximaal 48 tekens.
- Reserved hosts zoals www, api, admin, mail, dev en staging zijn verboden.
- Client headers zoals x-tenant-id zijn nooit bron van waarheid.
- Credentials en path-injectie in Host zijn verboden.
- Zonder ALIMENTA_BASE_DOMAIN wordt geen productie-domein aangenomen.

Productie-infrastructuur:
1. Wildcard DNS voor *.<ALIMENTA_BASE_DOMAIN> naar de ingress.
2. Wildcard TLS op de reverse proxy/ingress.
3. De oorspronkelijke Host-header blijft behouden.
4. Alleen de vertrouwde reverse proxy kan de applicatie bereiken.
5. HTTP wordt vóór authenticated application traffic naar HTTPS omgeleid.

CustomDomain blijft een afzonderlijke capability. Een custom domain mag tenant-routing pas activeren na server-side ownership verification en geldige TLS-status.

Er worden in Stap 16 geen DNS-, certificaat- of productie-infrastructuurwijzigingen uitgevoerd.
