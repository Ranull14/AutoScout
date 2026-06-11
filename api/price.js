// Vercel serverless function — proxies marketcheck.com for Canadian car price data
// Env var required: MARKETCHECK_API_KEY (set in Vercel project settings)

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { year, make, model } = req.query;
  if (!year || !make || !model) {
    return res.status(400).json({ error: "year, make, model are required" });
  }

  const key = process.env.MARKETCHECK_API_KEY;
  if (!key) {
    return res.status(503).json({ error: "MARKETCHECK_API_KEY not configured" });
  }

  try {
    const url = new URL("https://mc-api.marketcheck.com/v2/search/car/active");
    url.searchParams.set("api_key", key);
    url.searchParams.set("year",    year);
    url.searchParams.set("make",    make);
    url.searchParams.set("model",   model);
    url.searchParams.set("country", "CA");   // Canadian listings only
    url.searchParams.set("rows",    "30");
    url.searchParams.set("fl",      "price"); // only fetch price field

    const r = await fetch(url.toString(), {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(6000),
    });

    if (!r.ok) {
      return res.status(502).json({ error: `marketcheck ${r.status}` });
    }

    const data = await r.json();
    const listings = data.listings || [];
    const prices = listings
      .map(l => Number(l.price))
      .filter(p => p > 5000); // filter out obvious bad data

    if (!prices.length) {
      return res.status(200).json({ price: null, count: 0 });
    }

    prices.sort((a, b) => a - b);
    // Use median to avoid skew from outliers
    const mid    = Math.floor(prices.length / 2);
    const median = prices.length % 2 === 0
      ? Math.round((prices[mid - 1] + prices[mid]) / 2)
      : prices[mid];

    return res.status(200).json({
      price:  median,
      count:  prices.length,
      low:    prices[0],
      high:   prices[prices.length - 1],
      source: "marketcheck-ca",
    });

  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
