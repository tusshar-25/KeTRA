import express from "express";
import yahooFinance from "yahoo-finance2";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Portfolio from "../models/Portfolio.js";
import jwt from "jsonwebtoken";

const router = express.Router();
const yf = new yahooFinance();

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
        "TITAN.NS",
        "NTPC.NS",
        "ULTRACEMCO.NS",
        "BAJFINANCE.NS",
        "ADANIPORTS.NS",
        "POWERGRID.NS",
        "WIPRO.NS",
        "GRASIM.NS",
        "JSWSTEEL.NS",
        "BPCL.NS",
        "CIPLA.NS",
        "COALINDIA.NS",
        "BRITANNIA.NS",
        "HEROMOTOCO.NS",
        "DRREDDY.NS",
        "UPL.NS",
        "DIVISLAB.NS",
        "EICHERMOT.NS",
        "APOLLOHOSP.NS",
        "NESTLEIND.NS",
        "TATAMOTORS.NS",
        "SHREECEM.NS",
        "HINDALCO.NS",
        "TATASTEEL.NS",
        "VEDL.NS",
        "IOC.NS",
        "GAIL.NS",
        "ZOMATO.NS",
        "PAYTM.NS",
        "NYKAA.NS",
        "POLYMED.NS",
        "AUBANK.NS",
        "IDFCFIRSTB.NS",
        "FEDERALBNK.NS",
        "INDUSINDBK.NS",
        "PNB.NS",
        "BANKBARODA.NS",
        "CANBK.NS",
        "UNIONBANK.NS",
        "INDIGO.NS",
        "DABUR.NS",
        "GODREJCP.NS",
        "TATACONSUM.NS",
        "BERGEPAINT.NS",
        "ASIANPAINT.NS"
      ];

    const results = [];

    for (const symbol of symbols) {
      try {
        const q = await yf.quote(
          symbol,
          {},
          { validateResult: false }
        );

        if (!q || q.regularMarketPrice == null) continue;

        results.push({
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
        });
      } catch (err) {
        console.error(`Stock fetch failed: ${symbol}`, err.message);
      }
    }

    res.json({
      stocks: results,
      delayed: true,
      source: "Yahoo Finance",
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("STOCK ROUTE CRASH:", error);
    res.status(500).json({ message: "Stock service unavailable" });
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
        "RATNAMANI.NS",
        "TIMKEN.NS",
        "SCHAEFFLER.NS",
        "NBC.NS",
        "BASF.NS",
        "KSB.NS",
        "WABAG.NS",
        "THERMAX.NS",
        "PRAJIND.NS",
        "DCMSHRIRAM.NS",
        "EPL.NS",
        "UCOBANK.NS",
        "J&KBANK.NS",
        "FEDERALBNK.NS",
        "KARURVYSYA.NS",
        "SOUTHBANK.NS",
        "JAMNAAUTO.NS",
        "MOTHERSON.NS",
        "SUPRAJIT.NS",
        "MUNJALSHOW.NS",
        "SAML.NS",
        "GUFICBIO.NS",
        "LAXMICHML.NS",
        "TORNTPOWER.NS",
        "CESC.NS",
        "TATAPOWER.NS",
        "JSWENERGY.NS",
        "ADANIGREEN.NS",
        "SOLARINDS.NS",
        "SWELECTES.NS",
        "SUZLON.NS",
        "RENUKA.NS",
        "BALKRISHNA.NS",
        "ANRAJ.NS",
        "BOMDIA.NS",
        "GRINDWELL.NS",
        "CARBORUNIV.NS",
        "HIKAL.NS",
        "AIAENGINEER.NS",
        "PNCINFRA.NS",
        "MANINFRA.NS",
        "NCC.NS",
        "HCC.NS",
        "IVRCL.NS",
        "GMRINFRA.NS",
        "Lanco.NS",
        "JPPOWER.NS"
      ];

    const results = [];

    for (const symbol of symbols) {
      try {
        const q = await yf.quote(
          symbol,
          {},
          { validateResult: false }
        );

        if (!q || q.regularMarketPrice == null) continue;

        results.push({
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
        });
      } catch (err) {
        console.error(`SME stock fetch failed: ${symbol}`, err.message);
      }
    }

    res.json({
      stocks: results,
      delayed: true,
      source: "Yahoo Finance",
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("SME STOCK ROUTE CRASH:", error);
    res.status(500).json({ message: "SME stock service unavailable" });
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
    
    if (!symbol || !quantity || !price) {
      return res.status(400).json({ message: "Symbol, quantity, and price are required" });
    }

    const totalCost = parseFloat(price) * parseInt(quantity);
    
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
      price: parseFloat(price),
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
      existingHolding.currentPrice = parseFloat(price);
      existingHolding.currentValue = newQuantity * parseFloat(price);
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
        avgPrice: parseFloat(price),
        currentPrice: parseFloat(price),
        currentValue: totalCost,
        investedValue: totalCost,
        pnl: 0,
        pnlPercent: 0,
        type: "REGULAR"
      });
      console.log(`Created new holding:`, newHolding);
    }

    console.log(`Buy order executed: ${quantity} ${symbol} @ ${price}, Balance: ₹${user.balance}`);
    
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
    
    if (!symbol || !quantity || !price) {
      return res.status(400).json({ message: "Symbol, quantity, and price are required" });
    }

    const symbolUpper = symbol.toUpperCase();
    const sellQuantity = parseInt(quantity);
    const totalProceeds = parseFloat(price) * sellQuantity;
    
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
      price: parseFloat(price),
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
      holding.currentPrice = parseFloat(price);
      holding.currentValue = remainingQuantity * parseFloat(price);
      holding.investedValue = newInvestedValue;
      holding.pnl = holding.currentValue - holding.investedValue;
      holding.pnlPercent = (holding.pnl / holding.investedValue) * 100;
      
      await holding.save();
    }

    console.log(`Sell order executed: ${sellQuantity} ${symbol} @ ${price}, Balance: ₹${user.balance}`);
    
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

export default router;
