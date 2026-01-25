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
      
      // Fetch stocks independently to prevent one failure from breaking everything
      let popularStocks = [];
      let smeStocks = [];
      
      try {
        const popularResponse = await getLiveStocks();
        popularStocks = popularResponse.data.stocks || [];
      } catch (popularErr) {
        console.warn("Failed to fetch popular stocks, using fallback:", popularErr.message);
        // Use cached data if available, otherwise empty array
        popularStocks = cachedStocks || [];
      }
      
      try {
        const smeResponse = await getSMEStocks();
        smeStocks = smeResponse.data.stocks || [];
      } catch (smeErr) {
        console.warn("Failed to fetch SME stocks, using fallback:", smeErr.message);
        // Use cached data if available, otherwise empty array
        smeStocks = cachedSMEStocks || [];
      }
      
      setStocks(popularStocks);
      setSMEStocks(smeStocks);
      
      // Only update cache if we got new data
      if (popularStocks.length > 0) setCachedStocks(popularStocks);
      if (smeStocks.length > 0) setCachedSMEStocks(smeStocks);
      
      // Only set error if both failed
      if (popularStocks.length === 0 && smeStocks.length === 0) {
        setError("Market data temporarily unavailable");
      }
    } catch (err) {
      console.error("Unexpected error in fetchAllStocks:", err);
      setError(err.message || "Failed to load market data");
      // Use cached data as fallback
      setStocks(cachedStocks || []);
      setSMEStocks(cachedSMEStocks || []);
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
