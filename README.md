# AutoScout

A total cost of ownership calculator for comparing electric, hybrid, and gas vehicles in Ontario, Canada. Built for highway-heavy driving in the Kincardine area.

## Features

- **20 preset vehicles** including the full shortlist (Tundra, BMW 330i, Golf GTI, Kia K4, CT5, Prius, Model Y, Model 3, Polestar 3, bZ) plus popular Canadian alternatives
- **Live cost calculations** — adjust annual km, gas prices, electricity rates, and Supercharger usage with sliders
- **Garage** — add vehicles, check up to 4 for side-by-side comparison, view a stacked 5-year cost breakdown chart
- **Financing calculator** — monthly payments and total interest for every car in your garage
- **Add any vehicle** — year/make/model/trim lookup via fueleconomy.gov; Canadian price auto-estimated from live CA listings (marketcheck.com) with fallback to MSRP conversion
- **Mobile-friendly** — responsive layout down to 375px

## Tech Stack

- React 18 + Vite
- Recharts (bar charts)
- fueleconomy.gov REST API (vehicle specs + US MSRP)
- marketcheck.com API (live Canadian listing prices, via Vercel serverless function)
- frankfurter.app (live USD→CAD exchange rate)
- Google Fonts (Barlow Condensed, Barlow, IBM Plex Mono)

## Running Locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Canadian Price Estimation (Add Car page)

When adding a custom vehicle, AutoScout estimates the Canadian price automatically using two sources fired in parallel:

1. **Option B (preferred)** — `api/price.js` calls [marketcheck.com](https://www.marketcheck.com/developer/) for live Canadian listing averages (median of up to 30 results).
2. **Option A (fallback)** — US MSRP from fueleconomy.gov × live USD→CAD rate × 10% Canadian markup, with a depreciation curve applied if the vehicle is >2 years old.

To enable Option B, add a free marketcheck.com API key to Vercel:

1. Sign up at [marketcheck.com/developer](https://www.marketcheck.com/developer/) (free tier: 1,000 calls/month)
2. In Vercel: **Settings → Environment Variables → Add** `MARKETCHECK_API_KEY`
3. Redeploy

Without the key, the app silently falls back to Option A — no errors shown to users.

## Deploying to Vercel

1. Push this repo to GitHub
2. Import the repo at [vercel.com](https://vercel.com) — Vite is auto-detected
3. Add `MARKETCHECK_API_KEY` environment variable (see above)
4. Hit Deploy

Every subsequent push to `main` redeploys automatically.

## Data Sources & Assumptions

| Item | Source / Default |
|---|---|
| Regular gas | ~$1.60/L (Ontario avg, GlobalPetrolPrices.ca) |
| Premium gas | ~$1.75/L |
| Home electricity | 14¢/kWh all-in (Ontario TOU off-peak, OEB 2026) |
| Supercharger | 48¢/kWh (Ontario, Tesla app) |
| EV charging split | 70% home / 30% Supercharger |
| Insurance | Ontario provincial averages (IBC data), adjusted by vehicle class |
| Vehicle specs | [fueleconomy.gov](https://www.fueleconomy.gov) (US EPA) |
| Used car prices | [AutoTrader.ca](https://www.autotrader.ca) + [CarGurus.ca](https://www.cargurus.ca) (June 2026) |

5-year total cost = (fuel + insurance + maintenance) × 5 + depreciation. Excludes financing interest, taxes, and fees.

> **Winter note:** EV range drops 25–40% below −15°C — relevant for Kincardine area winters.
