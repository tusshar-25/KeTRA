import { writeFileSync, readFileSync } from 'fs';

// In-memory storage for accelerated IPO timeline
let acceleratedIPOs = new Map(); // symbol -> { appliedAt, allotmentAt, listingAt, status }

// Accelerated IPO Timeline Constants
const TIMELINE = {
  ALLOTMENT_AFTER_MINUTES: 1,
  LISTING_AFTER_ALLOTMENT_MINUTES: 1,
  AUTO_CLOSE_AFTER_LISTING_MINUTES: 2
};

/**
 * Process IPO application with accelerated timeline
 * @param {string} symbol - IPO symbol
 * @param {Object} user - User object
 * @param {number} amount - Application amount
 */
export const processAcceleratedIPOApplication = (symbol, user, amount) => {
  const now = new Date();
  const appliedAt = now.toISOString();
  
  // Calculate timeline
  const allotmentAt = new Date(now.getTime() + TIMELINE.ALLOTMENT_AFTER_MINUTES * 60000);
  const listingAt = new Date(allotmentAt.getTime() + TIMELINE.LISTING_AFTER_ALLOTMENT_MINUTES * 60000);
  const autoCloseAt = new Date(listingAt.getTime() + TIMELINE.AUTO_CLOSE_AFTER_LISTING_MINUTES * 60000);
  
  // Store accelerated timeline
  acceleratedIPOs.set(symbol, {
    appliedAt,
    allotmentAt: allotmentAt.toISOString(),
    listingAt: listingAt.toISOString(),
    autoCloseAt: autoCloseAt.toISOString(),
    status: 'applied',
    user: user._id,
    amount,
    symbol
  });
  
  // Schedule automatic processing
  scheduleAllotment(symbol);
  scheduleListing(symbol);
  scheduleAutoClose(symbol);
  
  return {
    message: 'IPO application submitted with accelerated timeline',
    timeline: {
      appliedAt,
      allotmentAt: allotmentAt.toISOString(),
      listingAt: listingAt.toISOString(),
      autoCloseAt: autoCloseAt.toISOString()
    }
  };
};

/**
 * Schedule allotment processing
 */
const scheduleAllotment = (symbol) => {
  const ipo = acceleratedIPOs.get(symbol);
  if (!ipo) return;
  
  const delay = TIMELINE.ALLOTMENT_AFTER_MINUTES * 60000;
  
  setTimeout(() => {
    processAllotment(symbol);
  }, delay);
};

/**
 * Schedule listing processing
 */
const scheduleListing = (symbol) => {
  const ipo = acceleratedIPOs.get(symbol);
  if (!ipo) return;
  
  const delay = (TIMELINE.ALLOTMENT_AFTER_MINUTES + TIMELINE.LISTING_AFTER_ALLOTMENT_MINUTES) * 60000;
  
  setTimeout(() => {
    processListing(symbol);
  }, delay);
};

/**
 * Schedule auto-close
 */
const scheduleAutoClose = (symbol) => {
  const ipo = acceleratedIPOs.get(symbol);
  if (!ipo) return;
  
  const delay = (TIMELINE.ALLOTMENT_AFTER_MINUTES + TIMELINE.LISTING_AFTER_ALLOTMENT_MINUTES + TIMELINE.AUTO_CLOSE_AFTER_LISTING_MINUTES) * 60000;
  
  setTimeout(() => {
    processAutoClose(symbol);
  }, delay);
};

/**
 * Process allotment (randomly decide if allotted)
 */
const processAllotment = async (symbol) => {
  console.log(`🎯 Starting allotment process for ${symbol}`);
  const ipo = acceleratedIPOs.get(symbol);
  console.log(`📊 Found IPO in accelerated system:`, ipo);
  
  if (!ipo || ipo.status !== 'applied') {
    console.log(`❌ IPO not found or not in applied status. Current status: ${ipo?.status}`);
    return;
  }
  
  // 70% chance of allotment (can be adjusted)
  const isAllotted = Math.random() < 0.7;
  
  ipo.status = isAllotted ? 'allotted' : 'not_allotted';
  ipo.allottedAt = new Date().toISOString();
  ipo.isAllotted = isAllotted;
  
  if (isAllotted) {
    // Calculate listing price (10-30% gain)
    const listingGain = 1 + (Math.random() * 0.2 + 0.1); // 10-30% gain
    ipo.listingPrice = Math.round(ipo.amount * listingGain);
    ipo.profit = Math.round(ipo.listingPrice - ipo.amount);
  }
  
  console.log(`🎯 ${symbol}: ${isAllotted ? 'ALLOTTED' : 'NOT ALLOTTED'} at ${new Date().toISOString()}`);
  
  // Update the IPO data in database
  await updateIPOStatus(symbol, ipo);
};

