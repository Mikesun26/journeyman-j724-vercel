# J724 Journeyman – Travel & Supply Chain Intelligence

A deploy-ready PWA for **Travel Advisory, Route Advance, OSINT EDD, and Control Tower** with glam UI, SOS, and PDF **Mission Pack**.

## Deploy

### Vercel (recommended)
- **Framework:** Vite
- **Build:** `npm run build`
- **Output:** `dist`
- **API:** `/api/*` serverless functions (TypeScript)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=<YOUR_GITHUB_REPO_URL>)

### Netlify
- **Build:** `npm run build`
- **Publish:** `dist`
- **Functions:** `netlify/functions`
- `netlify.toml` handles SPA + `/api/*` rewrites.

## Environment Variables (optional, enable extra sources)

| Variable | Description |
|---|---|
| `SCRAPER_PROVIDER` | `zenrows` \| `scraperapi` \| `scrapingbee` \| `generic` |
| `SCRAPER_API_KEY` | API key for the chosen scraper |
| `SCRAPER_BASE` | If using a custom scraper gateway |
| `HIBP_KEY` | Have I Been Pwned API key |
| `SECURITYTRAILS_KEY` | SecurityTrails API key |
| `SHODAN_KEY` | Shodan API key |
| `CENSYS_UID`, `CENSYS_SECRET` | Censys API credentials |
| `CHAOSCHAIN_BASE` | Base URL to ChaosChain microservice |
| `CHAOSCHAIN_TOKEN` | Optional auth for ChaosChain |

## Features
- **Map & Layers:** OSM base + hazard heatmap (USGS, GDACS, ReliefWeb, EONET).
- **Itinerary Route Advance:** geocode, weather, POIs, hazards, scoring.
- **Mission Pack (PDF):** one-click PDF of route + EDD + graph snapshot.
- **Enhanced Due Diligence:** OpenSanctions + GDELT adverse media + relationship graph.
- **Research Tools:** Dorks, BGPView, CVE, optional HIBP/SecurityTrails/Shodan/Censys.
- **Control Tower:** proxy to ChaosChain for forecast/sim/inventory/actions.
- **Accessibility:** compact itinerary mode, high-contrast, reduce motion, large text.

## Health / Status
- UI page: `/status` (green/amber diagnostics)
- API: `/api/health` (Vercel) and `/api/status` (both)

## Local Dev
```bash
npm i
npm run dev
# build
npm run build && npm run preview
```

## Security
All third-party calls go via serverless functions. No keys exposed to the browser.
