# AutoScout

A total cost of ownership calculator for comparing electric, hybrid, and gas vehicles in Ontario, Canada. Built for highway-heavy driving in the Kincardine area.

## Features

- **20 preset vehicles** including the full shortlist (Tundra, BMW 330i, Golf GTI, Kia K4, CT5, Prius, Model Y, Model 3, Polestar 3, bZ) plus popular Canadian alternatives
- **Live cost calculations** — adjust annual km, gas prices, electricity rates, and Supercharger usage with sliders
- **Garage** — add vehicles, check up to 4 for side-by-side comparison, view a stacked 5-year cost breakdown chart
- **Financing calculator** — monthly payments and total interest for every car in your garage
- **Add any vehicle** — year/make/model/trim lookup via the fueleconomy.gov API auto-fills fuel type, efficiency, and EV range; you provide the Canadian price
- **Mobile-friendly** — responsive layout down to 375px

## Tech Stack

- React 18 + Vite
- Recharts (bar charts)
- fueleconomy.gov REST API (vehicle specs lookup)
- Google Fonts (Barlow Condensed, Barlow, IBM Plex Mono)
- No backend — fully static

## Running Locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Deploying to Vercel

1. Push this repo to GitHub
2. Import the repo at [vercel.com](https://vercel.com) — Vite is auto-detected
3. Hit Deploy

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
