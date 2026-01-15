import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getLiveStocks } from "../services/marketService";
import { motion } from "framer-motion";
import { useTrade } from "../context/TradeContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

const StockAnalysis = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { buyStock: tradeBuyStock, sellStock: tradeSellStock } = useTrade();
  const [stock, setStock] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("1D");
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  
  // Modal states
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderType, setOrderType] = useState("buy");
  const [quantity, setQuantity] = useState(1);
  const [orderMessage, setOrderMessage] = useState("");

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 DEBUG: Starting fetchStockData for symbol:', symbol);
        
        // Fetch current stock data
        const stocksResponse = await getLiveStocks([symbol]);
        console.log('🔍 DEBUG: Stocks response:', stocksResponse.data);
        
        const currentStock = stocksResponse.data.stocks.find(s => s.symbol === symbol);
        console.log('🔍 DEBUG: Current stock found:', currentStock);
        
        if (currentStock) {
          setStock(currentStock);
          
          // Generate mock historical data for demonstration
          console.log('🔍 DEBUG: Generating mock historical data for:', currentStock);
          const mockHistoricalData = generateMockHistoricalData(currentStock);
          console.log('🔍 DEBUG: Generated historical data:', mockHistoricalData);
          console.log('🔍 DEBUG: Historical data length:', mockHistoricalData.length);
          
          setHistoricalData(mockHistoricalData);
        } else {
          console.log('🔍 DEBUG: No stock found for symbol:', symbol);
        }
      } catch (err) {
        console.error('🔍 DEBUG: Error in fetchStockData:', err);
        setError(err.message || "Failed to load stock data");
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, [symbol]);

  const handleStockSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await getLiveStocks();
      const allStocks = response.data.stocks || [];
      
      const filtered = allStocks.filter(stock => 
        stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      setSearchResults(filtered.slice(0, 10)); // Limit to 10 results
    } catch (error) {
      console.error("Failed to search stocks:", error);
    }
  };

  const selectStock = (stock) => {
    setStock(stock);
    setSearchTerm("");
    setSearchResults([]);
    setShowSearchModal(false);
  };

  const handleOrder = async () => {
    if (!stock || quantity <= 0) {
      setOrderMessage("Please select a stock and enter valid quantity");
      return;
    }

    try {
      if (orderType === "buy") {
        await tradeBuyStock({ 
          symbol: stock.symbol, 
          quantity, 
          price: stock.price 
        });
      } else {
        await tradeSellStock({ 
          symbol: stock.symbol, 
          quantity, 
          price: stock.price 
        });
      }
      
      setOrderMessage(`${orderType.toUpperCase()} order placed successfully!`);
      setShowOrderModal(false);
      setQuantity(1);
      
      // Refresh stock data after order
      const stocksResponse = await getLiveStocks([symbol]);
      const updatedStock = stocksResponse.data.stocks.find(s => s.symbol === symbol);
      if (updatedStock) {
        setStock(updatedStock);
        const mockHistorical = generateMockHistoricalData(updatedStock);
        setHistoricalData(mockHistorical);
      }
    } catch (error) {
      setOrderMessage(`Failed to place order: ${error.message}`);
    }
  };

  const openOrderModal = (type) => {
    setOrderType(type);
    setShowOrderModal(true);
    setOrderMessage("");
  };

  const generateMockHistoricalData = (currentStock) => {
    const data = [];
    const basePrice = currentStock.price;
    const days = 30;
    
    // Generate realistic price movements with growth patterns
    let currentPrice = basePrice;
    let trend = Math.random() > 0.5 ? 1 : -1; // Overall trend direction
    
    for (let i = 0; i < days; i++) {
      // Create realistic price movements
      const dayTrend = Math.random() > 0.7 ? 1 : -1; // Daily trend
      const volatility = Math.random() * 0.03 + 0.01; // Base volatility
      const momentum = Math.random() > 0.5 ? 1 : -1; // Momentum factor
      
      // Calculate price movement
      const trendStrength = Math.abs(trend + dayTrend) > 1 ? 0.8 : 1.2; // Trend consistency
      const priceChange = (momentum * volatility * trendStrength) + (Math.random() - 0.5) * volatility;
      
      currentPrice = currentPrice * (1 + priceChange);
      
      // Generate OHLC data
      const open = currentPrice * (1 + (Math.random() - 0.5) * volatility * 0.5);
      const close = currentPrice;
      const high = Math.max(open, close) * (1 + Math.random() * volatility);
      const low = Math.min(open, close) * (1 - Math.random() * volatility);
      const volume = Math.floor(Math.random() * 2000000) + 800000;
      
      data.push({
        date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString(),
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: volume,
        change: parseFloat((close - basePrice).toFixed(2)),
        changePercent: parseFloat(((close - basePrice) / basePrice * 100).toFixed(2)),
        trend: trend > 0 ? 1 : -1,
        priceMovement: priceChange > 0 ? "up" : "down",
        growth: parseFloat(((currentPrice / basePrice - 1) * 100).toFixed(2))
      });
    }
    
    return data;
  };

  const currentPrice = stock?.price || 0;
  const previousClose = historicalData[historicalData.length - 2]?.close || currentPrice;
  const priceChange = currentPrice - previousClose;
  const priceChangePercent = previousClose > 0 ? (priceChange / previousClose) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading stock analysis...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-8 max-w-md">
          <div className="text-red-400 text-center">{error}</div>
        </div>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Stock not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.history.back()}
              className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold text-slate-100">
              {stock ? `${stock.symbol} Stock Analysis` : "Stock Analysis"}
            </h1>
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search stocks..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (e.target.value.trim()) {
                      handleStockSearch();
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleStockSearch();
                    }
                  }}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-100 placeholder-slate-400 shadow-lg"
                />
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-12 bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50">
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-slate-100 mb-3">Search Results</h3>
                      <div className="space-y-2">
                        {searchResults.map((result) => (
                          <div
                            key={result.symbol}
                            onClick={() => selectStock(result)}
                            className="p-3 bg-slate-800 rounded-lg hover:bg-slate-700 cursor-pointer transition-colors"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium text-slate-100">{result.symbol}</div>
                                <div className="text-sm text-slate-400">{result.name}</div>
                              </div>
                              <div className="text-right font-semibold text-slate-100">
                                ₹{result.price.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stock Info Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 border border-slate-800/50 backdrop-blur-sm rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold text-slate-100 mb-6">Stock Information</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Current Price</span>
                <span className="text-3xl font-bold text-slate-100">₹{currentPrice.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Day Change</span>
                <span className={`text-2xl font-bold ${priceChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {priceChange >= 0 ? "+" : ""}₹{Math.abs(priceChange).toFixed(2)} ({priceChangePercent >= 0 ? "+" : ""}{priceChangePercent.toFixed(2)}%)
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Volume</span>
                <span className="text-xl font-semibold text-slate-100">
                  {stock.volume ? stock.volume.toLocaleString() : "N/A"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Market Cap</span>
                <span className="text-xl font-semibold text-slate-100">
                  {stock.marketCap ? `₹${(stock.marketCap / 10000000).toFixed(1)}L` : "N/A"}
                </span>
              </div>

              <div className="pt-4">
                <div className="text-slate-400 text-sm mb-2">Company Name</div>
                <div className="text-lg font-medium text-slate-100">{stock.name}</div>
              </div>

              {/* Buy/Sell Buttons */}
              <div className="pt-6">
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => openOrderModal("buy")}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-medium rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Buy {stock.symbol}
                  </button>
                  <button
                    onClick={() => openOrderModal("sell")}
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Sell {stock.symbol}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Chart Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2 bg-gradient-to-br from-slate-900/60 to-slate-950/80 border border-slate-800/50 backdrop-blur-sm rounded-xl p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-slate-100">Price Chart</h2>
              
              {/* Timeframe Selector */}
              <div className="flex space-x-2">
                {["1D", "1W", "1M", "3M", "6M", "1Y"].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1 text-sm font-medium rounded-lg transition-all duration-300 ${
                      timeframe === tf
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            {/* Candlestick Chart */}
            <div className="bg-slate-800/50 rounded-lg p-4" style={{ height: "400px" }}>
              {console.log('🔍 DEBUG: Chart rendering - historicalData.length:', historicalData.length)}
              {historicalData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9ca3af"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis 
                      stroke="#9ca3af"
                      tick={{ fontSize: 10 }}
                      domain={['dataMin - 50', 'dataMax + 50']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: '#9ca3af' }}
                      formatter={(value, name) => [
                        `₹${value.toFixed(2)}`,
                        name === 'close' ? 'Price' : name
                      ]}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Area
                      type="monotone"
                      dataKey="close"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="#10b981"
                      fillOpacity={0.1}
                    />
                    <Line
                      type="monotone"
                      dataKey="high"
                      stroke="#ef4444"
                      strokeWidth={1}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="low"
                      stroke="#3b82f6"
                      strokeWidth={1}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <div className="text-center">
                    <div className="text-lg mb-2">No chart data available</div>
                    <div className="text-sm">Debug: historicalData.length = {historicalData.length}</div>
                    <div className="text-sm">Debug: stock = {stock ? 'found' : 'not found'}</div>
                    <div className="text-sm">Debug: loading = {loading ? 'true' : 'false'}</div>
                    <div className="text-sm">Debug: error = {error || 'none'}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Statistics */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-slate-100 mb-3">Statistics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">52 Week High</span>
                    <span className="text-emerald-400 font-semibold">
                      ₹{Math.max(...historicalData.map(d => d.high)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">52 Week Low</span>
                    <span className="text-red-400 font-semibold">
                      ₹{Math.min(...historicalData.map(d => d.low)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Average Volume</span>
                    <span className="text-slate-100 font-semibold">
                      {Math.round(historicalData.reduce((sum, d) => sum + d.volume, 0) / historicalData.length).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Volatility</span>
                    <span className="text-slate-100 font-semibold">
                      {(Math.random() * 20 + 10).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-slate-100 mb-3">Performance</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Period Return</span>
                    <span className={`font-semibold ${priceChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {((currentPrice / historicalData[historicalData.length - 1]?.close - 1) * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Best Day</span>
                    <span className="text-emerald-400 font-semibold">
                      +{Math.max(...historicalData.map(d => d.change)).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Worst Day</span>
                    <span className="text-red-400 font-semibold">
                      {Math.min(...historicalData.map(d => d.change)).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Order Modal */}
      {showOrderModal && stock && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/50 backdrop-blur-sm rounded-xl p-6 w-full max-w-md shadow-2xl transform transition-all">
            <h2 className="text-xl font-bold text-slate-100 mb-4">
              {orderType === "buy" ? "Buy" : "Sell"} {stock.symbol}
            </h2>
            
            {orderMessage && (
              <div className={`mb-4 p-4 rounded-lg ${
                orderMessage.includes("success") ? "bg-emerald-900/30 text-emerald-400" : "bg-red-900/30 text-red-400"
              }`}>
                {orderMessage}
              </div>
            )}

            <div className="mb-4">
              <div className="text-sm text-slate-400 mb-2">Current Price</div>
              <div className="text-2xl font-bold text-slate-100">₹{stock.price.toFixed(2)}</div>
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
                ₹{(stock.price * quantity).toFixed(2)}
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
                  setOrderMessage("");
                  setQuantity(1);
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
  );
};

export default StockAnalysis;
