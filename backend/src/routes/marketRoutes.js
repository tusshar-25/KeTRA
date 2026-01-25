import express from "express";
import yahooFinance from "yahoo-finance2";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Portfolio from "../models/Portfolio.js";
import jwt from "jsonwebtoken";
import { isMarketOpenServer } from "../utils/marketTime.js";

const router = express.Router();
const yf = new yahooFinance({ suppressNotices: ['ripHistorical'] });

/**
 * Fetch index data using yahoo-finance2 (handles auth internally)
 */
const fetchIndex = async (symbol, name) => {
  try {
    // Use the new API approach for yahoo-finance2 v3
    const result = await yf.quote(symbol, {}, { validateResult: false });
    
    if (!result || result.regularMarketPrice == null) {
      throw new Error("Invalid Yahoo response");
    }

    console.log(symbol, result?.regularMarketPrice);

    return {
      symbol,
      name,
      value: parseFloat(result.regularMarketPrice.toFixed(2)),
      change: parseFloat(result.regularMarketChange.toFixed(2)),
      percent: result.regularMarketChangePercent.toFixed(2) + "%",
      positive: result.regularMarketChange >= 0,
      delayed: true,
      fallback: false,
    };
  } catch (error) {
    console.error(`Index fetch failed for ${symbol}:`, error.message);

    // Safe fallback (UX continuity)
    const fallbackMap = {
      "^NSEI": {
        value: 22450.30,
        change: 124.60,
        percent: "+0.56%",
        positive: true,
      },
      "^BSESN": {
        value: 74120.18,
        change: -210.42,
        percent: "-0.28%",
        positive: false,
      },
      "^NSEBANK": {
        value: 48560.90,
        change: 156.30,
        percent: "+0.32%",
        positive: true,
      },
    };

    return {
      symbol,
      name,
      ...(fallbackMap[symbol] || {
        value: 0,
        change: 0,
        percent: "0.00%",
        positive: true,
      }),
      delayed: true,
      fallback: true,
    };
  }
};

/**
 * @route   GET /api/market/status
 * @desc    Get current market status and hours
 * @access  Public
 */
router.get("/status", async (req, res) => {
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
    console.error("MARKET STATUS ERROR:", error);
    res.status(500).json({ 
      message: "Failed to get market status",
      error: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
    });
  }
});

/**
 * @route   GET /api/market/indices
 * @desc    Get delayed live indices data
 * @access  Public
 */
