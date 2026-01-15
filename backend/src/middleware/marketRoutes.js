import express from "express";
import yahooFinance from "yahoo-finance2";

const router = express.Router();
const yf = new yahooFinance();

router.get("/prices", async (req, res) => {
  try {
    const symbols = req.query.symbols?.split(",") || [
      "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS"
    ];

    const livePrices = [];

    for (const symbol of symbols) {
      try {
        const quote = await yf.quote(symbol, {}, { validateResult: false });
        if (!quote || quote.regularMarketPrice == null) continue;

        livePrices.push({
          symbol: quote.symbol,
          name: quote.shortName || quote.displayName || quote.symbol,
          price: quote.regularMarketPrice,
          change: quote.regularMarketChange || 0,
          percent: quote.regularMarketChangePercent?.toFixed(2) + "%" || "0.00%",
          positive: (quote.regularMarketChange || 0) >= 0,
          volume: quote.regularMarketVolume,
          marketCap: quote.marketCap,
          updatedAt: new Date()
        });
      } catch (err) {
        console.error(`Failed to fetch ${symbol}:`, err.message);
      }
    }

    res.json(livePrices);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch live prices" });
  }
});

export default router;
