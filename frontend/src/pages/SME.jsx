import { useState, useEffect } from "react";
import { getSMEStocks } from "../services/marketService";
import { useTrade } from "../context/TradeContext";

const SME = () => {
  const { buyStock: tradeBuyStock, sellStock: tradeSellStock } = useTrade();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStock, setSelectedStock] = useState(null);
  const [orderType, setOrderType] = useState("buy");
  const [quantity, setQuantity] = useState(1);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchStocks();
    const interval = setInterval(fetchStocks, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const response = await getSMEStocks();
      setStocks(response.data.stocks || []);
    } catch (error) {
      console.error("Failed to fetch SME stocks:", error);
      setMessage("Failed to load SME stocks. Please try again.");
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
          <h1 className="text-3xl font-bold text-slate-100 mb-2">SME Stocks</h1>
          <p className="text-slate-400">Buy and sell Small and Medium Enterprise stocks in real-time</p>
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
            placeholder="Search SME stocks by name or symbol..."
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-100 placeholder-slate-400 shadow-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-slate-400">Loading SME stocks...</div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 border border-slate-800/50 backdrop-blur-sm rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-slate-800/50 border-b border-slate-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Symbol
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Change
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Volume
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {filteredStocks.map((stock) => (
                    <tr key={stock.symbol} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">
                        {stock.symbol}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-100">
                        <div className="truncate max-w-xs" title={stock.name}>
                          {stock.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-slate-100">
                        ₹{stock.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <div className={`font-medium ${stock.positive ? "text-emerald-400" : "text-red-400"}`}>
                          {stock.positive ? "+" : ""}{stock.percent}
                        </div>
                        <div className="text-slate-400">
                          {stock.positive ? "+" : ""}{stock.change.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-100">
                        {stock.volume ? stock.volume.toLocaleString() : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex space-x-2 justify-center">
                          <button
                            onClick={() => openOrderModal(stock, "buy")}
                            className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-medium rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
                          >
                            Buy
                          </button>
                        </div>
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

export default SME;
