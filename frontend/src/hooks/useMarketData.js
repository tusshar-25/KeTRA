import { useEffect, useState, useCallback } from "react";
import { getLiveStocks, getSMEStocks } from "../services/marketService";

// Mock data fallback when API fails
const MOCK_POPULAR_STOCKS = [
  { symbol: "RELIANCE", name: "Reliance Industries", price: 2850.50, change: 1.2, changePercent: 0.04 },
  { symbol: "TCS", name: "Tata Consultancy Services", price: 3450.75, change: -15.25, changePercent: -0.44 },
  { symbol: "HDFC", name: "HDFC Bank", price: 1650.30, change: 8.90, changePercent: 0.54 },
  { symbol: "INFY", name: "Infosys", price: 1450.60, change: -5.40, changePercent: -0.37 },
  { symbol: "ICICI", name: "ICICI Bank", price: 950.45, change: 12.30, changePercent: 1.31 },
  { symbol: "KOTAK", name: "Kotak Mahindra Bank", price: 1850.90, change: -8.75, changePercent: -0.47 },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever", price: 2550.80, change: 18.50, changePercent: 0.73 },
  { symbol: "SBIN", name: "State Bank of India", price: 650.35, change: 6.25, changePercent: 0.97 }
];

const MOCK_SME_STOCKS = [
  { symbol: "UJJIVAN", name: "Ujjivan Small Finance Bank", price: 850.25, change: 5.15, changePercent: 0.61 },
  { symbol: "FIVESTAR", name: "Five-Star Business Finance", price: 750.60, change: -3.20, changePercent: -0.42 },
  { symbol: "CSBBANK", name: "CSB Bank", price: 450.35, change: 2.85, changePercent: 0.64 },
  { symbol: "JANA", name: "Jana Small Finance Bank", price: 550.80, change: -1.45, changePercent: -0.26 },
  { symbol: "UTKARSH", name: "Utkarsh Small Finance Bank", price: 380.45, change: 4.75, changePercent: 1.26 }
];

/**
 * useMarketData
 *
 * Optimized hook for fetching market data with caching
 * Only fetches when component mounts or when explicitly called
 */
const useMarketData = () => {
  const [stocks, setStocks] = useState([]);
  const [smeStocks, setSMEStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('popular');

  // Cache the fetched data to avoid repeated API calls
  const [cachedStocks, setCachedStocks] = useState(null);
  const [cachedSMEStocks, setCachedSMEStocks] = useState(null);

  const fetchAllStocks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch stocks independently to prevent one failure from breaking everything
      let popularStocks = [];
      let smeStocks = [];
      
      try {
        const popularResponse = await getLiveStocks();
        popularStocks = popularResponse.data.stocks || [];
      } catch (popularErr) {
        console.warn("Failed to fetch popular stocks, using fallback:", popularErr.message);
        // Use cached data if available, otherwise mock data
        popularStocks = cachedStocks || MOCK_POPULAR_STOCKS;
      }
      
      try {
        const smeResponse = await getSMEStocks();
        smeStocks = smeResponse.data.stocks || [];
      } catch (smeErr) {
        console.warn("Failed to fetch SME stocks, using fallback:", smeErr.message);
        // Use cached data if available, otherwise mock data
        smeStocks = cachedSMEStocks || MOCK_SME_STOCKS;
      }
      
      setStocks(popularStocks);
      setSMEStocks(smeStocks);
      
      // Only update cache if we got new data (not mock data)
      if (popularStocks.length > 0 && popularStocks !== MOCK_POPULAR_STOCKS) {
        setCachedStocks(popularStocks);
      }
      if (smeStocks.length > 0 && smeStocks !== MOCK_SME_STOCKS) {
        setCachedSMEStocks(smeStocks);
      }
      
      // Only set error if both failed and we're using mock data
      if ((popularStocks === MOCK_POPULAR_STOCKS || popularStocks.length === 0) && 
          (smeStocks === MOCK_SME_STOCKS || smeStocks.length === 0)) {
        setError("Using demo data - market data temporarily unavailable");
      }
    } catch (err) {
      console.error("Unexpected error in fetchAllStocks:", err);
      setError("Using demo data - market data temporarily unavailable");
      // Use mock data as final fallback
      setStocks(MOCK_POPULAR_STOCKS);
      setSMEStocks(MOCK_SME_STOCKS);
    } finally {
      setLoading(false);
    }
  }, [cachedStocks, cachedSMEStocks]);

  // Only fetch on initial mount
  useEffect(() => {
    fetchAllStocks();
  }, []);

  return {
    stocks,
    smeStocks,
    loading,
    error,
    activeTab,
    setActiveTab,
    fetchAllStocks, // Expose function for manual refresh
  };
};

export default useMarketData;
