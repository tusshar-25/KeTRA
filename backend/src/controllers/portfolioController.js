import yahooFinance from "yahoo-finance2";
import IPOHolding from "../models/IPOHolding.js";

const yf = new yahooFinance();

/**
 * Get user portfolio with current values and P&L (includes both stocks and IPOs)
 * @route GET /api/portfolio
 * @access Private
 */
export const getPortfolio = async (req, res) => {
  try {
    const user = req.user;

    let totalInvestment = 0;
    let currentValue = 0;

    // Get stock holdings
    const stockHoldings = user.holdings.filter(holding => holding.quantity > 0);

    const stockPortfolio = await Promise.all(stockHoldings.map(async (holding) => {
      let currentPrice = holding.avgPrice; // Fallback to avg price
      
      // Fetch real current price from Yahoo Finance
      try {
        const quote = await yf.quote(`${holding.stockSymbol}.NS`, {}, { validateResult: false });
        if (quote && quote.regularMarketPrice != null) {
          currentPrice = quote.regularMarketPrice;
        }
      } catch (error) {
        console.error(`Failed to fetch price for ${holding.stockSymbol}:`, error.message);
      }

      const investedAmount = holding.avgPrice * holding.quantity;
      const currentStockValue = currentPrice * holding.quantity;
      const pnl = currentStockValue - investedAmount;

      totalInvestment += investedAmount;
      currentValue += currentStockValue;

      return {
        type: 'stock',
        symbol: holding.stockSymbol,
        quantity: holding.quantity,
        avgPrice: holding.avgPrice,
        currentPrice: currentPrice,
        investedAmount,
        currentValue: currentStockValue,
        pnl
      };
    }));

    // Get IPO holdings
    const ipoHoldings = await IPOHolding.find({ 
      user: user._id,
      status: { $in: ['allotted', 'listed'] }
    });

    const ipoPortfolio = ipoHoldings.map((holding) => {
      const investedAmount = holding.totalInvestment;
      const currentIPOValue = holding.listingPrice ? (holding.sharesAllotted * holding.listingPrice) : investedAmount;
      const pnl = currentIPOValue - investedAmount;

      totalInvestment += investedAmount;
      currentValue += currentIPOValue;

      return {
        type: 'ipo',
        ipoId: holding.ipoId,
        ipoSymbol: holding.ipoSymbol,
        ipoName: holding.ipoName,
        sharesAllotted: holding.sharesAllotted,
        allotmentPrice: holding.allotmentPrice,
        listingPrice: holding.listingPrice,
        investedAmount,
        currentValue: currentIPOValue,
        profitLoss: holding.profitLoss,
        profitLossPercentage: holding.profitLossPercentage,
        status: holding.status,
        allotmentDate: holding.allotmentDate,
        listingDate: holding.listingDate,
        isWithdrawn: holding.isWithdrawn,
        pnl
      };
    });

    // Combine both portfolios
    const allHoldings = [...stockPortfolio, ...ipoPortfolio];

    res.status(200).json({
      balance: user.balance,
      totalInvestment,
      currentValue,
      totalPnL: currentValue - totalInvestment,
      holdings: allHoldings,
      stockHoldings: stockPortfolio,
      ipoHoldings: ipoPortfolio
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};