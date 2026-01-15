import User from "../models/User.js";
import yahooFinance from "yahoo-finance2";
import { isMarketOpenServer } from "../utils/marketTime.js";
import Transaction from "../models/Transaction.js";

const yf = new yahooFinance();

/**
 * Handles stock purchase requests
 * Validates market hours, user balance, and updates holdings
 */
export const buyStock = async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);
    console.log("SYMBOL:", req.body.symbol);

    const { symbol, quantity } = req.body;
    const user = req.user;

    // Basic validation
    if (!symbol || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "Invalid input" });
    }

    // Fetch real stock price from Yahoo Finance
    let stock;
    try {
      const quote = await yf.quote(`${symbol}.NS`, {}, { validateResult: false });
      if (!quote || quote.regularMarketPrice == null) {
        return res.status(404).json({ message: "Stock not found or market data unavailable" });
      }
      
      stock = {
        symbol: symbol,
        price: quote.regularMarketPrice,
        name: quote.shortName || quote.displayName || symbol
      };
    } catch (error) {
      console.error(`Failed to fetch stock ${symbol}:`, error.message);
      return res.status(404).json({ message: "Stock not found or market data unavailable" });
    }

    // Check if market is open
    if (!isMarketOpenServer()) {
      return res.status(403).json({
        message: "Market is closed. Orders allowed only during market hours."
      });
    }

    const totalCost = stock.price * quantity;

    // Check user balance
    if (user.balance < totalCost) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // handle holdings
    const holdingIndex = user.holdings.findIndex(
      h => h.stockSymbol === symbol
    );

    if (holdingIndex > -1) {
    // Handle existing holdings - update average price
    const holding = user.holdings[holdingIndex];

    const newQuantity = holding.quantity + quantity;
    const newAvgPrice =
      ((holding.avgPrice * holding.quantity) +
        (stock.price * quantity)) / newQuantity;

    user.holdings[holdingIndex].quantity = newQuantity;
    user.holdings[holdingIndex].avgPrice = newAvgPrice;
  } else {
    // New holding - add to portfolio
    user.holdings.push({
      stockSymbol: symbol,
      quantity,
      avgPrice: stock.price
    });
  }

  // Deduct balance and save
  user.balance -= totalCost;
  await user.save();

  // Create transaction record
  await Transaction.create({
    user: user._id,
    type: "BUY",
    symbol,
    quantity,
    price: stock.price,
    amount: totalCost
  });

  res.status(200).json({
    message: "Stock bought successfully",
    balance: user.balance,
    holdings: user.holdings
  });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/**
 * Handles stock sale requests
 * Validates ownership, quantity, and updates holdings
 */
export const sellStock = async (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    const user = req.user;

    // Basic validation
    if (!symbol || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "Invalid input" });
    }

    // Fetch real stock price from Yahoo Finance
    let stock;
    try {
      const quote = await yf.quote(`${symbol}.NS`, {}, { validateResult: false });
      if (!quote || quote.regularMarketPrice == null) {
        return res.status(404).json({ message: "Stock not found or market data unavailable" });
      }
      
      stock = {
        symbol: symbol,
        price: quote.regularMarketPrice,
        name: quote.shortName || quote.displayName || symbol
      };
    } catch (error) {
      console.error(`Failed to fetch stock ${symbol}:`, error.message);
      return res.status(404).json({ message: "Stock not found or market data unavailable" });
    }

    // Check if market is open
    if (!isMarketOpenServer()) {
      return res.status(403).json({
        message: "Market is closed. Orders allowed only during market hours."
      });
    }

    // Find user's holding
    const holdingIndex = user.holdings.findIndex(
      h => h.stockSymbol === symbol
    );

    if (holdingIndex === -1) {
      return res.status(400).json({ message: "You do not own this stock" });
    }

    const holding = user.holdings[holdingIndex];

    // Check if user has enough quantity to sell
    if (holding.quantity < quantity) {
      return res.status(400).json({ message: "Not enough quantity to sell" });
    }

    // Calculate sell value
    const sellValue = stock.price * quantity;

    // Update holding quantity
    holding.quantity -= quantity;

    // Remove holding if quantity becomes 0
    if (holding.quantity === 0) {
      user.holdings.splice(holdingIndex, 1);
    }

    // Credit balance and save
    user.balance += sellValue;
    await user.save();

    // Create transaction record
    await Transaction.create({
      user: user._id,
      type: "SELL",
      symbol,
      quantity,
      price: stock.price,
      amount: sellValue
    });

    res.status(200).json({
      message: "Stock sold successfully",
      balance: user.balance,
      holdings: user.holdings
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