router.get("/indices", async (req, res) => {
  try {
    console.log("Fetching indices...");
    const indices = await Promise.all([
      fetchIndex("^NSEI", "NIFTY 50"),
      fetchIndex("^BSESN", "SENSEX"),
      fetchIndex("^NSEBANK", "BANK NIFTY"),
    ]);

    console.log("Indices fetched:", indices);

    // Set cache control headers before sending response
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    res.status(200).json({
      indices,
      market: "Live",
      source: "Yahoo Finance",
      delayed: true,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("MARKET INDICES ERROR:", error);
    
    // Set cache control headers before sending error response
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    
    res.status(500).json({ 
      message: "Failed to fetch market indices",
      error: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
    });
  }
});

/**
 * @route   GET /api/market/stocks
 * @desc    Get delayed live stock prices
 * @query   symbols=RELIANCE.NS,TCS.NS,INFY.NS
 * @access  Public
 */
router.get("/stocks", async (req, res) => {
  try {
    const symbols =
      req.query.symbols?.split(",") || [
        "RELIANCE.NS",
        "TCS.NS",
        "INFY.NS",
        "HDFCBANK.NS",
        "ICICIBANK.NS",
        "SBIN.NS",
        "BHARTIARTL.NS",
        "KOTAKBANK.NS",
        "LT.NS",
        "AXISBANK.NS",
        "MARUTI.NS",
        "HCLTECH.NS",
        "SUNPHARMA.NS",
        "M&M.NS",
        "TITAN.NS"
      ];

    console.log(`Fetching ${symbols.length} stocks from Yahoo Finance...`);
    const startTime = Date.now();

    // Fetch stocks in parallel with timeout
    const stockPromises = symbols.map(async (symbol) => {
      try {
        // Add timeout to each individual stock fetch
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Stock fetch timeout')), 3000)
        );
        
        const quotePromise = yf.quote(symbol, {}, { validateResult: false });
        const q = await Promise.race([quotePromise, timeoutPromise]);

        if (!q || q.regularMarketPrice == null) {
          throw new Error("Invalid quote data");
        }

        // Log raw price for debugging RELIANCE and TCS
        if (symbol.includes('RELIANCE') || symbol.includes('TCS')) {
          console.log(`${symbol} raw data:`, {
            regularMarketPrice: q.regularMarketPrice,
            regularMarketPriceFmt: q.regularMarketPriceFmt,
            regularMarketTime: new Date(q.regularMarketTime * 1000).toISOString(),
            marketState: q.marketState,
            exchange: q.fullExchangeName,
            currency: q.currency,
            source: 'Yahoo Finance'
          });
        }

        return {
          symbol: q.symbol,
          name: q.shortName || q.displayName || q.symbol,
          price: parseFloat(q.regularMarketPrice.toFixed(2)), // Round to 2 decimal places
          change: parseFloat((q.regularMarketChange || 0).toFixed(2)), // Round to 2 decimal places
          percent:
            q.regularMarketChangePercent != null
              ? q.regularMarketChangePercent.toFixed(2) + "%"
              : "0.00%",
          positive: q.regularMarketChange >= 0,
          volume: q.regularMarketVolume,
          marketCap: q.marketCap,
          delayed: true,
        };
      } catch (err) {
        console.error(`Stock fetch failed: ${symbol}`, err.message);
        return null; // Return null for failed stocks
      }
    });

    // Wait for all stock fetches with a overall timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Overall stocks fetch timeout')), 8000)
    );
    
    const stockResults = await Promise.race([
      Promise.all(stockPromises),
      timeoutPromise
    ]);

    // Filter out null results and sort by market cap
    const results = stockResults
      .filter(stock => stock !== null)
      .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
      .slice(0, 20); // Limit to top 20 by market cap

    const fetchTime = Date.now() - startTime;
    console.log(`Successfully fetched ${results.length} stocks in ${fetchTime}ms`);

    res.json({
      stocks: results,
      delayed: true,
      source: "Yahoo Finance (15-min delayed for Indian markets)",
      lastUpdated: new Date().toISOString(),
      fetchTime: `${fetchTime}ms`,
      note: "Prices may differ from real-time broker data due to 15-minute delay"
    });
  } catch (error) {
    console.error("STOCK ROUTE CRASH:", error);
    // Return empty array instead of error to prevent frontend issues
    res.json({
      stocks: [],
      delayed: true,
      source: "Yahoo Finance (Error)",
      lastUpdated: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * @route   GET /api/market/sme-stocks
 * @desc    Get delayed live SME stock prices
 * @query   symbols=SYMBOL1,SYMBOL2 (optional)
 * @access  Public
 */
router.get("/sme-stocks", async (req, res) => {
  try {
    const symbols =
      req.query.symbols?.split(",") || [
        "VTL.NS",
        "MOTILALOFS.NS",
        "TIINDIA.NS",
        "EMAMILTD.NS",
        "GODREJIND.NS",
        "BLUESTARCO.NS",
        "CROMPTON.NS",
        "FINPIPE.NS",
        "SHAKTIPUMP.NS",
        "RATNAMANI.NS"
      ];

    console.log(`Fetching ${symbols.length} SME stocks from Yahoo Finance...`);
    const startTime = Date.now();

    // Fetch SME stocks in parallel with timeout
    const stockPromises = symbols.map(async (symbol) => {
      try {
        // Add timeout to each individual stock fetch
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('SME stock fetch timeout')), 3000)
        );
        
        const quotePromise = yf.quote(symbol, {}, { validateResult: false });
        const q = await Promise.race([quotePromise, timeoutPromise]);

        if (!q || q.regularMarketPrice == null) {
          throw new Error("Invalid quote data");
        }

        return {
          symbol: q.symbol,
          name: q.shortName || q.displayName || q.symbol,
          price: q.regularMarketPrice,
          change: q.regularMarketChange || 0,
          percent:
            q.regularMarketChangePercent != null
              ? q.regularMarketChangePercent.toFixed(2) + "%"
              : "0.00%",
          positive: q.regularMarketChange >= 0,
          volume: q.regularMarketVolume,
          marketCap: q.marketCap,
          delayed: true,
        };
      } catch (err) {
        console.error(`SME stock fetch failed: ${symbol}`, err.message);
        return null; // Return null for failed stocks
      }
    });

    // Wait for all SME stock fetches with a overall timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Overall SME stocks fetch timeout')), 6000)
    );
    
    const stockResults = await Promise.race([
      Promise.all(stockPromises),
      timeoutPromise
    ]);

    // Filter out null results and sort by market cap
    const results = stockResults
      .filter(stock => stock !== null)
      .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));

    const fetchTime = Date.now() - startTime;
    console.log(`Successfully fetched ${results.length} SME stocks in ${fetchTime}ms`);

    res.json({
      stocks: results,
      delayed: true,
      source: "Yahoo Finance",
      lastUpdated: new Date().toISOString(),
      fetchTime: `${fetchTime}ms`
    });
  } catch (error) {
    console.error("SME STOCK ROUTE CRASH:", error);
    // Return empty array instead of error to prevent frontend issues
    res.json({
      stocks: [],
      delayed: true,
      source: "Yahoo Finance (Error)",
      lastUpdated: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * @route   GET /api/market/debug/tcs
 * @desc    Debug endpoint to check TCS raw data
 * @access  Public
 */
router.get("/debug/tcs", async (req, res) => {
  try {
    console.log("Debug: Fetching TCS.NS data...");
    const q = await yf.quote("TCS.NS", {}, { validateResult: false });
    
    console.log("TCS.NS complete data:", JSON.stringify(q, null, 2));
    
    res.json({
      symbol: q.symbol,
      name: q.shortName || q.displayName,
      regularMarketPrice: q.regularMarketPrice,
      regularMarketPriceFmt: q.regularMarketPriceFmt,
      regularMarketTime: new Date(q.regularMarketTime * 1000).toISOString(),
      marketState: q.marketState,
      exchange: q.fullExchangeName,
      currency: q.currency,
      exchangeDataDelayedBy: q.exchangeDataDelayedBy,
      marketCap: q.marketCap,
      ask: q.ask,
      bid: q.bid,
      previousClose: q.regularMarketPreviousClose
    });
  } catch (error) {
    console.error("Debug TCS error:", error);
    res.status(500).json({ error: error.message });
  }
});

// In-memory transaction storage (for demo - replace with database in production)
let transactions = [];
let portfolio = {};

/**
 * @route   POST /api/market/buy
 * @desc    Execute buy order
 * @body    { symbol, quantity, price }
 * @access  Private
 */
router.post("/buy", async (req, res) => {
  try {
    // Authentication check
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication token required" });
    }

    // Verify token and get user
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const { symbol, quantity, price } = req.body;
    
    // Validate required fields - price is optional
    if (!symbol || !quantity) {
      return res.status(400).json({ message: "Symbol and quantity are required" });
    }

    // If price not provided, fetch current market price
    let currentPrice = price;
    if (!currentPrice) {
      try {
        const yf = await import('yahoo-finance2').then(mod => mod.default);
        const quote = await yf.quote(symbol, {}, { validateResult: false });
        if (!quote || quote.regularMarketPrice == null) {
          return res.status(404).json({ message: "Could not fetch current stock price" });
        }
        currentPrice = quote.regularMarketPrice;
      } catch (error) {
        console.error(`Failed to fetch stock price for ${symbol}:`, error);
        return res.status(400).json({ message: "Could not determine stock price" });
      }
    }

    const totalCost = parseFloat(currentPrice) * parseInt(quantity);
    
    // Check if user has sufficient balance
    if (user.balance < totalCost) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Update user balance
    user.balance -= totalCost;
    await user.save();

    // Create transaction record
    const transaction = await Transaction.create({
      user: user._id,
      type: "BUY",
      symbol: symbol.toUpperCase(),
      quantity: parseInt(quantity),
      price: parseFloat(currentPrice),
      amount: totalCost,
      timestamp: new Date()
    });

    // Update or create portfolio holding
    console.log(`Looking for holding: user=${user._id}, symbol=${symbol.toUpperCase()}`);
    const existingHolding = await Portfolio.findOne({ 
      user: user._id, 
      symbol: symbol.toUpperCase() 
    });
    console.log(`Existing holding found:`, existingHolding);

    if (existingHolding) {
      // Update existing holding
      const newQuantity = existingHolding.quantity + parseInt(quantity);
      const newAvgPrice = ((existingHolding.quantity * existingHolding.avgPrice) + totalCost) / newQuantity;
      
      existingHolding.quantity = newQuantity;
      existingHolding.avgPrice = newAvgPrice;
      existingHolding.currentPrice = parseFloat(currentPrice);
      existingHolding.currentValue = newQuantity * parseFloat(currentPrice);
      existingHolding.investedValue = newQuantity * newAvgPrice;
      existingHolding.pnl = existingHolding.currentValue - existingHolding.investedValue;
      existingHolding.pnlPercent = (existingHolding.pnl / existingHolding.investedValue) * 100;
      
      await existingHolding.save();
      console.log(`Updated holding:`, existingHolding);
    } else {
      // Create new holding
      const newHolding = await Portfolio.create({
        user: user._id,
        symbol: symbol.toUpperCase(),
        quantity: parseInt(quantity),
        avgPrice: parseFloat(currentPrice),
        currentPrice: parseFloat(currentPrice),
        currentValue: totalCost,
        investedValue: totalCost,
        pnl: 0,
        pnlPercent: 0,
        type: "REGULAR"
      });
      console.log(`Created new holding:`, newHolding);
    }

    console.log(`Buy order executed: ${quantity} ${symbol} @ ${currentPrice}, Balance: ₹${user.balance}`);
    
    res.status(201).json({
      message: "Buy order executed successfully",
      transaction,
      balance: user.balance
    });
  } catch (error) {
    console.error("BUY ORDER ERROR:", error);
    res.status(500).json({ message: "Failed to execute buy order" });
  }
});

/**
 * @route   POST /api/market/sell
 * @desc    Execute sell order
 * @body    { symbol, quantity, price }
 * @access  Private
 */
router.post("/sell", async (req, res) => {
  try {
    // Authentication check
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication token required" });
    }

    // Verify token and get user
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const { symbol, quantity, price } = req.body;
    
    // Validate required fields - price is optional
    if (!symbol || !quantity) {
      return res.status(400).json({ message: "Symbol and quantity are required" });
    }

    const symbolUpper = symbol.toUpperCase();
    const sellQuantity = parseInt(quantity);
    
    // If price not provided, fetch current market price
    let currentPrice = price;
    if (!currentPrice) {
      try {
        const yf = await import('yahoo-finance2').then(mod => mod.default);
        const quote = await yf.quote(symbol, {}, { validateResult: false });
        if (!quote || quote.regularMarketPrice == null) {
          return res.status(404).json({ message: "Could not fetch current stock price" });
        }
        currentPrice = quote.regularMarketPrice;
      } catch (error) {
        console.error(`Failed to fetch stock price for ${symbol}:`, error);
        return res.status(400).json({ message: "Could not determine stock price" });
      }
    }
    
    const totalProceeds = parseFloat(currentPrice) * sellQuantity;
    
    // Check if user has enough holdings
    const holding = await Portfolio.findOne({ 
      user: user._id, 
      symbol: symbolUpper 
    });
    
    if (!holding || holding.quantity < sellQuantity) {
      return res.status(400).json({ message: "Insufficient holdings to sell" });
    }

    // Update user balance
    user.balance += totalProceeds;
    await user.save();

    // Create transaction record
    const transaction = await Transaction.create({
      user: user._id,
      type: "SELL",
      symbol: symbolUpper,
      quantity: sellQuantity,
      price: parseFloat(currentPrice),
      amount: totalProceeds,
      timestamp: new Date()
    });

    // Update portfolio holding
    const remainingQuantity = holding.quantity - sellQuantity;
    
    if (remainingQuantity === 0) {
      // Remove holding completely
      await Portfolio.deleteOne({ _id: holding._id });
    } else {
      // Update existing holding
      const soldCostBasis = holding.avgPrice * sellQuantity;
      const newInvestedValue = holding.investedValue - soldCostBasis;
      
      holding.quantity = remainingQuantity;
      holding.currentPrice = parseFloat(currentPrice);
      holding.currentValue = remainingQuantity * parseFloat(currentPrice);
      holding.investedValue = newInvestedValue;
      holding.pnl = holding.currentValue - holding.investedValue;
      holding.pnlPercent = (holding.pnl / holding.investedValue) * 100;
      
      await holding.save();
    }

    console.log(`Sell order executed: ${sellQuantity} ${symbol} @ ${currentPrice}, Balance: ₹${user.balance}`);
    
    res.status(201).json({
      message: "Sell order executed successfully",
      transaction,
      balance: user.balance
    });
  } catch (error) {
    console.error("SELL ORDER ERROR:", error);
    res.status(500).json({ message: "Failed to execute sell order" });
  }
});

/**
 * @route   GET /api/market/portfolio
 * @desc    Get current portfolio holdings
 * @access  Private
 */
router.get("/portfolio", async (req, res) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication token required" });
    }

    // Verify token and get user
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Fetch user's portfolio from database
    const holdings = await Portfolio.find({ user: user._id });
    const portfolioWithPrices = {};
    
    for (const holding of holdings) {
      try {
        const quote = await yf.quote(holding.symbol, {}, { validateResult: false });
        const currentPrice = quote?.regularMarketPrice || 0;
        
        portfolioWithPrices[holding.symbol] = {
          quantity: holding.quantity,
          avgPrice: holding.avgPrice,
          currentPrice: currentPrice,
          currentValue: holding.quantity * currentPrice,
          investedValue: holding.quantity * holding.avgPrice,
          pnl: holding.quantity * (currentPrice - holding.avgPrice),
          pnlPercent: currentPrice > 0 ? ((currentPrice - holding.avgPrice) / holding.avgPrice * 100) : -100,
          type: holding.type
        };
      } catch (error) {
        // If price fetch fails, use stored values
        portfolioWithPrices[holding.symbol] = {
          quantity: holding.quantity,
          avgPrice: holding.avgPrice,
          currentPrice: holding.currentPrice,
          currentValue: holding.currentValue,
          investedValue: holding.investedValue,
          pnl: holding.pnl,
          pnlPercent: holding.pnlPercent,
          type: holding.type
        };
      }
    }

    res.json({
      portfolio: portfolioWithPrices,
      totalInvested: Object.values(portfolioWithPrices).reduce((sum, h) => sum + h.investedValue, 0),
      currentValue: Object.values(portfolioWithPrices).reduce((sum, h) => sum + h.currentValue, 0),
      totalPnL: Object.values(portfolioWithPrices).reduce((sum, h) => sum + h.pnl, 0)
    });
  } catch (error) {
    console.error("PORTFOLIO ERROR:", error);
    res.status(500).json({ message: "Failed to fetch portfolio" });
  }
});

