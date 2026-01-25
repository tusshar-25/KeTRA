import { useTrade } from "../context/TradeContext";

const usePortfolio = () => {
  const { portfolio } = useTrade();
  const { wallet } = useTrade(); // Get current wallet balance

  // Handle different possible response structures from backend
  const holdings = portfolio?.holdings || portfolio?.stockHoldings || portfolio?.ipoHoldings || [];
  
  const invested = holdings.reduce(
    (sum, p) => sum + (p.quantity * p.avgPrice),
    0
  );

  const currentValue = holdings.reduce(
    (sum, p) => sum + (p.quantity * p.currentPrice),
    0
  );

  // Calculate P&L relative to ₹400,000 baseline
  const baselineAmount = 400000;
  const pnlRelativeToBaseline = baselineAmount - currentValue; // 400000 - current amount
  
  // Determine if it's profit or loss
  const isProfit = currentValue > baselineAmount;
  const isLoss = currentValue < baselineAmount;
  
  // Calculate the absolute difference
  const profitLossAmount = Math.abs(pnlRelativeToBaseline);

  return {
    holdings,
    invested,
    currentValue,
    pnl: parseFloat((currentValue - invested).toFixed(2)), // Regular P&L (current - invested) with 2 decimal places
    baselinePnL: isProfit ? parseFloat(profitLossAmount.toFixed(2)) : -parseFloat(profitLossAmount.toFixed(2)), // + for profit, - for loss
    isProfit, // Boolean flag for profit
    isLoss, // Boolean flag for loss
    loading: false,
  };
};

export default usePortfolio;
