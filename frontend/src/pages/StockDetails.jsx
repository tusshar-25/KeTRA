import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getLiveStocks } from "../services/marketService";
import { motion } from "framer-motion";
import { useTrade } from "../context/TradeContext";
import { useAlert } from "../context/AlertContext";
import { isMarketOpen } from "../utils/constants";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

const StockDetails = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { buyStock: tradeBuyStock, sellStock: tradeSellStock } = useTrade();
  const { showAlert } = useAlert();
  const [stock, setStock] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderType, setOrderType] = useState("buy");
  const [quantity, setQuantity] = useState(1);
  const [orderMessage, setOrderMessage] = useState("");

  // Generate mock historical data for chart
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

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch current stock data
        const stocksResponse = await getLiveStocks([symbol]);
        const currentStock = stocksResponse.data.stocks.find(s => s.symbol === symbol);
        
        if (currentStock) {
          setStock(currentStock);
          
          // Generate mock historical data for chart
          const mockHistoricalData = generateMockHistoricalData(currentStock);
          setHistoricalData(mockHistoricalData);
        }
      } catch (err) {
        console.error("Failed to fetch stock data:", err);
        setError(err.message || "Failed to load stock data");
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, [symbol]);

  const handleOrder = async () => {
    if (!stock || quantity <= 0) {
      setOrderMessage("Please select a stock and enter valid quantity");
      return;
    }

    // Check market status
    if (!isMarketOpen()) {
      showAlert({
        type: "error",
        title: "Market Closed",
        message: "Trading is only allowed during market hours (9:15 AM - 3:30 PM IST on weekdays)"
      });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading stock details...</div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 p-4 md:p-6">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.5) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-6 space-y-4 md:space-y-0">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-4 py-2.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl transition-all duration-300 group"
            >
              <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 xl:grid-cols-1 gap-6">
          {/* Stock Info Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-1 bg-gradient-to-br from-slate-900/80 to-slate-950/90 border border-slate-800/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl"
          >
            {/* Stock Header */}
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 pb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-2xl">
                    {stock?.symbol?.substring(0, 2)}
                  </div>
                  <div className={`absolute -top-1 -right-2 w-4 h-4 rounded-full ${stock?.positive ? "bg-emerald-400" : "bg-red-400"} animate-pulse shadow-lg`}></div>
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
                    {stock?.symbol}
                  </h1>
                  <p className="text-slate-400 text-sm sm:text-base mt-1">{stock?.name}</p>
                </div>
              </div>
            </div>

            {/* Price and Change Row */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {/* Current Price Card */}
              <div className="flex-1 bg-gradient-to-r from-blue-500/20 via-purple-500/10 to-pink-500/20 rounded-xl p-5 border border-blue-500/30 shadow-lg">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 text-base lg:text-lg font-medium">Current Price</span>
                  <span className="text-2xl lg:text-1xl font-bold text-slate-100">₹{stock?.price?.toFixed(2)}</span>
                </div>
              </div>

              {/* Day Change Card */}
              <div className={`flex-1 bg-gradient-to-r ${stock?.positive ? 'from-emerald-500/20 via-green-500/10 to-emerald-500/20' : 'from-red-500/20 via-pink-500/10 to-red-500/20'} rounded-xl p-5 border ${stock?.positive ? 'border-emerald-500/30' : 'border-red-500/30'} shadow-lg`}>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 text-base lg:text-lg font-medium">Day Change</span>
                  <span className={`text-xl lg:text-base font-bold ${stock?.positive ? "text-emerald-400" : "text-red-400"}`}>
                    {stock?.positive ? "+" : ""}₹{Math.abs(stock?.change || 0).toFixed(2)} ({stock?.positive ? "+" : ""}{stock?.percent || 0}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Volume and Market Cap Row */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {/* Volume Card */}
              <div className="flex-1 bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:shadow-lg">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 text-base lg:text-lg font-medium">Volume</span>
                  <span className="text-lg lg:text-lg font-semibold text-slate-100">
                    {stock?.volume ? (stock.volume > 1000000 ? `${(stock.volume/1000000).toFixed(1)}M` : stock.volume.toLocaleString()) : "N/A"}
                  </span>
                </div>
              </div>

              {/* Market Cap Card */}
              <div className="flex-1 bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:shadow-lg">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 text-base lg:text-lg font-medium">Market Cap</span>
                  <span className="text-lg lg:text-lg font-semibold text-slate-100">
                    {stock?.marketCap ? `₹${(stock.marketCap / 10000000).toFixed(2)}L` : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Company Details */}
            <div className="lg:col-span-2 bg-slate-800/50 rounded-xl p-4 lg:p-5 border border-slate-700/50">
              <h3 className="text-slate-300 text-base lg:text-lg mb-4 font-medium">Company Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="flex justify-between items-center py-3 px-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-400 text-sm lg:text-base">Sector</span>
                  <span className="text-slate-100 font-medium text-sm lg:text-base bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-1.5 rounded-full border border-slate-600">
                    {stock?.sector || "Technology"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 px-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-400 text-sm lg:text-base">Industry</span>
                  <span className="text-slate-100 font-medium text-sm lg:text-base bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-1.5 rounded-full border border-slate-600">
                    {stock?.industry || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 px-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-400 text-sm lg:text-base">Exchange</span>
                  <span className="text-slate-100 font-medium text-sm lg:text-base bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-1.5 rounded-full border border-slate-600">
                    {stock?.exchange || "NSE"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 px-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-400 text-sm lg:text-base">Market Type</span>
                  <span className="text-slate-100 font-medium text-sm lg:text-base bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-1.5 rounded-full">
                    {stock?.marketType || "Equity"}
                  </span>
                </div>
                </div>
              </div>
              
              {/* Buy/Sell Buttons */}
              <div className="sm:col-span-2 lg:col-span-3 pt-4">
                <div className="flex gap-3">
                  <button
                    onClick={() => openOrderModal("buy")}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:via-emerald-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center"
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => openOrderModal("sell")}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 via-red-500 to-pink-600 text-white font-semibold rounded-xl hover:from-red-700 hover:via-red-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center"
                  >
                    Sell
                  </button>
                </div>
              </div>
            </motion.div>

          {/* Chart Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2 xl:col-span-3 bg-gradient-to-br from-slate-900/60 to-slate-950/80 border border-slate-800/50 backdrop-blur-sm rounded-xl p-6"
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-100">Price Chart</h2>
            </div>

            {/* Price Chart */}
            <div className="max-lg:h-[500px] lg:h-[500px]  lg:w-[400px] bg-slate-800/50 rounded-lg p-4">
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
                    <div className="text-lg mb-2">Loading chart data...</div>
                    <div className="text-sm">Historical data will appear here</div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Detailed Information Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-3 xl:col-span-4 bg-gradient-to-br from-slate-900/60 to-slate-950/80 border border-slate-800/50 backdrop-blur-sm rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold text-slate-100 mb-6">Detailed Information</h2>
            
            <div className="space-y-6">
              {/* Financial Metrics */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-slate-100 mb-4">Financial Metrics</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                  <div>
                    <div className="text-slate-400 text-sm lg:text-base mb-1">52 Week High</div>
                    <div className="text-xl lg:text-2xl font-bold text-emerald-400">
                      ₹{(stock.weekHigh52 || (stock.price * 1.2)).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-sm lg:text-base mb-1">52 Week Low</div>
                    <div className="text-xl lg:text-2xl font-bold text-red-400">
                      ₹{(stock.weekLow52 || (stock.price * 0.8)).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-sm lg:text-base mb-1">P/E Ratio</div>
                    <div className="text-xl lg:text-2xl font-bold text-slate-100">
                      {stock.peRatio || "22.5"}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-sm lg:text-base mb-1">EPS</div>
                    <div className="text-xl lg:text-2xl font-bold text-slate-100">
                      ₹{stock.eps || "45.2"}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-sm lg:text-base mb-1">Book Value</div>
                    <div className="text-xl lg:text-2xl font-bold text-slate-100">
                      ₹{(stock.bookValue || (stock.price * 0.9)).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-sm lg:text-base mb-1">Dividend Yield</div>
                    <div className="text-xl lg:text-2xl font-bold text-emerald-400">
                      {stock.dividendYield || "1.2"}%
                    </div>
                  </div>
                </div>
              </div>

                {/* Company Description */}
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-slate-100 mb-4">About Company</h3>
                  <div className="text-slate-300 text-sm leading-relaxed">
                    {stock.description || `${stock.name} is a leading company in the ${stock.sector || 'technology'} sector, engaged in ${stock.industry || 'software services'}. The company operates on the ${stock.exchange || 'NSE'} exchange and has a market capitalization of approximately ₹${stock.marketCap ? (stock.marketCap / 10000000).toFixed(2) : 'N/A'}L. The stock has shown strong performance over the past year with a ${stock.positive ? 'positive' : 'negative'} trend.`}
                  </div>
                </div>

                {/* Key Statistics */}
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-slate-100 mb-4">Key Statistics</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                    <div>
                      <div className="text-slate-400 text-sm lg:text-base mb-1">Average Volume</div>
                      <div className="text-xl lg:text-2xl font-bold text-slate-100">
                        {(stock.avgVolume || Math.floor(Math.random() * 1000000 + 500000)).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm lg:text-base mb-1">Beta</div>
                      <div className="text-xl lg:text-2xl font-bold text-slate-100">
                        {stock.beta || "1.2"}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm lg:text-base mb-1">Market Cap Rank</div>
                      <div className="text-xl lg:text-2xl font-bold text-slate-100">
                        #{stock.marketCapRank || Math.floor(Math.random() * 100 + 1)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm lg:text-base mb-1">Listed Since</div>
                      <div className="text-xl lg:text-2xl font-bold text-slate-100">
                        {stock.listedSince || "1995"}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm lg:text-base mb-1">Face Value</div>
                      <div className="text-xl lg:text-2xl font-bold text-slate-100">
                        ₹{stock.faceValue || "10"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Risk Indicators */}
                <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/90 rounded-xl p-6 border border-slate-700/50 shadow-2xl backdrop-blur-sm">
                  <h3 className="text-xl font-bold text-slate-100 mb-8 flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 via-red-600 to-pink-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    Risk Analysis
                    <div className="ml-auto">
                      <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded-full">AI Powered</span>
                    </div>
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                    {/* Risk Level Card */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="bg-gradient-to-br from-slate-700/80 to-slate-800/90 rounded-xl p-5 border border-slate-600/50 hover:border-slate-500/50 transition-all duration-300 hover:shadow-xl group"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className={`w-2 h-3 rounded-full mr-4 shadow-lg animate-pulse ${(stock.riskLevel || 'Medium') === 'Low' ? 'bg-emerald-400 shadow-emerald-400/50' : (stock.riskLevel || 'Medium') === 'High' ? 'bg-red-400 shadow-red-400/50' : 'bg-yellow-400 shadow-yellow-400/50'}`}></div>
                          <div>
                            <span className="text-slate-200 text-sm font-semibold">Risk Level</span>
                            <div className="text-xs text-slate-400 mt-1">Assessment based on volatility & market trends</div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className={`px-5 py-2 rounded-full text-sm font-bold border-2 transition-all duration-300 group-hover:scale-105 flex items-center justify-center ${(stock.riskLevel || 'Medium') === 'Low' ? 'bg-emerald-500/30 text-emerald-400 border-emerald-500/50 shadow-emerald-500/30' : (stock.riskLevel || 'Medium') === 'High' ? 'bg-red-500/30 text-red-400 border-red-500/50 shadow-red-500/30' : 'bg-yellow-500/30 text-yellow-400 border-yellow-500/50'}`}>
                            {(stock.riskLevel || 'Medium') === 'Low' && (
                              <svg className="w-4 h-4 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2m0 0l2-2m-2 2l-2 2m0 0l2 2m-2 2l-2-2" />
                              </svg>
                            )}
                            {(stock.riskLevel || 'Medium') === 'High' && (
                              <svg className="w-4 h-4 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                            )}
                            {(stock.riskLevel || 'Medium') === 'Medium' && (
                              <svg className="w-4 h-4 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                            <span className="ml-1">{stock.riskLevel || 'Medium'}</span>
                          </span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Volatility Card */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="bg-gradient-to-br from-slate-700/80 to-slate-800/90 rounded-xl p-5 border border-slate-600/50 hover:border-slate-500/50 transition-all duration-300 hover:shadow-xl group"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-4 shadow-lg animate-pulse ${(stock.volatility || 'Medium') === 'Low' ? 'bg-emerald-400 shadow-emerald-400/50' : (stock.volatility || 'Medium') === 'High' ? 'bg-red-400 shadow-red-400/50' : 'bg-yellow-400 shadow-yellow-400/50'}`}></div>
                          <div>
                            <span className="text-slate-200 text-sm font-semibold">Volatility</span>
                            <div className="text-xs text-slate-400 mt-1">Price movement over 30-day period</div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className={`text-lg font-bold px-5 py-2 rounded-full border-2 transition-all duration-300 ${(stock.volatility || 'Medium') === 'Low' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' : (stock.volatility || 'Medium') === 'High' ? 'text-red-400 bg-red-400/10 border-red-400/30' : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'}`}>
                            {(stock.volatility || 'Medium')}
                          </span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Recommendation Card */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="bg-gradient-to-br from-slate-700/80 to-slate-800/90 rounded-xl p-5 border border-slate-600/50 hover:border-slate-500/50 transition-all duration-300 hover:shadow-xl group"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-2 h-4 rounded-full mr-4 shadow-lg animate-pulse bg-blue-400 shadow-blue-400/50"></div>
                          <div>
                            <span className="text-slate-200 text-sm font-semibold">Recommendation</span>
                            <div className="text-xs text-slate-400 mt-1">AI-driven investment advice</div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className={`px-5 py-3 rounded-full text-sm font-bold border-2 flex items-center transition-all duration-300 group-hover:scale-105 ${(stock.recommendation || 'Hold') === 'Buy' ? 'bg-emerald-500/30 text-emerald-400 border-emerald-500/50 shadow-emerald-500/30' : (stock.recommendation || 'Hold') === 'Sell' ? 'bg-red-500/30 text-red-400 border-red-500/50 shadow-red-500/30' : 'bg-blue-500/30 text-blue-400 border-blue-500/50 shadow-blue-500/30'}`}>
                            {(stock.recommendation || 'Hold') === 'Buy' && (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                <span className="ml-1">Strong Buy</span>
                              </>
                            )}
                            {(stock.recommendation || 'Hold') === 'Sell' && (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8 8-4-4-6 6" />
                                </svg>
                                <span className="ml-1">Strong Sell</span>
                              </>
                            )}
                            {(stock.recommendation || 'Hold') === 'Hold' && (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="ml-1">Hold Position</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </motion.div>
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
              <label className="block text-sm font-medium text-slate-300 mb-2">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-100"
              />
            </div>

            <div className="mb-4">
              <div className="text-sm text-slate-400 mb-2">Total Amount</div>
              <div className="text-xl font-semibold text-slate-100">
                ₹{(stock.price * quantity).toFixed(2)}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleOrder}
                className={`flex-1 px-4 py-3 rounded-lg text-white font-medium transition-all duration-300 transform hover:scale-105 ${
                  orderType === "buy" 
                    ? "bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-600 hover:from-emerald-700 hover:via-emerald-600 hover:to-green-700" 
                    : "bg-gradient-to-r from-red-600 via-red-500 to-pink-600 hover:from-red-700 hover:via-red-600 hover:to-pink-700"
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
                className="flex-1 px-4 py-3 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-all duration-300 transform hover:scale-105"
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

export default StockDetails;