/**
 * @route   GET /api/market/transactions
 * @desc    Get transaction history
 * @access  Private
 */
router.get("/transactions", async (req, res) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication token required" });
    }

    // Verify token and get user
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Fetch user's transactions from database
    const transactions = await Transaction.find({ user: user._id })
      .sort({ createdAt: -1 });
    
    res.json({
      transactions: transactions.map(t => ({
        id: t._id,
        type: t.type,
        symbol: t.symbol,
        quantity: t.quantity,
        price: t.price,
        total: t.amount,
        timestamp: t.createdAt
      })),
      total: transactions.length
    });
  } catch (error) {
    console.error("TRANSACTIONS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

/**
 * @route   GET /api/market/historical/:symbol
 * @desc    Get historical price data for a stock
 * @param   symbol - Stock symbol (e.g., RELIANCE.NS)
 * @query   period - Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
 * @access  Public
 */
router.get("/historical/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = "1mo" } = req.query; // Default to 1 month

    if (!symbol) {
      return res.status(400).json({ message: "Symbol is required" });
    }

    console.log(`Fetching historical data for ${symbol} with period ${period}`);

    // Use market close time for period2 to ensure we get complete day data
    const endTime = period === "1d" ? getMarketEndTime() : new Date();

    // Fetch historical data using yahoo-finance2 chart API
    const historicalData = await yf.chart(symbol, {
      period1: getPeriodStartDate(period),
      period2: endTime,
      interval: getIntervalForPeriod(period),
    }, { validateResult: false });

    if (!historicalData || !historicalData.quotes || !Array.isArray(historicalData.quotes) || historicalData.quotes.length === 0) {
      console.log(`No historical data found for ${symbol}. Data received:`, historicalData);
      return res.status(404).json({ message: "No historical data found for this symbol" });
    }

    console.log(`Historical data for ${symbol}: Found ${historicalData.quotes.length} quotes from ${historicalData.quotes[0]?.date} to ${historicalData.quotes[historicalData.quotes.length-1]?.date}`);

    // Transform data to match frontend format
    const transformedData = historicalData.quotes.map((data, index) => ({
      date: data.date?.toISOString() || new Date(Date.now() - (historicalData.quotes.length - index) * 24 * 60 * 60 * 1000).toISOString(),
      open: parseFloat(data.open || 0),
      high: parseFloat(data.high || 0),
      low: parseFloat(data.low || 0),
      close: parseFloat(data.close || 0),
      volume: parseInt(data.volume || 0),
      change: parseFloat(data.close - data.open || 0),
      changePercent: parseFloat(((data.close - data.open) / data.open * 100).toFixed(2) || 0),
      trend: (data.close - data.open) >= 0 ? 1 : -1,
      priceMovement: (data.close - data.open) >= 0 ? "up" : "down",
      growth: parseFloat(((data.close - historicalData.quotes[0].close) / historicalData.quotes[0].close * 100).toFixed(2) || 0)
    })).reverse(); // Reverse to show oldest first

    res.json({
      symbol,
      period,
      data: transformedData,
      source: "Yahoo Finance",
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`HISTORICAL DATA ERROR for ${req.params.symbol}:`, error);
    res.status(500).json({ 
      message: "Failed to fetch historical data",
      error: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
    });
  }
});

/**
 * @route   GET /api/market/comprehensive/:symbol
 * @desc    Get comprehensive real market data including financial metrics
 * @param   symbol - Stock symbol (e.g., RELIANCE.NS)
 * @access  Public
 */
router.get("/comprehensive/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({ message: "Symbol is required" });
    }

    console.log(`Fetching comprehensive data for ${symbol}`);

    // Set timeout for the request
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 10000); // 10 second timeout
    });

    // Get comprehensive quote data with timeout
    const quotePromise = yf.quote(symbol, {}, { validateResult: false });
    
    const quote = await Promise.race([quotePromise, timeoutPromise]);

    if (!quote) {
      return res.status(404).json({ message: "No data found for this symbol" });
    }

    // Use quote data directly for most metrics
    const responseData = {
      symbol,
      currentPrice: quote?.regularMarketPrice || 0,
      change: quote?.regularMarketChange || 0,
      changePercent: quote?.regularMarketChangePercent || 0,
      positive: (quote?.regularMarketChange || 0) >= 0,
      volume: quote?.regularMarketVolume || 0,
      marketCap: quote?.marketCap || 0,
      
      // Real 52-week data from quote
      weekHigh52: quote?.fiftyTwoWeekHigh || 0,
      weekLow52: quote?.fiftyTwoWeekLow || 0,
      avgVolume: quote?.averageDailyVolume3Month || quote?.regularMarketVolume || 0,
      volatility: 0.2, // Default volatility
      beta: quote?.beta || 1.2,
      
      // Today's data
      dayHigh: quote?.regularMarketDayHigh || 0,
      dayLow: quote?.regularMarketDayLow || 0,
      dayOpen: quote?.regularMarketOpen || 0,
      
      // Real financial metrics from quote
      peRatio: quote?.trailingPE || null,
      eps: quote?.epsTrailingTwelveMonths || null,
      bookValue: quote?.bookValue || null,
      dividendYield: quote?.trailingAnnualDividendYield || null,
      dividendRate: quote?.trailingAnnualDividendRate || null,
      
      // Simple analysis based on available data
      riskLevel: 'Medium',
      recommendation: 'Hold',
      
      // Metadata
      source: "Yahoo Finance",
      lastUpdated: new Date().toISOString(),
      dataPoints: 1
    };

    // Determine risk level based on available data
    const yearChange = quote?.fiftyTwoWeekChangePercent || 0;
    if (yearChange > 10) {
      responseData.riskLevel = 'Low';
      responseData.recommendation = 'Buy';
    } else if (yearChange < -10) {
      responseData.riskLevel = 'High';
      responseData.recommendation = 'Sell';
    }

    res.json(responseData);
  } catch (error) {
    console.error(`COMPREHENSIVE DATA ERROR for ${req.params.symbol}:`, error.message);
    res.status(500).json({ 
      message: "Failed to fetch comprehensive data",
      error: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
    });
  }
});

