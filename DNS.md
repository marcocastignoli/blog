# DNS records for castignoli.it on GitHub Pages

The domain stays registered at one.com. Only the DNS records change, by hand, in the one.com control panel (Domains → castignoli.it → DNS settings → Advanced). Apply them only when the new site is live on `marcocastignoli.github.io` and the `CNAME` file (`www.castignoli.it`) is deployed.

## Records to set

| Type  | Host (name) | Value                          | TTL     |
|-------|-------------|--------------------------------|---------|
| A     | `@`         | `185.199.108.153`              | 3600    |
| A     | `@`         | `185.199.109.153`              | 3600    |
| A     | `@`         | `185.199.110.153`              | 3600    |
| A     | `@`         | `185.199.111.153`              | 3600    |
| AAAA  | `@`         | `2606:50c0:8000::153`          | 3600    |
| AAAA  | `@`         | `2606:50c0:8001::153`          | 3600    |
| AAAA  | `@`         | `2606:50c0:8002::153`          | 3600    |
| AAAA  | `@`         | `2606:50c0:8003::153`          | 3600    |
| CNAME | `www`       | `marcocastignoli.github.io.`   | 3600    |

`@` means the bare domain `castignoli.it`. The AAAA records are optional (IPv6); the four A records and the `www` CNAME are required.

## Records to remove

- The current `A` record for `@` pointing to one.com (`46.30.213.1`).
- The current `A` (or `CNAME`) record for `www` pointing to one.com.
- Any `www-static` record can stay or go; the new site does not use it.

Leave MX and TXT records (mail, SPF, DKIM) untouched.

## On GitHub, after the records are set

1. Repository → Settings → Pages → Custom domain: `www.castignoli.it`, Save. GitHub checks the DNS and then issues the HTTPS certificate (a few minutes up to an hour).
2. Tick "Enforce HTTPS" once the certificate is ready.
3. The bare domain `castignoli.it` then redirects to `www.castignoli.it`, because the `CNAME` file names the `www` host.

## Check from a terminal

```sh
dig +short castignoli.it A          # the four 185.199.x.153 addresses
dig +short www.castignoli.it CNAME  # marcocastignoli.github.io.
curl -sI https://www.castignoli.it/ | head -5
```

Old one.com values, for reference: `castignoli.it` and `www.castignoli.it` both resolved to `46.30.213.1` on 2026-10-21.