/**
 * Process listing
 */
const processListing = async (symbol) => {
  const ipo = acceleratedIPOs.get(symbol);
  if (!ipo || !ipo.isAllotted) return;
  
  ipo.status = 'listed';
  ipo.listedAt = new Date().toISOString();
  
  console.log(`📈 ${symbol}: LISTED at ${new Date().toISOString()} with price ₹${ipo.listingPrice}`);
  
  // Update the IPO data in database
  await updateIPOStatus(symbol, ipo);
};

/**
 * Process auto-close
 */
const processAutoClose = async (symbol) => {
  const ipo = acceleratedIPOs.get(symbol);
  if (!ipo) return;
  
  ipo.status = 'closed';
  ipo.closedAt = new Date().toISOString();
  
  console.log(`🔒 ${symbol}: AUTO-CLOSED at ${new Date().toISOString()}`);
  
  // Update the IPO data in database
  await updateIPOStatus(symbol, ipo);
  
  // Clean up memory
  acceleratedIPOs.delete(symbol);
};

/**
 * Update IPO status in the main system
 */
const updateIPOStatus = async (symbol, ipo) => {
  try {
    // Import models dynamically to avoid circular dependencies
    const IPOAllotment = require('../models/IPOAllotment.js').default;
    const User = require('../models/User.js').default;
    const Transaction = require('../models/Transaction.js').default;
    
    console.log(`🔄 Updating ${symbol} status to: ${ipo.status} in database`);
    
    // Find and update the application in database
    const application = await IPOAllotment.findOne({
      ipoSymbol: symbol,
      user: ipo.user,
      isWithdrawn: false
    });
    
    if (!application) {
      console.log(`❌ Application not found for ${symbol}`);
      return;
    }
    
    const now = new Date();
    let updateData = {
      status: ipo.status,
      updatedAt: now
    };
    
    // Add allotment details if status is allotted or not_allotted
    if (ipo.status === 'allotted' || ipo.status === 'not_allotted') {
      updateData.allotmentDate = now;
      
      if (ipo.status === 'allotted') {
        // Calculate shares and amounts for allotted applications
        const sharePrice = 1000; // Assuming ₹1000 per share
        const sharesAllotted = Math.floor(ipo.amount / sharePrice);
        const amountAllotted = sharesAllotted * sharePrice;
        
        updateData.sharesAllotted = sharesAllotted;
        updateData.amountAllotted = amountAllotted;
        updateData.refundAmount = ipo.amount - amountAllotted;
        
        console.log(`💰 ${symbol}: Allotted ${sharesAllotted} shares worth ₹${amountAllotted}`);
      } else {
        // Not allotted - full refund
        updateData.sharesAllotted = 0;
        updateData.amountAllotted = 0;
        updateData.refundAmount = ipo.amount;
        
        console.log(`💸 ${symbol}: Not allotted - full refund of ₹${ipo.amount}`);
      }
    }
    
    // Add listing details if status is listed
    if (ipo.status === 'listed') {
      updateData.listingDate = now;
      updateData.listingPrice = ipo.listingPrice;
      
      // Calculate profit/loss for listed applications
      if (application.sharesAllotted > 0) {
        const profitLoss = (ipo.listingPrice - (application.amountAllotted / application.sharesAllotted)) * application.sharesAllotted;
        const profitLossPercentage = (profitLoss / application.amountAllotted) * 100;
        
        updateData.profitLoss = profitLoss;
        updateData.profitLossPercentage = profitLossPercentage;
        
        console.log(`📈 ${symbol}: Listed at ₹${ipo.listingPrice}, P&L: ₹${profitLoss} (${profitLossPercentage.toFixed(2)}%)`);
      }
    }
    
    // Update the application
    await IPOAllotment.findByIdAndUpdate(application._id, updateData);
    
    console.log(`✅ Successfully updated ${symbol} in database`);
    
  } catch (error) {
    console.error(`❌ Failed to update ${symbol} in database:`, error);
  }
};

