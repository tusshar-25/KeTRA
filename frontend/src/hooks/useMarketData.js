import { useEffect, useState, useCallback } from "react";
import { getLiveStocks, getSMEStocks } from "../services/marketService";

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
      
      const [popularResponse, smeResponse] = await Promise.all([
        getLiveStocks(),
        getSMEStocks()
      ]);
      
      const popularStocks = popularResponse.data.stocks || [];
      const smeStocks = smeResponse.data.stocks || [];
      
      setStocks(popularStocks);
      setSMEStocks(smeStocks);
      setCachedStocks(popularStocks);
      setCachedSMEStocks(smeStocks);
    } catch (err) {
      console.error("Failed to fetch market data:", err);
      setError(err.message || "Failed to load market data");
    } finally {
      setLoading(false);
    }
  }, []);

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
