import { useState, useEffect } from "react";
import { getLiveStocks } from "../services/marketService";
import { useTrade } from "../context/TradeContext";

const Market = () => {
  const { buyStock: tradeBuyStock, sellStock: tradeSellStock } = useTrade();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStock, setSelectedStock] = useState(null);
  const [orderType, setOrderType] = useState("buy");
  const [quantity, setQuantity] = useState(1);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Stock categories
  const stockCategories = {
    all: "All Stocks",
    popular: "Popular Stocks",
    banking: "Banking & Finance",
    it: "Technology & IT",
    fmcg: "FMCG & Consumer",
    energy: "Energy & Power",
    auto: "Automobile",
    pharma: "Pharmaceutical",
    metals: "Metals & Mining"
  };

  // Popular stocks for each category
  const popularStocks = {
    popular: ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS"],
    banking: ["HDFCBANK.NS", "ICICIBANK.NS", "SBIN.NS", "KOTAKBANK.NS", "AXISBANK.NS"],
    it: ["TCS.NS", "INFY.NS", "HCLTECH.NS", "WIPRO.NS"],
    fmcg: ["HINDUNILVR.NS", "ITC.NS", "NESTLEIND.NS", "BRITANNIA.NS"],
    energy: ["NTPC.NS", "POWERGRID.NS", "TATAPOWER.NS", "ONGC.NS"],
    auto: ["MARUTI.NS", "TATAMOTORS.NS", "M&M.NS", "HEROMOTOCO.NS"],
    pharma: ["SUNPHARMA.NS", "DRREDDY.NS", "CIPLA.NS", "DIVISLAB.NS"],
    metals: ["TATASTEEL.NS", "JSWSTEEL.NS", "HINDALCO.NS", "VEDL.NS"]
  };

  useEffect(() => {
    fetchStocks();
    const interval = setInterval(fetchStocks, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [selectedCategory]);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      // Fetch specific category or all stocks
      const symbols = selectedCategory === "all" 
        ? undefined 
        : popularStocks[selectedCategory] || undefined;
      
      const response = await getLiveStocks(symbols);
      let fetchedStocks = response.data.stocks || [];
      
      // If category is selected, filter the results
      if (selectedCategory !== "all") {
        fetchedStocks = fetchedStocks.filter(stock => 
          popularStocks[selectedCategory].includes(stock.symbol)
        );
      }
      
      setStocks(fetchedStocks);
    } catch (error) {
      console.error("Failed to fetch stocks:", error);
      setMessage("Failed to load stocks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async () => {
    if (!selectedStock || quantity <= 0) {
      setMessage("Please select a stock and enter valid quantity");
      return;
    }

    try {
      if (orderType === "buy") {
        await tradeBuyStock({ 
          symbol: selectedStock.symbol, 
          quantity, 
          price: selectedStock.price 
        });
      } else {
        await tradeSellStock({ 
          symbol: selectedStock.symbol, 
          quantity, 
          price: selectedStock.price 
        });
      }
      
      setMessage(`${orderType.toUpperCase()} order placed successfully!`);
      setShowOrderModal(false);
      setSelectedStock(null);
      setQuantity(1);
      
      // Refresh stocks after order
      fetchStocks();
    } catch (error) {
      setMessage(`Failed to place order: ${error.message}`);
    }
  };

  const filteredStocks = stocks.filter(stock =>
    stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openOrderModal = (stock, type) => {
    setSelectedStock(stock);
    setOrderType(type);
    setShowOrderModal(true);
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Stock Market</h1>
          <p className="text-slate-400">Buy and sell stocks in real-time</p>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(stockCategories).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  selectedCategory === key
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="text-sm text-slate-400">
            Showing {selectedCategory === "all" ? "all available stocks" : stockCategories[selectedCategory].toLowerCase()}
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.includes("success") ? "bg-emerald-900/30 text-emerald-400" : "bg-red-900/30 text-red-400"
          }`}>
            {message}
          </div>
        )}

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search stocks by name or symbol..."
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-100 placeholder-slate-400 shadow-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-slate-400">Loading stocks...</div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 border border-slate-800/50 backdrop-blur-sm rounded-xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800/50">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-100">
                  {selectedCategory === "all" ? "All Stocks" : stockCategories[selectedCategory]}
                </h3>
                <div className="text-sm text-slate-400">
                  {filteredStocks.length} stocks found
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
                  {filteredStocks.map((stock) => (
                    <tr key={stock.symbol} className="hover:bg-slate-800/30 transition-colors">
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

        {/* Order Modal */}
        {showOrderModal && selectedStock && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/50 backdrop-blur-sm rounded-xl p-6 w-full max-w-md shadow-2xl transform transition-all">
              <h2 className="text-xl font-bold text-slate-100 mb-4">
                {orderType === "buy" ? "Buy" : "Sell"} {selectedStock.symbol}
              </h2>
              
              <div className="mb-4">
                <div className="text-sm text-slate-400 mb-2">Current Price</div>
                <div className="text-2xl font-bold text-slate-100">₹{selectedStock.price.toFixed(2)}</div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-100"
                />
              </div>

              <div className="mb-6">
                <div className="text-sm text-slate-400 mb-2">Total Amount</div>
                <div className="text-xl font-semibold text-slate-100">
                  ₹{(selectedStock.price * quantity).toFixed(2)}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleOrder}
                  className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-all duration-300 transform hover:scale-105 ${
                    orderType === "buy" 
                      ? "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800" 
                      : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                  }`}
                >
                  {orderType === "buy" ? "Place Buy Order" : "Place Sell Order"}
                </button>
                <button
                  onClick={() => {
                    setShowOrderModal(false);
                    setSelectedStock(null);
                    setMessage("");
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-all duration-300 transform hover:scale-105"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Market;