/**
 * Initialize existing applications into accelerated system
 */
export const initializeExistingApplications = async (applications) => {
  const now = new Date();
  console.log(`🚀 Initializing ${applications.length} applications into accelerated system`);
  console.log('📋 Current acceleratedIPOs map before initialization:', Array.from(acceleratedIPOs.entries()));
  
  // Process applications asynchronously but respond immediately
  const processedApplications = [];
  
  applications.forEach(app => {
    console.log(`📋 Processing application: ${app.ipoSymbol}, status: ${app.status}, isWithdrawn: ${app.isWithdrawn}`);
    
    // Skip if already in accelerated system
    if (acceleratedIPOs.has(app.ipoSymbol)) {
      console.log(`⏭️ Skipping ${app.ipoSymbol} - already in accelerated system`);
      return;
    }
    
    // Skip withdrawn applications - don't restart countdown
    if (app.isWithdrawn || app.status === 'refunded') {
      console.log(`⏭️ Skipping ${app.ipoSymbol} - already withdrawn/refunded`);
      return;
    }
    
    // Calculate timeline from application creation time
    const appliedAt = app.createdAt || now.toISOString();
    const appliedTime = new Date(appliedAt);
    
    // Calculate timeline based on when application was made
    const timeSinceApplied = now.getTime() - appliedTime.getTime();
    const minutesSinceApplied = Math.floor(timeSinceApplied / 60000);
    
    console.log(`⏰ Time analysis for ${app.ipoSymbol}: applied=${appliedAt}, minutesSince=${minutesSinceApplied}`);
    
    let allotmentAt, listingAt, autoCloseAt, status;
    
    if (minutesSinceApplied >= 4) {
      // Already past all stages
      status = 'closed';
      allotmentAt = new Date(appliedTime.getTime() + TIMELINE.ALLOTMENT_AFTER_MINUTES * 60000);
      listingAt = new Date(allotmentAt.getTime() + TIMELINE.LISTING_AFTER_ALLOTMENT_MINUTES * 60000);
      autoCloseAt = new Date(listingAt.getTime() + TIMELINE.AUTO_CLOSE_AFTER_LISTING_MINUTES * 60000);
    } else if (minutesSinceApplied >= 2) {
      // Past listing stage
      status = 'listed';
      allotmentAt = new Date(appliedTime.getTime() + TIMELINE.ALLOTMENT_AFTER_MINUTES * 60000);
      listingAt = new Date(allotmentAt.getTime() + TIMELINE.LISTING_AFTER_ALLOTMENT_MINUTES * 60000);
      autoCloseAt = new Date(listingAt.getTime() + TIMELINE.AUTO_CLOSE_AFTER_LISTING_MINUTES * 60000);
    } else if (minutesSinceApplied >= 1) {
      // Past allotment stage
      status = 'allotted';
      allotmentAt = new Date(appliedTime.getTime() + TIMELINE.ALLOTMENT_AFTER_MINUTES * 60000);
      listingAt = new Date(allotmentAt.getTime() + TIMELINE.LISTING_AFTER_ALLOTMENT_MINUTES * 60000);
      autoCloseAt = new Date(listingAt.getTime() + TIMELINE.AUTO_CLOSE_AFTER_LISTING_MINUTES * 60000);
    } else {
      // Still in application stage
      status = 'applied';
      allotmentAt = new Date(appliedTime.getTime() + TIMELINE.ALLOTMENT_AFTER_MINUTES * 60000);
      listingAt = new Date(allotmentAt.getTime() + TIMELINE.LISTING_AFTER_ALLOTMENT_MINUTES * 60000);
      autoCloseAt = new Date(listingAt.getTime() + TIMELINE.AUTO_CLOSE_AFTER_LISTING_MINUTES * 60000);
    }
    
    // Override status with actual application status if different
    if (app.status === 'not_allotted') {
      status = 'not_allotted';
    } else if (app.status === 'allotted') {
      status = 'allotted';
    } else if (app.status === 'listed') {
      status = 'listed';
    }
    
    console.log(`📊 Final status for ${app.ipoSymbol}: ${status}`);
    
    // Store in accelerated system
    const acceleratedIPO = {
      appliedAt,
      allotmentAt: allotmentAt.toISOString(),
      listingAt: listingAt.toISOString(),
      autoCloseAt: autoCloseAt.toISOString(),
      status,
      user: app.user._id,
      amount: app.amountApplied,
      symbol: app.ipoSymbol,
      isAllotted: status === 'allotted' || status === 'listed' || status === 'closed',
      applicationId: app._id
    };
    
    acceleratedIPOs.set(app.ipoSymbol, acceleratedIPO);
    console.log(`✅ Stored ${app.ipoSymbol} in accelerated system:`, acceleratedIPO);
    
    processedApplications.push({ symbol: app.ipoSymbol, status });
    
    // Schedule remaining processing if not completed
    if (status === 'applied') {
      console.log(`⏰ Scheduling allotment for ${app.ipoSymbol} in ${TIMELINE.ALLOTMENT_AFTER_MINUTES} minutes`);
      scheduleAllotment(app.ipoSymbol);
      scheduleListing(app.ipoSymbol);
      scheduleAutoClose(app.ipoSymbol);
    } else if (status === 'allotted') {
      console.log(`⏰ Scheduling listing for ${app.ipoSymbol} in ${TIMELINE.LISTING_AFTER_ALLOTMENT_MINUTES} minutes`);
      scheduleListing(app.ipoSymbol);
      scheduleAutoClose(app.ipoSymbol);
    } else if (status === 'listed') {
      console.log(`⏰ Scheduling auto-close for ${app.ipoSymbol} in ${TIMELINE.AUTO_CLOSE_AFTER_LISTING_MINUTES} minutes`);
      scheduleAutoClose(app.ipoSymbol);
    }
  });
  
  console.log('📋 Final acceleratedIPOs map after initialization:', Array.from(acceleratedIPOs.entries()));
  
  // Process database updates asynchronously in the background
  if (processedApplications.length > 0) {
    setImmediate(() => {
      console.log(`🔄 Processing ${processedApplications.length} applications in background`);
      // Database operations will be handled by the scheduled functions
    });
  }
  
  return {
    message: `Initialized ${applications.length} applications into accelerated system`,
    initialized: processedApplications.length,
    processed: processedApplications
  };
};

