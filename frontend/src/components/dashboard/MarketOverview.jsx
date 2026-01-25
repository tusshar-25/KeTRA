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

        const stockCount = window.innerWidth >= 1280 ? 12 : window.innerWidth >= 768 ? 8 : 4;
        const smeStockCount = window.innerWidth >= 1280 ? 6 : window.innerWidth >= 768 ? 4 : 2;

        const [stocksRes, smeStocksRes] = await Promise.all([
          getLiveStocks(DEFAULT_STOCKS.slice(0, stockCount)),
          getSMEStocks(DEFAULT_SME_STOCKS.slice(0, smeStockCount)),
        ]);
        setStocks(stocksRes.data.stocks || []);
        setSMEStocks(smeStocksRes.data.stocks || []);
      } catch (error) {
        setMessage(`Failed to fetch data: ${error.message}`);
      } finally {
        setStocksLoading(false);
        setSMEStocksLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const openOrderModal = (stock, type) => {
    setSelectedStock(stock);
    setOrderType(type);
    setShowOrderModal(true);
    setMessage("");
  };

  const handleOrder = async () => {
    try {
      const amount = selectedStock.price * quantity;

      if (orderType === "buy") {
        await tradeBuyStock(selectedStock.symbol, quantity, selectedStock.price);
        setMessage(`Successfully bought ${quantity} shares of ${selectedStock.symbol}`);
      } else {
        await tradeSellStock(selectedStock.symbol, quantity, selectedStock.price);
        setMessage(`Successfully sold ${quantity} shares of ${selectedStock.symbol}`);
      }

      setShowOrderModal(false);
      setSelectedStock(null);
      setQuantity(1);

      const stockCount = window.innerWidth >= 1280 ? 12 : window.innerWidth >= 768 ? 8 : 4;
      const smeStockCount = window.innerWidth >= 1280 ? 6 : window.innerWidth >= 768 ? 4 : 2;

      const [stocksRes, smeStocksRes] = await Promise.all([
        getLiveStocks(DEFAULT_STOCKS.slice(0, stockCount)),
        getSMEStocks(DEFAULT_SME_STOCKS.slice(0, smeStockCount)),
      ]);
      setStocks(stocksRes.data.stocks || []);
      setSMEStocks(smeStocksRes.data.stocks || []);
    } catch (error) {
      setMessage(`Failed to place order: ${error.message}`);
    }
  };

  if (!indices || indices.length === 0) {
    return (
      <div className="text-sm text-slate-400">
        Loading market data…
      </div>
    );
  }

  return (
    <section className="space-y-6" >
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes("success") ? "bg-emerald-900/30 text-emerald-400" : "bg-red-900/30 text-red-400"
        }`}>
          {message}
        </div>
      )}

      {/* INDICES SECTION */}
      
      <div className="bg-slate-900/40 rounded-2xl border border-slate-800/50 p-6">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100">
              Market Indices
            </h2>
            <p className="text-xs text-slate-500">
              Real-time market data
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-slate-500">
              Live
            </span>
          </div>
        </div>

        {/* INDICES GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          {indices.map((idx) => (
            <div
              key={idx.symbol}
              className="group relative bg-slate-800/30 rounded-xl p-5 border border-slate-700/50 hover:bg-slate-700/50 transition-all duration-300 hover:border-slate-600/50 hover:shadow-lg hover:shadow-slate-500/10"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
              <p className="text-sm text-slate-400 mb-2 truncate">{idx.name}</p>
              <p className="text-2xl font-bold text-slate-100 truncate">
                {idx.value?.toLocaleString("en-IN")}
              </p>
              <div
                className={`text-sm font-medium mt-2 ${
                  idx.positive
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {idx.change > 0 ? "+" : ""}{idx.change} ({idx.percent})
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Real-time data</span>
          </div>
          <span>
            {lastUpdated ? `Updated: ${formatTime(lastUpdated)}` : 'Loading...'}
          </span>
        </div>
      </div>

      {/* STOCKS SECTION */}
      <div className="bg-slate-900/40 rounded-2xl border border-slate-800/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100">
              Popular Stocks
            </h2>
            <p className="text-xs text-slate-500">
              Top performing stocks
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/markets'}
            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 border border-slate-600/50 hover:border-slate-500/50 rounded-xl font-medium text-sm transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
          >
            <span>View All</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {stocksLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {stocks.map((stock) => (
              <div
                key={stock.symbol}
                className="will-change-transform relative rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/60 to-slate-950/80 p-5 transition-all duration-300 hover:border-sky-500/40 hover:shadow-lg hover:shadow-sky-500/10 backdrop-blur-sm"
              >
                {/* TITLE + STATUS */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-100 text-lg leading-snug truncate">
                      {stock.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {stock.symbol}
                    </p>
                  </div>

                  <span
                    className={`
                      shrink-0
                      text-xs font-bold
                      px-3 py-1.5 rounded-full
                      ${stock.positive 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }
                    `}
                  >
                    {stock.positive ? '↑' : '↓'} {stock.percent}
                  </span>
                </div>

                {/* DETAILS */}
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-400">Current Price</p>
                    <p className="text-sm font-semibold text-slate-200">
                      ₹{stock.price?.toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-400">Change</p>
                    <p className={`text-sm font-semibold ${
                      stock.positive ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {stock.positive ? '+' : ''}₹{stock.change?.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-400">Volume</p>
                    <p className="text-sm font-semibold text-slate-200">
                      {stock.volume ? stock.volume.toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* ACTION */}
                <button
                  onClick={() => openOrderModal(stock, "buy")}
                  className="mt-5 w-full rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold py-3 transition-all duration-300 hover:shadow-sky-500/40"
                >
                  Buy Now
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span>Live data</span>
          </div>
          <span>
            {stocks.length} stocks tracked
          </span>
        </div>
      </div>

      {/* SME STOCKS SECTION */}
      <div className="bg-slate-900/40 rounded-2xl border border-slate-800/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100">
              SME Stocks
            </h2>
            <p className="text-xs text-slate-500">
              Small & Medium Enterprise
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/markets'}
            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 border border-slate-600/50 hover:border-slate-500/50 rounded-xl font-medium text-sm transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
          >
            <span>View All</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {smeStocksLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {smeStocks.map((stock) => (
              <div
                key={stock.symbol}
                className="will-change-transform relative rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/60 to-slate-950/80 p-5 transition-all duration-300 hover:border-sky-500/40 hover:shadow-lg hover:shadow-sky-500/10 backdrop-blur-sm"
              >
                {/* TITLE + STATUS */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-100 text-lg leading-snug truncate">
                      {stock.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {stock.symbol}
                    </p>
                  </div>

                  <span
                    className={`
                      shrink-0
                      text-xs font-bold
                      px-3 py-1.5 rounded-full
                      ${stock.positive 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }
                    `}
                  >
                    {stock.positive ? '↑' : '↓'} {stock.percent}
                  </span>
                </div>

                {/* DETAILS */}
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-400">Current Price</p>
                    <p className="text-sm font-semibold text-slate-200">
                      ₹{stock.price?.toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-400">Change</p>
                    <p className={`text-sm font-semibold ${
                      stock.positive ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {stock.positive ? '+' : ''}₹{stock.change?.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-400">Volume</p>
                    <p className="text-sm font-semibold text-slate-200">
                      {stock.volume ? stock.volume.toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* ACTION */}
                <button
                  onClick={() => openOrderModal(stock, "buy")}
                  className="mt-5 w-full rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold py-3 transition-all duration-300 hover:shadow-sky-500/40"
                >
                  Buy Now
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span>Live data</span>
          </div>
          <span>
            {smeStocks.length} SME stocks tracked
          </span>
        </div>
      </div>

      {/* Order Modal */}
      {showOrderModal && selectedStock && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-slate-900/95 border border-slate-700/50 backdrop-blur-sm rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all">
            <h2 className="text-xl font-bold text-slate-100 mb-4">
              {orderType === "buy" ? "Buy" : "Sell"} {selectedStock.symbol}
            </h2>

            <div className="mb-4">
              <div className="text-sm text-slate-400 mb-2">Current Price</div>
              <div className="text-2xl font-bold text-slate-100">
                ₹{selectedStock.price.toFixed(2)}
              </div>
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
