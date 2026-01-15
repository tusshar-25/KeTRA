import IPOHolding from "../models/IPOHolding.js";
import IPOAllotment from "../models/IPOAllotment.js";
import { getCurrentIPOStatus } from "../utils/ipos/rotationEngine.js";

/**
 * Get User's IPO Portfolio with Detailed Information
 * @route GET /api/portfolio/ipo-portfolio
 * @access Private
 */
export const getIPOPortfolio = async (req, res) => {
  try {
    const user = req.user;
    
    // Get user's IPO applications
    const applications = await IPOAllotment.find({ user: user._id })
      .sort({ applicationDate: -1 });
    
    // Get user's IPO holdings
    const holdings = await IPOHolding.find({ user: user._id })
      .sort({ allotmentDate: -1 });
    
    // Get current IPO data for status reference
    const currentIPOData = getCurrentIPOStatus();
    
    // Combine and enrich portfolio data
    const portfolio = [];
    
    // Process applications
    for (const application of applications) {
      // Find IPO in current data
      const currentIPO = [...currentIPOData.open, ...currentIPOData.upcoming, ...currentIPOData.closed]
        .find(ipo => ipo.symbol === application.ipoSymbol);
      
      // Calculate days until listing
      let daysUntilListing = null;
      let listingStatus = "Not Available";
      
      if (application.listingDate) {
        const today = new Date();
        const listingDate = new Date(application.listingDate);
        const daysDiff = Math.ceil((listingDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 0) {
          daysUntilListing = daysDiff;
          listingStatus = "Upcoming";
        } else if (daysDiff === 0) {
          daysUntilListing = 0;
          listingStatus = "Lists Today";
        } else {
          daysUntilListing = Math.abs(daysDiff);
          listingStatus = "Listed";
        }
      }
      
      // Determine current status
      let currentStatus = application.status;
      let statusColor = "gray";
      let statusDescription = "";
      
      switch (application.status) {
        case 'pending':
          currentStatus = "Pending Allotment";
          statusColor = "yellow";
          statusDescription = "Application submitted, waiting for allotment";
          break;
        case 'allotted':
          currentStatus = "Allotted";
          statusColor = "blue";
          statusDescription = `Allotted ${application.sharesAllotted}/${application.sharesApplied} shares`;
          break;
        case 'listed':
          currentStatus = "Listed";
          statusColor = "green";
          statusDescription = `Listed at ₹${application.listingPrice || 'N/A'}`;
          break;
        case 'refunded':
          currentStatus = "Refunded";
          statusColor = "orange";
          statusDescription = "Application withdrawn, amount refunded";
          break;
      }
      
      portfolio.push({
        type: "application",
        id: application._id,
        ipoSymbol: application.ipoSymbol,
        ipoName: application.ipoName,
        currentStatus,
        statusColor,
        statusDescription,
        applicationDate: application.applicationDate,
        allotmentDate: application.allotmentDate,
        listingDate: application.listingDate,
        daysUntilListing,
        listingStatus,
        amountApplied: application.amountApplied,
        sharesApplied: application.sharesApplied,
        sharesAllotted: application.sharesAllotted || 0,
        amountAllotted: application.amountAllotted || 0,
        refundAmount: application.refundAmount || 0,
        listingPrice: application.listingPrice || null,
        profitLoss: application.profitLoss || 0,
        profitLossPercentage: application.profitLossPercentage || 0,
        isWithdrawn: application.isWithdrawn || false,
        withdrawalDate: application.withdrawalDate || null,
        currentIPO: currentIPO ? {
          issuePrice: currentIPO.issuePrice,
          sector: currentIPO.sector,
          minInvestment: currentIPO.minInvestment,
          priceBand: currentIPO.priceBand
        } : null
      });
    }
    
    // Process holdings
    for (const holding of holdings) {
      // Find IPO in current data
      const currentIPO = [...currentIPOData.open, ...currentIPOData.upcoming, ...currentIPOData.closed]
        .find(ipo => ipo.symbol === holding.ipoSymbol);
      
      // Calculate days until listing
      let daysUntilListing = null;
      let listingStatus = "Not Available";
      
      if (holding.listingDate) {
        const today = new Date();
        const listingDate = new Date(holding.listingDate);
        const daysDiff = Math.ceil((listingDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 0) {
          daysUntilListing = daysDiff;
          listingStatus = "Upcoming";
        } else if (daysDiff === 0) {
          daysUntilListing = 0;
          listingStatus = "Lists Today";
        } else {
          daysUntilListing = Math.abs(daysDiff);
          listingStatus = "Listed";
        }
      }
      
      // Calculate current value
      let currentValue = holding.totalInvestment;
      if (holding.status === 'listed' && holding.listingPrice) {
        currentValue = holding.sharesAllotted * holding.listingPrice;
      }
      
      portfolio.push({
        type: "holding",
        id: holding._id,
        ipoSymbol: holding.ipoSymbol,
        ipoName: holding.ipoName,
        currentStatus: holding.status === 'sold' ? 'Withdrawn' : holding.status,
        statusColor: holding.status === 'sold' ? 'red' : 
                     holding.status === 'listed' ? 'green' : 'blue',
        statusDescription: holding.status === 'sold' ? 'Withdrawn on ' + (holding.withdrawalDate || 'N/A') :
                          holding.status === 'listed' ? `Listed at ₹${holding.listingPrice}` :
                          `Allotted ${holding.sharesAllotted} shares`,
        applicationDate: holding.allotmentDate,
        listingDate: holding.listingDate,
        daysUntilListing,
        listingStatus,
        totalInvestment: holding.totalInvestment,
        sharesAllotted: holding.sharesAllotted,
        allotmentPrice: holding.allotmentPrice,
        listingPrice: holding.listingPrice || null,
        currentValue,
        profitLoss: holding.profitLoss || 0,
        profitLossPercentage: holding.profitLossPercentage || 0,
        isWithdrawn: holding.isWithdrawn || false,
        withdrawalDate: holding.withdrawalDate || null,
        currentIPO: currentIPO ? {
          issuePrice: currentIPO.issuePrice,
          sector: currentIPO.sector,
          minInvestment: currentIPO.minInvestment,
          priceBand: currentIPO.priceBand
        } : null
      });
    }
    
    // Sort portfolio by date (newest first)
    portfolio.sort((a, b) => new Date(b.applicationDate || b.allotmentDate) - new Date(a.applicationDate || a.allotmentDate));
    
    // Calculate portfolio summary
    const summary = {
      totalApplications: applications.length,
      totalHoldings: holdings.length,
      totalInvested: portfolio.reduce((sum, item) => sum + (item.amountApplied || item.totalInvestment), 0),
      currentValue: portfolio.reduce((sum, item) => sum + (item.currentValue || 0), 0),
      totalProfitLoss: portfolio.reduce((sum, item) => sum + (item.profitLoss || 0), 0),
      pendingApplications: applications.filter(app => app.status === 'pending').length,
      allottedApplications: applications.filter(app => app.status === 'allotted').length,
      listedIPOs: portfolio.filter(item => item.currentStatus === 'Listed').length,
      withdrawnIPOs: portfolio.filter(item => item.currentStatus === 'Withdrawn').length
    };
    
    console.log(`📊 User IPO Portfolio: ${summary.totalApplications} applications, ${summary.totalHoldings} holdings`);
    console.log(`💰 Total Invested: ₹${summary.totalInvested}, Current Value: ₹${summary.currentValue}`);
    console.log(`📈 Total P&L: ₹${summary.totalProfitLoss}`);
    
    res.status(200).json({
      success: true,
      message: "IPO portfolio retrieved successfully",
      portfolio,
      summary,
      currentMarketData: {
        openIPOs: currentIPOData.open.length,
        upcomingIPOs: currentIPOData.upcoming.length,
        closedIPOs: currentIPOData.closed.length,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("GET IPO PORTFOLIO ERROR:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to retrieve IPO portfolio",
      error: error.message 
    });
  }
};
