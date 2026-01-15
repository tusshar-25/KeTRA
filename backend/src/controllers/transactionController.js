import Transaction from "../models/Transaction.js";

/**
 * Get all transactions for the authenticated user
 * @route GET /api/transactions
 * @access Private
 */
export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50 transactions

    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get transaction summary statistics
 * @route GET /api/transactions/summary
 * @access Private
 */
export const getTransactionSummary = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id });
    
    const summary = {
      totalTransactions: transactions.length,
      buyTransactions: transactions.filter(t => t.type === 'BUY').length,
      sellTransactions: transactions.filter(t => t.type === 'SELL').length,
      ipoTransactions: transactions.filter(t => t.type === 'IPO').length,
      totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
    };

    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