/**
 * Helper function to get start date based on period
 */
function getPeriodStartDate(period) {
  const now = new Date();
  switch (period) {
    case "1d":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "5d":
      return new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    case "1mo":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "3mo":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "6mo":
      return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    case "1y":
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    case "2y":
      return new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
    case "5y":
      return new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
    case "10y":
      return new Date(now.getTime() - 10 * 365 * 24 * 60 * 60 * 1000);
    case "ytd":
      return new Date(now.getFullYear(), 0, 1); // Start of current year
    case "max":
    default:
      return new Date(now.getTime() - 10 * 365 * 24 * 60 * 60 * 1000); // Default to 10 years
  }
}

function getMarketEndTime() {
  const now = new Date();
  // If market is closed, set end time to 3:30 PM IST today
  const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const marketClose = new Date(istTime);
  marketClose.setHours(15, 30, 0, 0); // 3:30 PM
  
  // Convert back to UTC
  return new Date(marketClose.toLocaleString("en-US", { timeZone: "UTC" }));
}

/**
 * Helper function to get interval based on period
 */
function getIntervalForPeriod(period) {
  switch (period) {
    case "1d":
      return "1m";
    case "5d":
      return "5m";
    case "1mo":
      return "1d";
    case "3mo":
      return "1d";
    case "6mo":
      return "1d";
    case "1y":
      return "1wk";
    case "2y":
      return "1wk";
    case "5y":
      return "1mo";
    case "10y":
      return "1mo";
    case "ytd":
      return "1d";
    case "max":
    default:
      return "1d";
  }
}

export default router;
