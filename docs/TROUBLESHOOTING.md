# Troubleshooting

## `SELF_SIGNED_CERT_IN_CHAIN` errors

Occurs when Node.js rejects an HTTPS connection due to a self-signed or corporate CA certificate. This is a known issue with **GlobalProtect VPN** — when connected, GlobalProtect intercepts TLS traffic and re-signs it with its own CA, which Node.js doesn't trust by default. It can also occur on other corporate networks with SSL inspection proxies (Zscaler, Charles, etc.) or when hitting internal APIs with self-signed certs.

**Preferred fix: point Node at your CA cert**

Export your corporate or service root CA as a `.pem` file, then add to `apps/web/.env.local`:

```
NODE_EXTRA_CA_CERTS=/path/to/your-corporate-ca.pem
```

On macOS, find the cert in **Keychain Access**, export as `.pem`, and use that path.

**Dev-only fallback: disable TLS verification**

```
NODE_TLS_REJECT_UNAUTHORIZED=0
```

Add to `apps/web/.env.local` for local dev only. Never commit this or use it in production — it disables all TLS validation.
