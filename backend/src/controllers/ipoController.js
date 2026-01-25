import { IPO_DATA, refreshIPOData } from "../utils/ipos/index.js";
import Transaction from "../models/Transaction.js";
import { resetIPOState } from "../utils/ipos/rotationEngine.js";
import { 
  processAcceleratedIPOApplication, 
  canWithdrawMoney, 
  getIPOTimeline,
  getUserAcceleratedIPOs,
  TIMELINE,
  initializeExistingApplications
} from "../utils/ipos/acceleratedAllotment.js";

/**
 * Force refresh IPO state
 * @route GET /api/ipo/refresh
 * @access Private
 */
export const forceRefreshIPOs = async (req, res) => {
  resetIPOState(); // Clear the cache
  const freshIPOData = refreshIPOData(); // Get fresh data
  res.json({
    message: "IPO state forcefully refreshed",
    open: freshIPOData.open.length,
    upcoming: freshIPOData.upcoming.length,
    closed: freshIPOData.closed.length
  });
};

/**
 * Debug endpoint to check current date
 * @route GET /api/ipo/debug
 * @access Private
 */
export const debugDate = async (req, res) => {
  const now = new Date();
  const systemDate = now.toISOString().split("T")[0];
  const systemTime = now.toISOString();
  const localDate = now.toLocaleDateString('en-CA'); // YYYY-MM-DD format
  const localTime = now.toLocaleString();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timezoneOffset = now.getTimezoneOffset();
  
  res.json({
    systemDate,
    systemTime,
    localDate,
    localTime,
    timezone,
    timezoneOffset,
    rawNow: now.toString(),
    message: "Debug info for IPO date calculation"
  });
};

/**
 * Initialize existing applications into accelerated system
 * @route POST /api/ipo/initialize-accelerated
 * @access Private
 */
export const initializeAcceleratedIPOs = async (req, res) => {
  try {
    console.log('🚀 Backend: Received initialize-accelerated request');
    console.log('📥 Request body:', req.body);
    console.log('👤 User ID:', req.user._id);
    
    const { applications } = req.body;
    const userId = req.user._id;
    
    console.log(`🚀 Initializing ${applications.length} applications for user ${userId}`);
    
    const result = initializeExistingApplications(applications);
    
    console.log('📊 Initialization result:', result);
    
    res.json({
      message: result.message,
      initialized: result.initialized,
      applications: applications.map(app => app.ipoSymbol)
    });
  } catch (error) {
    console.error("Failed to initialize accelerated IPOs:", error);
    res.status(500).json({ 
      message: "Failed to initialize accelerated IPOs",
      error: error.message 
    });
  }
};

/**
 * Check if user can withdraw money from IPO
 * @route GET /api/ipo/withdraw-eligibility/:symbol
 * @access Private
 */
