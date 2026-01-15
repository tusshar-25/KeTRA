import { useMarket } from "../../context/MarketContext";
import { useAuth } from "../../context/AuthContext";
import { useTrade } from "../../context/TradeContext";
import { useState, useEffect } from "react";
import { getLiveStocks, getSMEStocks } from "../../services/marketService";

const formatTime = (date) =>
  date
    ? new Date(date).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--";

const DEFAULT_STOCKS = [
  "RELIANCE.NS",
  "TCS.NS",
  "INFY.NS",
  "HDFCBANK.NS",
  "ICICIBANK.NS",
  "SBIN.NS",
];

const DEFAULT_SME_STOCKS = [
  "VTL.NS",
  "MOTILALOFS.NS",
  "TIINDIA.NS",
  "EMAMILTD.NS",
  "GODREJIND.NS",
  "BLUESTARCO.NS",
];

const MarketOverview = () => {
  const { indices, lastUpdated } = useMarket();
  const { isUserLoggedIn } = useAuth();
  const { buyStock: tradeBuyStock, sellStock: tradeSellStock } = useTrade();
  const [stocks, setStocks] = useState([]);
  const [smeStocks, setSMEStocks] = useState([]);
  const [stocksLoading, setStocksLoading] = useState(true);
  const [smeStocksLoading, setSMEStocksLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState(null);
  const [orderType, setOrderType] = useState("buy");
  const [quantity, setQuantity] = useState(1);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setStocksLoading(true);
        setSMEStocksLoading(true);
        
        const [stocksRes, smeStocksRes] = await Promise.all([
          getLiveStocks(DEFAULT_STOCKS),
          getSMEStocks(DEFAULT_SME_STOCKS)
        ]);
        
        setStocks(stocksRes.data.stocks || []);
        setSMEStocks(smeStocksRes.data.stocks || []);
      } catch (error) {
        console.error("Failed to fetch stocks:", error);
        setStocks([]);
        setSMEStocks([]);
      } finally {
        setStocksLoading(false);
        setSMEStocksLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleOrder = async () => {
    if (!isUserLoggedIn) {
      setMessage("Please login to place orders");
      return;
    }
    
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
      const [stocksRes, smeStocksRes] = await Promise.all([
        getLiveStocks(DEFAULT_STOCKS),
        getSMEStocks(DEFAULT_SME_STOCKS)
      ]);
      setStocks(stocksRes.data.stocks || []);
      setSMEStocks(smeStocksRes.data.stocks || []);
    } catch (error) {
      setMessage(`Failed to place order: ${error.message}`);
    }
  };

  const openOrderModal = (stock, type) => {
    setSelectedStock(stock);
    setOrderType(type);
    setShowOrderModal(true);
    setMessage("");
  };

  if (!indices || indices.length === 0) {
    return (
      <div className="text-sm text-slate-400">
        Loading market data…
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes("success") ? "bg-emerald-900/30 text-emerald-400" : "bg-red-900/30 text-red-400"
        }`}>
          {message}
        </div>
      )}
      
      {/* INDICES SECTION */}
      <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 border border-slate-800/50 backdrop-blur-sm rounded-xl p-6 shadow-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100">
              Market Indices
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Indicative prices • Delayed
            </p>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
            DELAYED
          </span>
        </div>

        {/* INDICES GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {indices.map((idx) => (
            <div
              key={idx.symbol}
              className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 hover:bg-slate-800/50 transition-all duration-300 transform hover:scale-105"
            >
              <p className="text-sm text-slate-400">{idx.name}</p>
              <p className="text-2xl font-bold text-slate-100">
                {idx.value?.toLocaleString("en-IN")}
              </p>
              <div
                className={`text-sm font-medium ${
                  idx.positive
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {idx.change > 0 ? "+" : ""}
                {idx.change} ({idx.percent})
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            <span className="text-emerald-400">●</span>
            <span>Real-time prices</span>
          </div>
          <div className="text-xs text-slate-400">
            Source: Yahoo Finance
          </div>
        </div>
      </div>

      {/* STOCKS SECTION */}
      <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 border border-slate-800/50 backdrop-blur-sm rounded-xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100">
              Popular Stocks
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Indicative prices • Delayed
            </p>
          </div>
        </div>

        {stocksLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stocks.map((stock) => (
              <div
                key={stock.symbol}
                className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 hover:bg-slate-800/50 transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      {stock.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {stock.symbol}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    stock.positive
                      ? "bg-emerald-900/30 text-emerald-400"
                      : "bg-red-900/30 text-red-400"
                  }`}>
                    {stock.positive ? "↑" : "↓"} {stock.percent}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <p className="text-2xl font-bold text-slate-100">
                    ₹{stock.price?.toLocaleString("en-IN")}
                  </p>
                  <div className={`text-sm font-medium ${
                    stock.positive
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}>
                    {stock.positive ? "+" : ""}₹{stock.change?.toFixed(2)}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => openOrderModal(stock, "buy")}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-medium rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Buy
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 text-xs text-slate-400">
          Source: Yahoo Finance
        </div>
      </div>

      {/* SME STOCKS SECTION */}
      <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 border border-slate-800/50 backdrop-blur-sm rounded-xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100">
              SME Stocks
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Small & Medium Enterprise stocks • Delayed
            </p>
          </div>
        </div>

        {smeStocksLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {smeStocks.map((stock) => (
              <div
                key={stock.symbol}
                className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 hover:bg-slate-800/50 transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      {stock.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {stock.symbol}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    stock.positive
                      ? "bg-emerald-900/30 text-emerald-400"
                      : "bg-red-900/30 text-red-400"
                  }`}>
                    {stock.positive ? "↑" : "↓"} {stock.percent}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <p className="text-2xl font-bold text-slate-100">
                    ₹{stock.price?.toLocaleString("en-IN")}
                  </p>
                  <div className={`text-sm font-medium ${
                    stock.positive
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}>
                    {stock.positive ? "+" : ""}₹{stock.change?.toFixed(2)}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => openOrderModal(stock, "buy")}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-medium rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Buy
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 text-xs text-slate-400">
          Source: Yahoo Finance
        </div>
      </div>

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
    </section>
  );
};

export default MarketOverview;
