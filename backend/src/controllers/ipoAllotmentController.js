import IPOAllotment from "../models/IPOAllotment.js";
import IPOHolding from "../models/IPOHolding.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import { refreshIPOData } from "../utils/ipos/index.js";

/**
 * Instant IPO process for immediate allotment and listing
 * @route POST /api/ipo/instant-process
 * @access Private
 */
export const instantIPOProcess = async (req, res) => {
  try {
    const { applicationId, symbol, isAllotted, listingPrice, sharesApplied, amountApplied, issuePrice } = req.body;
    const user = req.user;

    // Find the application
    const application = await IPOAllotment.findOne({
      _id: applicationId,
      user: user._id
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (isAllotted) {
      // Process allotment
      const profitPerShare = listingPrice - issuePrice;
      const totalProfit = profitPerShare * sharesApplied;
      const profitPercentage = ((profitPerShare / issuePrice) * 100).toFixed(2);
      
      // Update application with allotment details
      await IPOAllotment.findByIdAndUpdate(applicationId, {
        sharesAllotted: sharesApplied,
        amountAllotted: amountApplied,
        listingPrice: listingPrice,
        profitLoss: totalProfit,
        profitLossPercentage: parseFloat(profitPercentage),
        status: 'allotted',
        allotmentDate: new Date(),
        listingDate: new Date()
      });

      // Create IPO holding
      await IPOHolding.create({
        user: user._id,
        ipoId: application.ipoId,
        ipoSymbol: symbol,
        ipoName: application.ipoName,
        applicationId: application._id,
        sharesAllotted: sharesApplied,
        sharesApplied: sharesApplied,
        allotmentPrice: issuePrice,
        totalInvestment: amountApplied,
        blockedAmount: amountApplied,
        listingPrice: listingPrice,
        currentValue: sharesApplied * listingPrice,
        profitLoss: totalProfit,
        profitLossPercentage: parseFloat(profitPercentage),
        status: 'listed',
        allotmentDate: new Date(),
        listingDate: new Date()
      });

      res.status(200).json({
        message: "IPO instantly allotted and listed",
        status: 'allotted',
        sharesAllotted: sharesApplied,
        listingPrice: listingPrice,
        profitLoss: totalProfit,
        profitLossPercentage: parseFloat(profitPercentage)
      });
    } else {
      // Process non-allotment
      await IPOAllotment.findByIdAndUpdate(applicationId, {
        sharesAllotted: 0,
        amountAllotted: 0,
        refundAmount: amountApplied,
        status: 'not_allotted',
        allotmentDate: new Date()
      });

      res.status(200).json({
        message: "IPO not allotted",
        status: 'not_allotted',
        refundAmount: amountApplied
      });
    }
  } catch (error) {
    console.error("INSTANT IPO PROCESS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Apply for IPO with proper allotment tracking
 * @route POST /api/ipo/apply
 * @access Private
 */
export const applyIPO = async (req, res) => {
  try {
    const { symbol, amount, shares } = req.body;
    const user = req.user;

    // Basic input validation
    if (!symbol || !amount || amount <= 0 || !shares || shares <= 0) {
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

    // Check if user already applied for this IPO
    const existingApplication = await IPOAllotment.findOne({
      user: user._id,
      ipoSymbol: symbol,
      status: { $in: ['pending', 'allotted'] }
    });

    if (existingApplication) {
      return res.status(400).json({ message: "You have already applied for this IPO" });
    }

    // Block funds from user balance (don't deduct yet, just block)
    user.balance = user.balance - amount;
    await user.save();

    // Create IPO allotment record
    const allotment = await IPOAllotment.create({
      user: user._id,
      ipoId: ipo.id,
      ipoSymbol: symbol,
      ipoName: ipo.name,
      amountApplied: amount,
      sharesApplied: shares,
      status: 'pending',
      applicationDate: new Date()
    });

    // Create transaction record for blocked funds
    await Transaction.create({
      user: user._id,
      type: "IPO_BLOCKED",
      symbol: symbol,
      quantity: shares,
      price: ipo.issuePrice,
      amount: amount,
      description: `IPO application blocked for ${shares} shares of ${ipo.name}`
    });

    // Return success response
    res.status(200).json({
      message: "IPO application submitted successfully",
      applicationId: allotment._id,
      amountBlocked: amount,
      balance: user.balance,
      ipoDetails: {
        name: ipo.name,
        symbol: symbol,
        openDate: ipo.openDate,
        closeDate: ipo.closeDate
      }
    });
  } catch (error) {
    console.error("IPO APPLICATION ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get user's IPO applications and allotments
 * @route GET /api/ipo/applications
 * @access Private
 */
export const getIPOApplications = async (req, res) => {
  try {
    const user = req.user;
    
    const applications = await IPOAllotment.find({ user: user._id })
      .sort({ applicationDate: -1 });

    res.json({
      applications: applications.map(app => ({
        id: app._id,
        ipoId: app.ipoId,
        ipoName: app.ipoName,
        ipoSymbol: app.ipoSymbol,
        amountApplied: app.amountApplied,
        sharesApplied: app.sharesApplied,
        sharesAllotted: app.sharesAllotted,
        amountAllotted: app.amountAllotted,
        refundAmount: app.refundAmount,
        status: app.status,
        applicationDate: app.applicationDate,
        allotmentDate: app.allotmentDate,
        listingDate: app.listingDate,
        listingPrice: app.listingPrice,
        profitLoss: app.profitLoss,
        profitLossPercentage: app.profitLossPercentage,
        isWithdrawn: app.isWithdrawn,
        withdrawalDate: app.withdrawalDate
      })),
      total: applications.length
    });
  } catch (error) {
    console.error("GET IPO APPLICATIONS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Auto-process IPO allotments for closed IPOs
 * This function can be called to automatically process allotments for IPOs that have closed
 * @route POST /api/ipo/auto-process-allotments
 * @access Private (Admin only)
 */
export const autoProcessAllotments = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const freshIPOData = refreshIPOData();
    
    console.log(`🔄 Processing IPO allotments for today: ${today}`);
    console.log(`📊 Available IPOs: ${freshIPOData.all.length} total`);
    
    // Find IPOs that should be processed today (day after closing OR listing date is today)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // Process IPOs that closed yesterday OR have listing date today
    const iposToProcess = freshIPOData.all.filter(ipo => 
      ipo.closeDate === yesterdayStr || ipo.listingDate === today
    );
    
    console.log(`📋 IPOs to process today: ${iposToProcess.length}`);
    console.log(`📋 IPOs: ${iposToProcess.map(i => `${i.name} (${i.symbol}) - Close: ${i.closeDate}, List: ${i.listingDate}`).join(', ')}`);
    
    let totalProcessed = 0;
    for (const ipo of iposToProcess) {
      // Get all pending applications for this IPO
      const pendingApplications = await IPOAllotment.find({
        ipoSymbol: ipo.symbol,
        status: 'pending'
      });

      console.log(`📄 Found ${pendingApplications.length} pending applications for ${ipo.name}`);

      if (pendingApplications.length === 0) {
        console.log(`⚠️ No pending applications for ${ipo.name}, skipping...`);
        continue;
      }

      // Process allotments for this IPO
      let processedCount = 0;
      for (const application of pendingApplications) {
        const allotmentRatio = Math.random() * 0.3 + 0.1; // 10% to 40% allotment ratio
        const sharesAllotted = Math.floor(application.sharesApplied * allotmentRatio);
        const amountAllotted = sharesAllotted * ipo.issuePrice;
        
        const refundAmount = application.amountApplied - amountAllotted; // Refund unallotted amount

        // Calculate dates: 1 day after close for allotment, listing on same day as allotment
        const closeDate = new Date(ipo.closeDate);
        const allotmentDate = new Date(closeDate);
        allotmentDate.setDate(closeDate.getDate() + 1); // 1 day after CLOSE DATE
        
        const listingDate = new Date(allotmentDate); // SAME DAY as allotment

        console.log(`📝 Processing application for ${ipo.name}: ${application.sharesApplied} shares → ${sharesAllotted} allotted`);

        // Update allotment record
        await IPOAllotment.findByIdAndUpdate(application._id, {
          sharesAllotted,
          amountAllotted,
          refundAmount,
          status: 'allotted',
          allotmentDate,
          listingDate
        });

        // CREATE IPO HOLDING
        await IPOHolding.create({
          user: application.user,
          ipoId: ipo.id || application._id, // Use IPO id or fallback to application id
          ipoSymbol: ipo.symbol,
          ipoName: ipo.name,
          applicationId: application._id,
          sharesAllotted,
          allotmentPrice: ipo.issuePrice,
          totalInvestment: amountAllotted,
          listingPrice: ipo.actualListingPrice || (ipo.issuePrice * 1.1), // Use actual listing price or estimate
          currentValue: sharesAllotted * (ipo.actualListingPrice || (ipo.issuePrice * 1.1)),
          profitLoss: sharesAllotted * ((ipo.actualListingPrice || (ipo.issuePrice * 1.1)) - ipo.issuePrice),
          profitLossPercentage: ((ipo.actualListingPrice || (ipo.issuePrice * 1.1)) / ipo.issuePrice - 1) * 100,
          status: 'allotted',
          allotmentDate,
          listingDate
        });

        processedCount++;
        totalProcessed++;
        console.log(`✅ Processed allotment for ${ipo.name}: ${sharesAllotted} shares allotted, ₹${amountAllotted} invested`);
      }
    }

    res.status(200).json({
      message: `Auto-processed ${totalProcessed} IPO allotments successfully`,
      processed: totalProcessed,
      date: today
    });
  } catch (error) {
    console.error("AUTO PROCESS ALLOTMENTS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Process IPO allotments (when IPO closes)
 * @route POST /api/ipo/process-allotments
 * @access Private (Admin only)
 */
export const processIPOAllotments = async (req, res) => {
  try {
    const { symbol } = req.body;
    
    // Get fresh IPO data
    const freshIPOData = refreshIPOData();
    const ipo = [...freshIPOData.open, ...freshIPOData.closed].find(i => i.symbol === symbol);
    
    if (!ipo) {
      return res.status(404).json({ message: "IPO not found" });
    }

    // Get all pending applications for this IPO
    const pendingApplications = await IPOAllotment.find({
      ipoSymbol: symbol,
      status: 'pending'
    });

    if (pendingApplications.length === 0) {
      return res.status(200).json({ message: "No pending applications to process" });
    }

    // Process allotments (block full amount, not partial)
    let processedCount = 0;
    for (const application of pendingApplications) {
      const allotmentRatio = Math.random() * 0.3 + 0.1; // 10% to 40% allotment ratio
      const sharesAllotted = Math.floor(application.sharesApplied * allotmentRatio);
      const amountAllotted = sharesAllotted * ipo.issuePrice;
      
      // BLOCK FULL AMOUNT APPLIED (not just allotted amount)
      // No refund during allotment - full amount stays blocked
      const refundAmount = 0; // No refund during allotment

      // Calculate dates: 1 day after close date for allotment, listing on same day as allotment
      const closeDate = new Date(ipo.closeDate);
      const allotmentDate = new Date(closeDate);
      allotmentDate.setDate(closeDate.getDate() + 1); // 1 day after CLOSE DATE
      
      const listingDate = new Date(allotmentDate); // SAME DAY as allotment (no extra day)

      // Update allotment record
      await IPOAllotment.findByIdAndUpdate(application._id, {
        sharesAllotted,
        amountAllotted,
        refundAmount,
        status: 'allotted',
        allotmentDate,
        listingDate // Pre-set listing date
      });

      // NO REFUND during allotment - full amount remains blocked
      // User gets full amount back only after withdrawal with profit/loss

      // CREATE IPO HOLDING with full blocked amount
      await IPOHolding.create({
        user: application.user,
        ipoId: ipo.id,
        ipoSymbol: symbol,
        ipoName: ipo.name,
        applicationId: application._id,
        sharesAllotted,
        sharesApplied: application.sharesApplied, // Track original shares applied
        allotmentPrice: ipo.issuePrice,
        totalInvestment: application.amountApplied, // FULL AMOUNT APPLIED (not just allotted)
        blockedAmount: application.amountApplied, // Track full blocked amount
        status: 'allotted',
        allotmentDate,
        listingDate // Include the calculated listing date
      });

      processedCount++;
    }

    res.status(200).json({
      message: `Processed ${processedCount} IPO allotments successfully`,
      processed: processedCount
    });
  } catch (error) {
    console.error("PROCESS ALLOTMENTS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Process IPO listing (when IPO lists on exchange)
 * @route POST /api/ipo/process-listing
 * @access Private (Admin only)
 */
export const processIPOListing = async (req, res) => {
  try {
    const { symbol, listingPrice } = req.body;
    
    // Get fresh IPO data
    const freshIPOData = refreshIPOData();
    const ipo = freshIPOData.closed.find(i => i.symbol === symbol);
    
    if (!ipo) {
      return res.status(404).json({ message: "IPO not found in closed list" });
    }

    // Get all allotted applications for this IPO
    const allottedApplications = await IPOAllotment.find({
      ipoSymbol: symbol,
      status: 'allotted'
    });

    if (allottedApplications.length === 0) {
      return res.status(200).json({ message: "No allotted applications to process" });
    }

    // Process listing for all allotted users
    let processedCount = 0;
    for (const application of allottedApplications) {
      const investedValue = application.amountApplied;
      const currentValue = listingPrice * application.sharesAllotted;
      const profitLoss = currentValue - investedValue;
      const profitLossPercentage = (profitLoss / investedValue) * 100;
      const maxAllowedLoss = -0.1 * investedValue; // 10% loss cap

      // Use the pre-set listing date from allotment process, or today if not set
      const finalListingDate = application.listingDate || new Date();

      // Update allotment record with listing performance
      await IPOAllotment.findByIdAndUpdate(application._id, {
        listingPrice,
        profitLoss,
        profitLossPercentage,
        status: 'listed',
        listingDate: finalListingDate // Ensure listing date is set
      });

      // UPDATE IPO HOLDING with profit/loss
      await IPOHolding.findOneAndUpdate(
        { applicationId: application._id },
        {
          listingPrice,
          currentValue,
          profitLoss,
          profitLossPercentage,
          status: 'listed',
          listingDate: finalListingDate // Use the same listing date
        }
      );

      console.log(`IPO Listing Processed: ${application.ipoSymbol}`);
      console.log(`Invested: ₹${investedValue}, Current Value: ₹${currentValue}`);
      console.log(`P&L: ₹${profitLoss} (${profitLossPercentage.toFixed(2)}%)`);
      console.log(`🛡️ Loss Cap Applied: ${profitLoss === -maxAllowedLoss ? 'YES' : 'NO'}`);
      console.log(`🔢 Expected Max Loss: ₹${maxAllowedLoss.toFixed(2)}, Actual Loss: ₹${Math.abs(profitLoss).toFixed(2)}`);

      processedCount++;
    }

    res.status(200).json({
      message: `Processed ${processedCount} IPO listings successfully`,
      processed: processedCount
    });
  } catch (error) {
    console.error("PROCESS LISTING ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Withdraw IPO application (if not allotted)
 * @route POST /api/ipo/withdraw
 * @access Private
 */
export const withdrawIPOApplication = async (req, res) => {
  try {
    const { applicationId } = req.body;
    const user = req.user;

    // Find the application
    const application = await IPOAllotment.findOne({
      _id: applicationId,
      user: user._id
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Check withdrawal rules based on application status
    const currentDate = new Date();
    
    // Allow withdrawal for all processed statuses with instant processing
    // Remove all countdown restrictions
    console.log(`💸 Withdrawal request for application: ${application.ipoSymbol}, status: ${application.status}`);
    
    if (application.status === 'refunded' || application.isWithdrawn) {
      return res.status(400).json({ message: "Application already withdrawn" });
    }

    if (application.status === 'listed' || application.status === 'allotted') {
      // For listed or allotted applications, return blocked amount + profit/loss
      console.log(`💰 Processing withdrawal for ${application.ipoSymbol}:`);
      console.log(`  - Status: ${application.status}`);
      console.log(`  - Amount Applied: ₹${application.amountApplied}`);
      console.log(`  - Profit/Loss: ₹${application.profitLoss || 0}`);
      console.log(`  - Total Amount: ₹${application.amountApplied + (application.profitLoss || 0)}`);
      
      const totalAmount = application.amountApplied + (application.profitLoss || 0);
      
      // Refund the total amount (blocked amount + profit/loss)
      const userRecord = await User.findById(user._id);
      console.log(`  - User Balance Before: ₹${userRecord.balance}`);
      userRecord.balance += totalAmount;
      await userRecord.save();
      console.log(`  - User Balance After: ₹${userRecord.balance}`);

      // Create refund transaction
      await Transaction.create({
        user: user._id,
        type: "IPO_WITHDRAWAL",
        symbol: application.ipoSymbol,
        quantity: application.sharesApplied,
        price: totalAmount / application.sharesApplied,
        amount: totalAmount,
        description: `IPO withdrawal for ${application.ipoName}: ₹${application.amountApplied} + P&L ₹${application.profitLoss || 0}`
      });

      // Mark application as withdrawn
      await IPOAllotment.findByIdAndUpdate(applicationId, {
        status: 'refunded',
        refundAmount: totalAmount,
        isWithdrawn: true,
        withdrawalDate: new Date()
      });

      res.status(200).json({
        message: "IPO application withdrawn successfully",
        refundAmount: totalAmount,
        blockedAmount: application.amountApplied,
        profitLoss: application.profitLoss || 0,
        balance: userRecord.balance
      });
    } else {
      // For non-allotted, pending, or allotted applications, refund only the blocked amount
      const userRecord = await User.findById(user._id);
      userRecord.balance += application.amountApplied;
      await userRecord.save();

      // Create refund transaction
      await Transaction.create({
        user: user._id,
        type: "IPO_WITHDRAWAL",
        symbol: application.ipoSymbol,
        quantity: application.sharesApplied,
        price: application.amountApplied / application.sharesApplied,
        amount: application.amountApplied,
        description: `IPO application withdrawal for ${application.ipoName}`
      });

      // Mark application as withdrawn
      await IPOAllotment.findByIdAndUpdate(applicationId, {
        status: 'refunded',
        refundAmount: application.amountApplied,
        isWithdrawn: true,
        withdrawalDate: new Date()
      });

      res.status(200).json({
        message: "IPO application withdrawn successfully",
        refundAmount: application.amountApplied,
        balance: userRecord.balance
      });
    }
  } catch (error) {
    console.error("WITHDRAW APPLICATION ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get IPO allotment details
 * @route GET /api/ipo/allotment/:applicationId
 * @access Private
 */
export const getIPOAllotmentDetails = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const user = req.user;

    const allotment = await IPOAllotment.findOne({
      _id: applicationId,
      user: user._id
    });

    if (!allotment) {
      return res.status(404).json({ message: "Allotment not found" });
    }

    res.json({
      allotment: {
        id: allotment._id,
        ipoId: allotment.ipoId,
        ipoName: allotment.ipoName,
        ipoSymbol: allotment.ipoSymbol,
        amountApplied: allotment.amountApplied,
        sharesApplied: allotment.sharesApplied,
        sharesAllotted: allotment.sharesAllotted,
        amountAllotted: allotment.amountAllotted,
        refundAmount: allotment.refundAmount,
        status: allotment.status,
        applicationDate: allotment.applicationDate,
        allotmentDate: allotment.allotmentDate,
        listingPrice: allotment.listingPrice,
        profitLoss: allotment.profitLoss,
        profitLossPercentage: allotment.profitLossPercentage,
        isWithdrawn: allotment.isWithdrawn,
        withdrawalDate: allotment.withdrawalDate
      }
    });
  } catch (error) {
    console.error("GET ALLOTMENT DETAILS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
