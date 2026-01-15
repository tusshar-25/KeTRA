import { createContext, useContext, useState, useEffect } from "react";
import { useAlert } from "./AlertContext";
import { useAuth } from "./AuthContext";
import { buyStock as apiBuyStock, sellStock as apiSellStock, getPortfolio } from "../services/marketService";
import { isMarketOpen } from "../utils/constants";
import api from "../services/api";

/**
 * Global trade context for managing wallet and portfolio
 * Provides simulated trading functionality with virtual funds
 */
const TradeContext = createContext();

/**
 * Trade provider component that manages wallet and portfolio state
 * @param {Object} props - React children components
 */
export const TradeProvider = ({ children }) => {
  const { showAlert, hideAlert } = useAlert();
  const { user } = useAuth();

  // Initialize wallet with user data from AuthContext or default
  const [wallet, setWallet] = useState({
    balance: user?.balance || 400000,   // Use user's actual balance or default ₹4,00,000
    invested: 0,       // Total invested in stocks
    blocked: 0,        // IPO blocked amount
  });

  // Simulated portfolio state
  const [portfolio, setPortfolio] = useState([]);

  // Update wallet when user data changes (e.g., after login)
  useEffect(() => {
    if (user && user.balance !== undefined) {
      setWallet((prev) => ({
        ...prev,
        balance: user.balance,
      }));
    }
  }, [user]);

  /**
   * Buy stock function
   * @param {Object} params - Stock symbol, quantity, and price
   */
  const buyStock = async ({ symbol, quantity, price }) => {
    // Check market status
    if (!isMarketOpen()) {
      showAlert({
        type: "error",
        title: "Market Closed",
        message: "Trading is only allowed during market hours (9:15 AM - 3:30 PM IST on weekdays)"
      });
      throw new Error("MARKET_CLOSED");
    }

    const cost = quantity * price;

    // Check if user has sufficient balance
    if (wallet.balance < cost) {
      showAlert({
        type: "error",
        title: "Insufficient Balance",
        message: "You don't have enough balance to buy these shares",
      });
      throw new Error("INSUFFICIENT_BALANCE");
    }

    try {
      // Call backend API to buy stock
      const response = await apiBuyStock(symbol, quantity, price);
      
      // Show success alert with auto-dismiss
      showAlert({
        type: "success",
        title: "Buy Order Successful",
        message: `Successfully bought ${quantity} shares of ${symbol}`
      });

      // Auto-dismiss success alert after 3 seconds
      setTimeout(() => {
        hideAlert();
      }, 3000);

      // Refresh portfolio from backend to sync state
      const portfolioRes = await getPortfolio();
      setPortfolio(portfolioRes.data.portfolio || {});

      // Update wallet balance from backend response
      setWallet((w) => ({
        ...w,
        balance: w.balance - cost,
        invested: w.invested + cost,
      }));

      // Update user balance in AuthContext if available
      if (response?.data?.balance !== undefined) {
        // This would require updating AuthContext to have a setBalance method
        // For now, the balance will be updated on next refresh
      }

      return true;
    } catch (error) {
      showAlert({
        type: "error",
        title: "Buy Order Failed",
        message: error.response?.data?.message || error.message || "Failed to buy shares"
      });
      throw error;
    }
  };

  /**
   * Sell stock function
   * @param {Object} params - Stock symbol, quantity, and price
   */
  const sellStock = async ({ symbol, quantity, price }) => {
    // Check market status
    if (!isMarketOpen()) {
      showAlert({
        type: "error",
        title: "Market Closed",
        message: "Trading is only allowed during market hours (9:15 AM - 3:30 PM IST on weekdays)"
      });
      throw new Error("MARKET_CLOSED");
    }

    // Get fresh portfolio data to ensure we have the latest holdings
    try {
      const portfolioRes = await getPortfolio();
      const currentPortfolio = portfolioRes.data.portfolio || {};
      
      console.log('Current portfolio from API:', currentPortfolio);
      
      // Check if symbol exists directly in portfolio object
      const directHolding = currentPortfolio[symbol];
      console.log('Direct holding check:', directHolding);
      
      if (directHolding && directHolding.quantity > 0) {
        // Found the holding with actual shares
        if (directHolding.quantity < quantity) {
          showAlert({
            type: "error",
            title: "Insufficient Shares",
            message: `You only have ${directHolding.quantity} shares of ${symbol}, but trying to sell ${quantity}`
          });
          throw new Error("INSUFFICIENT_SHARES");
        }
        
        // Proceed with sell logic
        try {
          await apiSellStock(symbol, quantity, price);
          
          showAlert({
            type: "success",
            title: "Sell Order Successful",
            message: `Successfully sold ${quantity} shares of ${symbol}`
          });

          // Auto-dismiss success alert after 3 seconds
          setTimeout(() => {
            hideAlert();
          }, 3000);

          // Refresh portfolio from backend to sync state
          const updatedPortfolioRes = await getPortfolio();
          setPortfolio(updatedPortfolioRes.data.portfolio || {});

          const proceeds = quantity * price;
          
          setWallet((w) => ({
            ...w,
            balance: w.balance + proceeds,
            invested: w.invested - directHolding.avgPrice * quantity,
          }));

          return true;
        } catch (error) {
          showAlert({
            type: "error",
            title: "Sell Order Failed",
            message: error.response?.data?.message || error.message || "Failed to sell shares"
          });
          throw error;
        }
      } else {
        // No holding found or zero quantity
        showAlert({
          type: "error",
          title: "Stock Not Found",
          message: `You don't own any shares of ${symbol}`
        });
        throw new Error("STOCK_NOT_FOUND");
      }
    } catch (error) {
      if (error.message === "STOCK_NOT_FOUND" || error.message === "INSUFFICIENT_SHARES") {
        throw error;
      }
      // If portfolio fetch fails, continue with fallback logic
    }

    // Fallback to original logic (shouldn't reach here if data is correct)
    const portfolioArray = Object.entries(portfolio || {}).map(([sym, holding]) => ({
      symbol: sym,
      ...holding
    }));
    
    const holding = portfolioArray.find((p) => p.symbol === symbol);

    if (!holding || holding.quantity < quantity) {
      showAlert({
        type: "error",
        title: "Insufficient Shares",
        message: `You don't have enough shares to sell. Available: ${holding?.quantity || 0}, Requested: ${quantity}`,
      });
      throw new Error("INSUFFICIENT_SHARES");
    }

    try {
      await apiSellStock(symbol, quantity, price);
      
      showAlert({
        type: "success",
        title: "Sell Order Successful",
        message: `Successfully sold ${quantity} shares of ${symbol}`
      });

      const portfolioRes = await getPortfolio();
      setPortfolio(portfolioRes.data.portfolio || {});

      const proceeds = quantity * price;
      
      setWallet((w) => ({
        ...w,
        balance: w.balance + proceeds,
        invested: w.invested - holding.avgPrice * quantity,
      }));

      return true;
    } catch (error) {
      showAlert({
        type: "error",
        title: "Sell Order Failed",
        message: error.response?.data?.message || error.message || "Failed to sell shares"
      });
      throw error;
    }
  };

  return (
    <TradeContext.Provider
      value={{
        wallet,
        setWallet,
        portfolio,
        setPortfolio,
        buyStock,
        sellStock,
      }}
    >
      {children}
    </TradeContext.Provider>
  );
};

/**
 * Hook to use trade context in components
 * @returns {Object} - Trade context value
 */
export const useTrade = () => useContext(TradeContext);