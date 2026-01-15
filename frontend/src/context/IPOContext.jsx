import { createContext, useContext, useState, useEffect } from "react";
import { useTrade } from "./TradeContext";
import { useAlert } from "./AlertContext";
import { useAuth } from "./AuthContext";
import api from "../services/api";

/**
 * Global IPO context for managing IPO applications and allotments
 * Provides simulated IPO functionality with virtual funds
 */
const IPOContext = createContext();

/**
 * IPO provider component that manages IPO state and operations
 * @param {Object} props - React children components
 */
export const IPOProvider = ({ children }) => {
  const { wallet, setWallet, portfolio, setPortfolio } = useTrade();
  const { showAlert } = useAlert();
  const { user } = useAuth();
  const [appliedIPOs, setAppliedIPOs] = useState([]);

  // Fetch applied IPOs from backend when component mounts or user changes
  const fetchAppliedIPOs = async () => {
    if (!user) return;
    
    try {
      const response = await api.get("/ipo/applications");
      const applications = response.data.applications || [];
      
      // Transform backend data to frontend format
      const transformedIPOs = applications.map(app => ({
        symbol: app.ipoSymbol,
        name: app.ipoName,
        lots: app.sharesApplied,
        amount: app.amountApplied,
        issuePrice: app.amountApplied / app.sharesApplied, // Calculate issue price
        status: app.status === 'pending' ? 'applied' : app.status, // Map backend status to frontend
        appliedAt: app.applicationDate,
        allotmentDate: app.allotmentDate,
        listingDate: app.listingDate,
        listingPrice: app.listingPrice,
        sharesAllotted: app.sharesAllotted,
        amountAllotted: app.amountAllotted,
        refundAmount: app.refundAmount,
        profit: app.profitLoss,
        withdrawn: app.isWithdrawn,
        withdrawalDate: app.withdrawalDate,
        // Backend specific fields
        id: app.id,
        ipoId: app.ipoId
      }));
      
      setAppliedIPOs(transformedIPOs);
    } catch (error) {
      console.error("Failed to fetch IPO applications:", error);
    }
  };

  // Fetch applied IPOs when user changes
  useEffect(() => {
    fetchAppliedIPOs();
  }, [user]);

  /**
   * Apply for IPO function
   * @param {Object} ipo - IPO details
   * @param {number} lots - Number of lots to apply for
   */
  const applyIPO = async (ipo, lots = 1) => {
    const amount = ipo.minInvestment * lots;
    const alreadyApplied = appliedIPOs.find(
      (i) => i.symbol === ipo.symbol && i.status === "applied"
    );

    if (alreadyApplied) {
      showAlert({
        type: "warning",
        title: "Already Applied",
        message: "You have already applied for this IPO"
      });
      return;
    }

    if (wallet.balance < amount) {
      showAlert({
        type: "error",
        title: "Insufficient Balance",
        message: "You don't have enough balance for this IPO"
      });
      return;
    }

    try {
      // Call backend API to create IPO transaction
      const response = await api.post("/ipo/apply", {
        symbol: ipo.symbol,
        amount: amount,
        shares: ipo.lotSize || 1 // Send lot size or default to 1
      });

      // Update local wallet state to match backend response
      setWallet((w) => ({
        ...w,
        balance: response.data.balance, // Use backend balance
        blocked: (w.blocked || 0) + amount,
      }));

      setAppliedIPOs((prev) => [
        ...prev,
        {
          symbol: ipo.symbol,
          name: ipo.name,
          lots,
          amount,
          issuePrice: ipo.issuePrice,
          status: "applied", // applied | allotted | not_allotted
          appliedAt: new Date().toISOString(),
          listingPrice: null,
          profit: null,
          withdrawn: false,
        },
      ]);

      showAlert({
        type: "success",
        title: "IPO Applied Successfully",
        message: `Applied for ${ipo.name} IPO. Funds blocked until allotment.`
      });
      
      // Refresh applied IPOs after successful application
      await fetchAppliedIPOs();
    } catch (error) {
      showAlert({
        type: "error",
        title: "Error",
        message: error.response?.data?.message || "Failed to apply IPO"
      });
    }
  };

  /**
   * Process IPO allotments simulation
   * Randomly allots IPOs and updates portfolio
   */
  const processAllotments = () => {
    setAppliedIPOs((prev) =>
      prev.map((ipo) => {
        if (ipo.status !== "applied") return ipo;

        const allotted = Math.random() > 0.4; // 40% chance

        if (!allotted) {
          return {
            ...ipo,
            status: "not_allotted",
          };
        }

        const listingPrice = Math.round(
          ipo.issuePrice * (1.1 + Math.random() * 0.3)
        );

        const shares = ipo.lots * 1;

        setPortfolio((p) => [
          ...p,
          {
            symbol: ipo.symbol,
            quantity: shares,
            avgPrice: ipo.issuePrice,
            currentPrice: listingPrice, // ✅ Use currentPrice for consistency
            currentValue: shares * listingPrice,
            investedValue: shares * ipo.issuePrice,
            pnl: (listingPrice - ipo.issuePrice) * shares,
            pnlPercent: ((listingPrice - ipo.issuePrice) / ipo.issuePrice * 100).toFixed(2),
            type: "IPO", // 🔹 CRITICAL
            addedAt: new Date().toISOString(),
          },
        ]);

        showAlert({
          type: "success",
          title: "IPO Allotted",
          message: `${ipo.name} IPO has been allotted`
        });

        return {
          ...ipo,
          status: "allotted",
          listingPrice,
          pnl: calculateIPOPnL(
            { issuePrice: ipo.issuePrice, listingPrice },
            shares
          ),
        };
      })
    );
  };

  /**
   * Withdraw refund for non-allotted IPOs
   * @param {string} symbol - IPO symbol
   */
  const withdrawRefund = (symbol) => {
    const ipo = appliedIPOs.find(
      (i) => i.symbol === symbol && i.status === "not_allotted"
    );

    if (!ipo || ipo.withdrawn) return;

    showAlert({
      type: "success",
      title: "Refund Processed",
      message: `Refund for ${ipo.name} has been processed`
    });

    setWallet((w) => ({
      ...w,
      balance: w.balance + ipo.amount,
      blocked: (w.blocked || 0) - ipo.amount,
      invested: w.invested, // IPO refunds don't affect invested amount
    }));

    setAppliedIPOs((prev) =>
      prev.map((i) =>
        i.symbol === symbol
          ? { ...i, withdrawn: true }
          : i
      )
    );
  };

  return (
    <IPOContext.Provider
      value={{
        appliedIPOs,
        applyIPO,
        fetchAppliedIPOs,
        withdrawRefund,
      }}
    >
      {children}
    </IPOContext.Provider>
  );
};

/**
 * Hook to use IPO context in components
 * @returns {Object} - IPO context value
 */
export const useIPO = () => useContext(IPOContext);

const calculateIPOPnL = (ipo, shares) => {
  const invested = ipo.issuePrice * shares;
  const current = ipo.listingPrice * shares;

  const change = current - invested;
  const percent = ((change / invested) * 100).toFixed(2);

  return {
    change,
    percent,
    positive: change >= 0,
  };
};