export const checkWithdrawEligibility = async (req, res) => {
  try {
    const { symbol } = req.params;
    const userId = req.user._id;
    
    const eligibility = canWithdrawMoney(symbol, userId);
    
    res.json({
      symbol,
      canWithdraw: eligibility.canWithdraw,
      reason: eligibility.reason,
      userId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get IPO timeline for a specific IPO
 * @route GET /api/ipo/timeline/:symbol
 * @access Private
 */
export const getIPOTimelineStatus = async (req, res) => {
  try {
    const { symbol } = req.params;
    const userId = req.user._id;
    
    const timeline = getIPOTimeline(symbol);
    
    if (!timeline) {
      return res.status(404).json({ message: "IPO timeline not found" });
    }
    
    // Only return timeline if it belongs to the user
    const userIPOs = getUserAcceleratedIPOs(userId);
    const userTimeline = userIPOs.find(ipo => ipo.symbol === symbol);
    
    if (!userTimeline) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    res.json(timeline);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all accelerated IPOs for the user
 * @route GET /api/ipo/my-accelerated-ipos
 * @access Private
 */
export const getMyAcceleratedIPOs = async (req, res) => {
  try {
    const userId = req.user._id;
    const userIPOs = getUserAcceleratedIPOs(userId);
    
    res.json({
      acceleratedIPOs: userIPOs,
      count: userIPOs.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Withdraw money from IPO (if eligible)
 * @route POST /api/ipo/withdraw/:symbol
 * @access Private
 */
export const withdrawIPOFunds = async (req, res) => {
  try {
    const { symbol } = req.params;
    const userId = req.user._id;
    
    const eligibility = canWithdrawMoney(symbol, userId);
    
    if (!eligibility.canWithdraw) {
      return res.status(400).json({ 
        message: "Cannot withdraw funds", 
        reason: eligibility.reason 
      });
    }
    
    // Get the IPO details (may be null if not in accelerated system)
    const timeline = getIPOTimeline(symbol);
    
    // Find the actual IPO application to get the amount
    const IPOAllotment = require('../models/IPOAllotment.js').default;
    const User = require('../models/User.js').default;
    const Transaction = require('../models/Transaction.js').default;
    
    const application = await IPOAllotment.findOne({
      ipoSymbol: symbol,
      user: userId,
      isWithdrawn: false
    });
    
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    
    // Refund the blocked amount to user's wallet
    const user = await User.findById(userId);
    const refundAmount = application.amountApplied;
    
    user.balance += refundAmount;
    await user.save();
    
    // Create refund transaction
    await Transaction.create({
      user: userId,
      type: "IPO_WITHDRAWAL",
      symbol: symbol,
      quantity: application.sharesApplied,
      price: application.amountApplied / application.sharesApplied,
      amount: refundAmount,
      description: `IPO application withdrawal for ${application.ipoName}`
    });
    
    // Mark application as withdrawn
    await IPOAllotment.findByIdAndUpdate(application._id, {
      status: 'refunded',
      refundAmount: refundAmount,
      isWithdrawn: true,
      withdrawalDate: new Date()
    });
    
    res.json({
      message: "Funds withdrawal processed successfully",
      symbol,
      reason: eligibility.reason,
      amount: refundAmount,
      balance: user.balance
    });
  } catch (error) {
    console.error("Withdrawal error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Instant IPO processing - no countdown
 * @route POST /api/ipo/instant-process
 * @access Private
 */
export const instantProcessIPO = async (req, res) => {
  try {
    const { applicationId, symbol, isAllotted, listingPrice, sharesApplied, amountApplied, issuePrice } = req.body;
    const userId = req.user._id;
    
    console.log(`🎯 Instant processing IPO: ${symbol} for user ${userId}`);
    console.log(`📊 Allotment result: ${isAllotted ? 'Allotted' : 'Not Allotted'}`);
    console.log(`📋 Application ID: ${applicationId}`);
    
    // Find the application
    const IPOAllotment = require('../models/IPOAllotment.js').default;
    const application = await IPOAllotment.findOne({
      _id: applicationId,
      user: userId,
      ipoSymbol: symbol
    });
    
    if (!application) {
      console.log(`❌ Application not found for ID: ${applicationId}, symbol: ${symbol}, user: ${userId}`);
      return res.status(404).json({ message: "Application not found" });
    }
    
    console.log(`✅ Found application: ${application.ipoSymbol}, current status: ${application.status}`);
    
    const now = new Date();
    let updateData = {
      status: isAllotted ? 'allotted' : 'not_allotted',
      allotmentDate: now,
      updatedAt: now
    };
    
    if (isAllotted) {
      // Allotted case
      updateData.sharesAllotted = sharesApplied;
      updateData.amountAllotted = amountApplied;
      updateData.refundAmount = 0;
      updateData.listingDate = now;
      updateData.listingPrice = listingPrice;
      
      // Calculate profit/loss
      const profitPerShare = listingPrice - issuePrice;
      const totalProfit = profitPerShare * sharesApplied;
      const profitPercentage = ((profitPerShare / issuePrice) * 100);
      
      updateData.profitLoss = totalProfit;
      updateData.profitLossPercentage = profitPercentage;
      
      console.log(`💰 ${symbol}: Allotted ${sharesApplied} shares at ₹${issuePrice}`);
      console.log(`📈 ${symbol}: Listed at ₹${listingPrice}, P&L: ₹${totalProfit} (${profitPercentage.toFixed(2)}%)`);
    } else {
      // Not allotted case
      updateData.sharesAllotted = 0;
      updateData.amountAllotted = 0;
      updateData.refundAmount = amountApplied;
      
      console.log(`💸 ${symbol}: Not allotted - refund ₹${amountApplied}`);
    }
    
    console.log(`🔄 Updating database with:`, updateData);
    
    // Update the application
    const updatedApplication = await IPOAllotment.findByIdAndUpdate(applicationId, updateData, { new: true });
    
    console.log(`✅ Database updated successfully for ${symbol}`);
    console.log(`📋 New status: ${updatedApplication.status}`);
    
    res.json({
      message: `IPO processed successfully`,
      symbol,
      status: updatedApplication.status,
      isAllotted,
      listingPrice,
      profitLoss: updateData.profitLoss || 0,
      profitLossPercentage: updateData.profitLossPercentage || 0
    });
    
  } catch (error) {
    console.error("Instant IPO processing error:", error);
    res.status(500).json({ message: error.message });
  }
};
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

    console.log(`🎯 IPO Application Request: symbol=${symbol}, amount=${amount}, user=${user?._id}`);

    // Basic input validation
    if (!symbol || !amount || amount <= 0) {
      console.log(`❌ Invalid input: symbol=${symbol}, amount=${amount}`);
      return res.status(400).json({ message: "Invalid input" });
    }

    // Get fresh IPO data based on current date
    const freshIPOData = refreshIPOData();
    
    // Find IPO by symbol in currently open IPOs
    const ipo = freshIPOData.open.find((i) => i.symbol === symbol);
    if (!ipo) {
      console.log(`❌ IPO not found or not open: ${symbol}`);
      return res.status(404).json({ message: "IPO not found or not currently open" });
    }

    console.log(`✅ IPO found: ${ipo.name}, checking user balance...`);

    // Check access for internal IPOs (founder role required)
    if (ipo.isInternal && user.role !== "founder") {
      console.log(`❌ Access denied for internal IPO: user role=${user.role}`);
      return res.status(403).json({ message: "Access denied" });
    }

    // Check user balance
    if (user.balance < amount) {
      console.log(`❌ Insufficient balance: user.balance=${user.balance}, amount=${amount}`);
      return res.status(400).json({ message: "Insufficient balance" });
    }

    console.log(`✅ Balance sufficient, processing accelerated application...`);

    // Process accelerated IPO application
    const applicationResult = processAcceleratedIPOApplication(symbol, user, amount);
    console.log(`✅ Accelerated application processed:`, applicationResult);

    // Update user balance (block funds)
    const oldBalance = user.balance;
    user.balance = user.balance - amount;
    await user.save();
    console.log(`💰 Balance updated: ${oldBalance} → ${user.balance}`);

    // Create transaction record
    const transaction = await Transaction.create({
      user: user._id,
      type: "IPO",
      symbol: symbol,
      quantity: 1,
      price: amount,
      amount: amount,
      status: "pending"
    });
    console.log(`📝 Transaction created: ${transaction._id}`);

    // Return success response with accelerated timeline
    res.status(200).json({
      message: "IPO application submitted with accelerated timeline",
      symbol,
      amount,
      balance: user.balance,
      timeline: applicationResult.timeline,
      accelerated: true,
      nextSteps: {
        allotmentIn: `${TIMELINE.ALLOTMENT_AFTER_MINUTES} minute(s)`,
        listingIn: `${TIMELINE.ALLOTMENT_AFTER_MINUTES + TIMELINE.LISTING_AFTER_ALLOTMENT_MINUTES} minute(s)`,
        autoCloseIn: `${TIMELINE.ALLOTMENT_AFTER_MINUTES + TIMELINE.LISTING_AFTER_ALLOTMENT_MINUTES + TIMELINE.AUTO_CLOSE_AFTER_LISTING_MINUTES} minute(s)`
      }
    });
  } catch (error) {
    console.error("❌ Error in accelerated IPO application:", error);
    res.status(500).json({ message: error.message });
  }
};