export const canWithdrawMoney = (symbol, userId) => {
  const ipo = acceleratedIPOs.get(symbol);

  // 🔴 MEMORY LOST → allow safe withdrawal for demo
  if (!ipo) {
    return {
      canWithdraw: true,
      reason: "Accelerated IPO data expired — allowing withdrawal",
    };
  }

  if (ipo.user !== userId) {
    return {
      canWithdraw: false,
      reason: "IPO not found or unauthorized",
    };
  }

  if (["not_allotted", "listed"].includes(ipo.status)) {
    return {
      canWithdraw: true,
      reason: "Eligible for withdrawal",
    };
  }

  return {
    canWithdraw: false,
    reason: "Cannot withdraw yet",
  };
};

/**
 * Get IPO timeline for user
 */
export const getIPOTimeline = (symbol) => {
  const ipo = acceleratedIPOs.get(symbol);
  if (!ipo) return null;
  
  const now = new Date();
  const timeline = {
    applied: { time: ipo.appliedAt, completed: true },
    allotment: { 
      time: ipo.allotmentAt, 
      completed: now >= new Date(ipo.allotmentAt),
      result: ipo.status === 'allotted' || ipo.status === 'not_allotted' ? (ipo.isAllotted ? 'Allotted' : 'Not Allotted') : 'Pending'
    },
    listing: { 
      time: ipo.listingAt, 
      completed: ipo.status === 'listed',
      price: ipo.listingPrice || null
    },
    close: { 
      time: ipo.autoCloseAt, 
      completed: ipo.status === 'closed'
    }
  };
  
  return { symbol, status: ipo.status, timeline };
};

/**
 * Get all active accelerated IPOs for a user
 */
export const getUserAcceleratedIPOs = (userId) => {
  const userIPOs = [];
  
  for (const [symbol, ipo] of acceleratedIPOs.entries()) {
    if (ipo.user === userId) {
      userIPOs.push(getIPOTimeline(symbol));
    }
  }
  
  return userIPOs;
};

// Export constants for use in other files
export { TIMELINE };
