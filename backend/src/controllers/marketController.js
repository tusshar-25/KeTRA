import yahooFinance from "yahoo-finance2";
import { isMarketOpenServer } from "../utils/marketTime.js";

const yf = new yahooFinance();

/**
 * Get live market prices for all stocks
 * @route GET /api/market/prices
 * @access Public
 */
export const getLivePrices = async (req, res) => {
  try {
    // Default stock symbols to fetch
    const symbols = req.query.symbols?.split(",") || [
      "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS",
      "SBIN.NS", "BHARTIARTL.NS", "KOTAKBANK.NS", "LT.NS", "AXISBANK.NS"
    ];

    const marketData = [];

    for (const symbol of symbols) {
      try {
        const quote = await yf.quote(symbol, {}, { validateResult: false });
        if (!quote || quote.regularMarketPrice == null) continue;

        marketData.push({
          symbol: quote.symbol,
          name: quote.shortName || quote.displayName || quote.symbol,
          price: quote.regularMarketPrice,
          change: quote.regularMarketChange || 0,
          percent: quote.regularMarketChangePercent?.toFixed(2) + "%" || "0.00%",
          positive: (quote.regularMarketChange || 0) >= 0,
          volume: quote.regularMarketVolume,
          marketCap: quote.marketCap,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error(`Failed to fetch ${symbol}:`, err.message);
      }
    }

    res.status(200).json(marketData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get market overview data
 * @route GET /api/market/overview
 * @access Public
 */
export const getMarketOverview = async (req, res) => {
  try {
    // Fetch real market data for overview
    const symbols = ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS"];
    let positiveStocks = 0;
    let negativeStocks = 0;
    const totalStocks = symbols.length;

    for (const symbol of symbols) {
      try {
        const quote = await yf.quote(symbol, {}, { validateResult: false });
        if (quote && quote.regularMarketChange != null) {
          if (quote.regularMarketChange >= 0) {
            positiveStocks++;
          } else {
            negativeStocks++;
          }
        }
      } catch (err) {
        console.error(`Failed to fetch ${symbol} for overview:`, err.message);
      }
    }

    const overview = {
      totalStocks,
      positiveStocks,
      negativeStocks,
      marketSentiment: positiveStocks > negativeStocks ? "Bullish" : "Bearish",
      lastUpdated: new Date().toISOString()
    };

    res.status(200).json(overview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get market status
 * @route GET /api/market/status
 * @access Public
 */
export const getMarketStatus = async (req, res) => {
  try {
    const isOpen = isMarketOpenServer();
    const now = new Date();
    
    // Format current time in IST
    const istTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );

    res.status(200).json({
      isOpen,
      currentTime: istTime.toISOString(),
      marketHours: {
        open: "09:15 AM",
        close: "03:30 PM",
        timezone: "IST",
        weekdays: "Monday - Friday"
      },
      lastChecked: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
