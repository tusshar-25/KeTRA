import { IPO_DATA, refreshIPOData } from "../utils/ipos/index.js";
import Transaction from "../models/Transaction.js";

/**
 * Get list of IPOs with optional status filter
 * @route GET /api/ipo
 * @access Private
 */
export const getIPOs = async (req, res) => {
  const { status } = req.query; // Filter by status: open, upcoming, closed

  // Get fresh IPO data based on current date
  const freshIPOData = refreshIPOData();
  
  let list = freshIPOData.all;

  // Apply status filter if provided
  if (status) {
    list = freshIPOData[status] || [];
  }

  res.json(list);
};

/**
 * Handle IPO subscription applications
 * Validates user balance, IPO status, and updates blocked funds
 * @route POST /api/ipo/apply
 * @access Private
 */
export const applyIPO = async (req, res) => {
  try {
    const { symbol, amount } = req.body;
    const user = req.user;

    // Basic input validation
    if (!symbol || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid input" });
    }

    // Get fresh IPO data based on current date
    const freshIPOData = refreshIPOData();
    
    // Find IPO by symbol in currently open IPOs
    const ipo = freshIPOData.open.find((i) => i.symbol === symbol);
    if (!ipo) {
      return res.status(404).json({ message: "IPO not found or not currently open" });
    }

    // Check access for internal IPOs (founder role required)
    if (ipo.isInternal && user.role !== "founder") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check user balance
    if (user.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Calculate credited amount (standard amount, no special multiplier)
    let creditedAmount = amount;

    // Update user balance and block funds for IPO
    user.balance = user.balance - amount; // ✅ FIXED: Don't add creditedAmount back
    await user.save();

    // Create transaction record
    await Transaction.create({
      user: user._id,
      type: "IPO",
      symbol: symbol,
      quantity: 1,
      price: amount,
      amount: creditedAmount,
    });

    // Return success response
    res.status(200).json({
      message: "IPO applied successfully",
      invested: amount,
      credited: creditedAmount,
      balance: user.balance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
