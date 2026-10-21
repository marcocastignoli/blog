# DNS for castignoli.it on GitHub Pages

The domain stays at one.com. The change is made by hand in the one.com control panel: Domains → castignoli.it → DNS settings. Apply it only when the site is deployed on GitHub Pages with the custom domain `www.castignoli.it` set (done on 2026-10-21).

## How the one.com panel works

one.com shows two sections. **Personal DNS settings** holds the records you add yourself. **Standard DNS settings** holds the records one.com manages for its own hosting and mail, among them `A castignoli.it`, `AAAA castignoli.it`, `A www.castignoli.it` and `AAAA www.castignoli.it`, which today point to one.com's web server. Standard records are not deleted: when you add a personal record that conflicts with one of them, one.com switches the standard record off, and under "Show all" each of them has a slider you can switch off yourself. Changes take up to 90 minutes.

## What to do

1. In **Personal DNS settings**, add these records (hostname empty means the bare domain `castignoli.it`; TTL can stay at the default 3600):

   | Type | Hostname | Value |
   |---|---|---|
   | A | *(empty)* | `185.199.108.153` |
   | A | *(empty)* | `185.199.109.153` |
   | A | *(empty)* | `185.199.110.153` |
   | A | *(empty)* | `185.199.111.153` |
   | CNAME | `www` | `marcocastignoli.github.io` |

   The `www` CNAME is the same kind of record as the existing `cms` and `talaria` ones.

2. Optional, for IPv6, also in Personal DNS settings:

   | Type | Hostname | Value |
   |---|---|---|
   | AAAA | *(empty)* | `2606:50c0:8000::153` |
   | AAAA | *(empty)* | `2606:50c0:8001::153` |
   | AAAA | *(empty)* | `2606:50c0:8002::153` |
   | AAAA | *(empty)* | `2606:50c0:8003::153` |

3. In **Standard DNS settings**, click "Show all" and make sure these four records are switched off (grey slider): `A castignoli.it`, `AAAA castignoli.it`, `A www.castignoli.it`, `AAAA www.castignoli.it`. The new personal records switch most of them off by themselves; the `AAAA` ones may still be on, because an `A` record does not conflict with an `AAAA`. Switch off any that is still on. An `AAAA` left on would send IPv6 visitors to one.com.

4. Touch nothing else. Every other standard record (`MX`, the `TXT` records, the `_domainkey` CNAMEs, `_acme-challenge`, `_dmarc`, `www-static`, `old`, `gifts`, `handball`, `lupus-liber`, `meditate`, `tab`) is mail, verification or unrelated. The personal records (`*` wildcard, `cms`, `talaria`, `ftp`, `appwrite`, `iceland`, `steven`, `basic-server`, `binaries`, `propaganda.ipns`, `michelle.atoe.marco`) stay. The wildcard `*.castignoli.it → 78.134.33.51` only answers for names without a record of their own, so it never catches `castignoli.it` or `www` while their records exist.

## After the change

GitHub checks the DNS (repository → Settings → Pages, the domain gets a green check), then issues the HTTPS certificate, usually within the hour. Then tick **Enforce HTTPS**. The bare domain `castignoli.it` redirects to `www.castignoli.it`. Check from a terminal:

```sh
dig +short castignoli.it A          # the four 185.199.x.153 addresses
dig +short castignoli.it AAAA       # nothing, or the 2606:50c0:800x::153 addresses
dig +short www.castignoli.it CNAME  # marcocastignoli.github.io.
curl -sI https://www.castignoli.it/ | head -3
```

Old values, for reference: on 2026-10-21 `castignoli.it` and `www.castignoli.it` resolved to one.com (`46.30.213.1`).
