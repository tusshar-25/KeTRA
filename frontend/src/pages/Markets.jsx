import { motion } from "framer-motion";
import useMarketData from "../hooks/useMarketData";
import { useNavigate } from "react-router-dom";

/* ---------------- COMPONENT ---------------- */

const Markets = () => {
  const { stocks, smeStocks, loading, error, activeTab, setActiveTab } = useMarketData();
  const navigate = useNavigate();

  const displayStocks = activeTab === 'sme' ? smeStocks : stocks;

  const handleStockClick = (stock) => {
    navigate(`/stock-details/${stock.symbol}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">Markets</h1>
        <p className="text-sm text-slate-400 mt-1">
          Explore popular stocks and SME stocks in real-time
        </p>
      </div>

      {/* TABS */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('popular')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
            activeTab === 'popular'
              ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Popular Stocks
        </button>
        <button
          onClick={() => setActiveTab('sme')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
            activeTab === 'sme'
              ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          SME Stocks
        </button>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 mb-6">
          <div className="text-red-400">{error}</div>
        </div>
      )}

      {/* LOADING STATE */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-slate-400">Loading market data...</div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 border border-slate-800/50 backdrop-blur-sm rounded-xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-slate-800/50">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-100">
                {activeTab === 'sme' ? 'SME Stocks' : 'Popular Stocks'}
              </h3>
              <div className="text-sm text-slate-400">
                {displayStocks.length} stocks found
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-slate-800/50 border-b border-slate-700/50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Change
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Volume
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {displayStocks.map((stock, idx) => (
                  <tr 
                    key={stock.symbol} 
                    className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => handleStockClick(stock)}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-slate-100 align-middle whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          stock.positive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {stock.symbol.slice(0, 2)}
                        </div>
                        <span>{stock.symbol}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-100 align-middle">
                      <div className="truncate max-w-[150px] sm:max-w-[200px]" title={stock.name}>
                        {stock.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-slate-100 align-middle whitespace-nowrap">
                      ₹{stock.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right align-middle">
                      <div className={`font-medium ${stock.positive ? "text-emerald-400" : "text-red-400"}`}>
                        {stock.positive ? "+" : ""}{stock.percent}
                      </div>
                      <div className="text-slate-400 text-xs">
                        {stock.positive ? "+" : ""}{stock.change.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-slate-100 align-middle whitespace-nowrap">
                      {stock.volume ? stock.volume.toLocaleString() : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Markets;
