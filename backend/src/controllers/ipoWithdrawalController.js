import IPOHolding from "../models/IPOHolding.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

/**
 * Withdraw IPO holdings (with password confirmation)
 * @route POST /api/portfolio/ipo-withdraw
 * @access Private
 */
export const withdrawIPOHolding = async (req, res) => {
  try {
    const { holdingId, password } = req.body;
    const user = req.user;

    // Basic validation
    if (!holdingId || !password) {
      return res.status(400).json({ message: "Holding ID and password required" });
    }

    // Verify user password (for security)
    if (password !== user.password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Find IPO holding
    const holding = await IPOHolding.findOne({
      _id: holdingId,
      user: user._id,
      status: { $in: ['allotted', 'listed'] }
    });

    if (!holding) {
      return res.status(404).json({ message: "IPO holding not found" });
    }

    if (holding.isWithdrawn) {
      return res.status(400).json({ message: "Holding already withdrawn" });
    }

    // CALCULATE WITHDRAWAL AMOUNT
    let withdrawalAmount;
    
    if (holding.status === 'listed' && holding.listingPrice) {
      const currentValue = holding.sharesAllotted * holding.listingPrice;
      const investedValue = holding.totalInvestment;
      const profitLoss = currentValue - investedValue;
      
      if (profitLoss >= 0) {
        // PROFIT: Return full investment + current market value
        withdrawalAmount = investedValue + currentValue;
        console.log(`💰 Profit Scenario: Investment ₹${investedValue} + Market Value ₹${currentValue} = ₹${withdrawalAmount}`);
      } else {
        // LOSS: Apply 10% cap on investment
        const maxAllowedLoss = investedValue * 0.10;
        withdrawalAmount = investedValue - maxAllowedLoss;
        console.log(`🛡️ Loss Scenario: Investment ₹${investedValue} - Max Loss ₹${maxAllowedLoss} = ₹${withdrawalAmount}`);
      }
    } else {
      // If not listed yet - return full blocked amount
      withdrawalAmount = holding.totalInvestment;
      console.log(`⏳ Not Listed: Returning full investment ₹${withdrawalAmount}`);
    }

    // Add withdrawal amount back to user balance
    const userRecord = await User.findById(user._id);
    userRecord.balance += withdrawalAmount;
    await userRecord.save();

    // Create withdrawal transaction
    await Transaction.create({
      user: user._id,
      type: "IPO_SALE",
      symbol: holding.ipoSymbol,
      quantity: holding.sharesAllotted,
      price: holding.listingPrice || holding.allotmentPrice,
      amount: withdrawalAmount,
      description: `IPO holding withdrawal for ${holding.sharesAllotted} shares of ${holding.ipoName}`
    });

    // Mark holding as withdrawn
    await IPOHolding.findByIdAndUpdate(holdingId, {
      status: 'sold',
      isWithdrawn: true,
      withdrawalDate: new Date()
    });

    res.status(200).json({
      message: "IPO holding withdrawn successfully",
      withdrawalAmount: withdrawalAmount,
      originalInvestment: holding.totalInvestment,
      profitLoss: holding.profitLoss || 0,
      profitLossPercentage: holding.profitLossPercentage || 0,
      lossCapApplied: (holding.profitLoss || 0) === -2000 ? 'YES' : 'NO',
      balance: userRecord.balance,
      holding: {
        ipoName: holding.ipoName,
        ipoSymbol: holding.ipoSymbol,
        sharesWithdrawn: holding.sharesAllotted,
        amountReceived: withdrawalAmount,
        originalInvestment: holding.totalInvestment,
        profitLoss: holding.profitLoss || 0,
        profitLossPercentage: holding.profitLossPercentage || 0,
        status: holding.status
      }
    });
  } catch (error) {
    console.error("WITHDRAW IPO HOLDING ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get IPO holding details
 * @route GET /api/portfolio/ipo-holding/:holdingId
 * @access Private
 */
export const getIPOHoldingDetails = async (req, res) => {
  try {
    const { holdingId } = req.params;
    const user = req.user;

    const holding = await IPOHolding.findOne({
      _id: holdingId,
      user: user._id
    });

    if (!holding) {
      return res.status(404).json({ message: "IPO holding not found" });
    }

    res.json({
      holding: {
        id: holding._id,
        ipoId: holding.ipoId,
        ipoName: holding.ipoName,
        ipoSymbol: holding.ipoSymbol,
        sharesAllotted: holding.sharesAllotted,
        allotmentPrice: holding.allotmentPrice,
        totalInvestment: holding.totalInvestment,
        listingPrice: holding.listingPrice,
        currentValue: holding.listingPrice ? (holding.sharesAllotted * holding.listingPrice) : holding.totalInvestment,
        profitLoss: holding.profitLoss,
        profitLossPercentage: holding.profitLossPercentage,
        status: holding.status,
        allotmentDate: holding.allotmentDate,
        listingDate: holding.listingDate,
        isWithdrawn: holding.isWithdrawn,
        withdrawalDate: holding.withdrawalDate
      }
    });
  } catch (error) {
    console.error("GET IPO HOLDING DETAILS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
