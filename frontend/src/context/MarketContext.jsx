import { createContext, useContext, useEffect, useState } from "react";
import { getMarketIndices } from "../services/marketService";

const MarketContext = createContext();

export const MarketProvider = ({ children }) => {
  const [indices, setIndices] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!isMounted || isPolling) return;

      try {
        setIsPolling(true);

        const res = await getMarketIndices();

        if (isMounted) {
          setIndices(res.data.indices || []);
          setLastUpdated(res.data.lastUpdated || new Date());
        }
      } catch (error) {
        console.error("Market data fetch failed:", error);
      } finally {
        setIsPolling(false);
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 10 * 60 * 1000); // 10 min

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <MarketContext.Provider value={{ indices, lastUpdated }}>
      {children}
    </MarketContext.Provider>
  );
};

export const useMarket = () => useContext(MarketContext);
