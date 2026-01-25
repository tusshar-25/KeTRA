import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getLiveStocks } from "../../services/marketService";

const GainersLosers = () => {
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarketMovers = async () => {
      try {
        setLoading(true);
        
        // Fetch real market data using backend API
        const symbols = [
          "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS",
          "SBIN.NS", "AXISBANK.NS", "KOTAKBANK.NS", "HINDUNILVR.NS", "ITC.NS",
          "BHARTIARTL.NS", "MARUTI.NS", "TATAMOTORS.NS", "WIPRO.NS", "HCLTECH.NS",
          "SUNPHARMA.NS", "DRREDDY.NS", "CIPLA.NS", "TATASTEEL.NS", "JSWSTEEL.NS"
        ];

        const response = await getLiveStocks(symbols);
        const stocks = response.data.stocks || [];
        
        console.log('Real market data fetched:', stocks.length, 'stocks');
        console.log('Sample data:', stocks.slice(0, 2));

        if (stocks.length > 0) {
          // Process real data from backend
          const processedStocks = stocks.map(stock => ({
            name: stock.name || stock.symbol,
            symbol: stock.symbol,
            price: stock.price || 0,
            percent: parseFloat(stock.percent?.replace('%', '') || 0),
            change: stock.change || 0
          })).filter(stock => stock.price > 0); // Filter out invalid data
          
          // Sort by percentage change
          const sortedStocks = processedStocks.sort((a, b) => b.percent - a.percent);
          
          // Get top 5 gainers and losers
          const topGainers = sortedStocks.filter(s => s.percent > 0).slice(0, 5);
          const topLosers = sortedStocks.filter(s => s.percent < 0).slice(0, 5);
          
          console.log('Real Gainers:', topGainers.length, 'Losers:', topLosers.length);
          console.log('Top Gainer:', topGainers[0]);
          console.log('Top Loser:', topLosers[0]);
          
          setGainers(topGainers);
          setLosers(topLosers);
        } else {
          throw new Error('No stocks data received');
        }
      } catch (error) {
        console.error("Failed to fetch real market data:", error);
        
        // Show current time-based message when real data fails
        setGainers([]);
        setLosers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketMovers();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Theme-matched Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-100">
              Market Movers
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Top performers today</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-slate-500">Live</span>
        </div>
      </div>

      {gainers.length === 0 && losers.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="text-lg font-semibold text-slate-200 mb-2">
            Market Closed
          </h4>
          <p className="text-sm text-slate-400">
            Check back during trading hours
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* GAINERS - Redesigned */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-emerald-500/5 to-emerald-600/5 rounded-2xl border border-emerald-500/20 p-6 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-emerald-400">
                    Top Gainers
                  </h4>
                  <p className="text-xs text-slate-500">
                    Best performers today
                  </p>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                {gainers.length}
              </div>
            </div>
            
            <div className="space-y-3">
              {gainers.slice(0, 5).map((stock, index) => (
                <motion.div
                  key={stock.symbol}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  className="group flex items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-slate-700/50 hover:border-emerald-500/40 hover:bg-slate-800/60 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                      <span className="text-sm font-bold text-emerald-400">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-100 truncate group-hover:text-emerald-400 transition-colors">
                        {stock.name}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        {stock.symbol}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-100">
                      ₹{stock.price?.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <p className="text-sm font-bold text-emerald-400">
                        +{stock.percent?.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* LOSERS - Redesigned */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-gradient-to-br from-red-500/5 to-red-600/5 rounded-2xl border border-red-500/20 p-6 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-red-400">
                    Top Losers
                  </h4>
                  <p className="text-xs text-slate-500">
                    Worst performers today
                  </p>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold">
                {losers.length}
              </div>
            </div>
            
            <div className="space-y-3">
              {losers.slice(0, 5).map((stock, index) => (
                <motion.div
                  key={stock.symbol}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  className="group flex items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-slate-700/50 hover:border-red-500/40 hover:bg-slate-800/60 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center group-hover:bg-red-500/30 transition-colors">
                      <span className="text-sm font-bold text-red-400">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-100 truncate group-hover:text-red-400 transition-colors">
                        {stock.name}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        {stock.symbol}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-100">
                      ₹{stock.price?.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                      <p className="text-sm font-bold text-red-400">
                        {stock.percent?.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Theme-matched Footer */}
      <div className="mt-6 pt-4 border-t border-slate-700/50">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            {gainers.length + losers.length} stocks tracked
          </span>
          <span>
            Yahoo Finance
          </span>
        </div>
      </div>
    </div>
  );
};

export default GainersLosers;
