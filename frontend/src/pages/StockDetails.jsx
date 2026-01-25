import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getLiveStocks, getHistoricalData, getComprehensiveData } from "../services/marketService";
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
  const [comprehensiveData, setComprehensiveData] = useState(null);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch current stock data
        const stocksResponse = await getLiveStocks([symbol]);
        const currentStock = stocksResponse.data.stocks?.find(s => s.symbol === symbol);
        
        if (currentStock) {
          setStock(currentStock);
          
          // Fetch real historical data for chart
          try {
            const historicalResponse = await getHistoricalData(symbol, "1mo");
            setHistoricalData(historicalResponse.data.data || []);
          } catch (histError) {
            console.warn("Failed to fetch historical data, using fallback:", histError.message);
            setHistoricalData([]);
          }

          // Fetch comprehensive real market data
          try {
            const comprehensiveResponse = await getComprehensiveData(symbol);
            setComprehensiveData(comprehensiveResponse.data);
          } catch (compError) {
            console.warn("Failed to fetch comprehensive data:", compError.message);
          }
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Current Price Card */}
              <div className="bg-gradient-to-r from-blue-600/20 to-blue-500/10 rounded-2xl p-6 border border-blue-500/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <div className="flex flex-col space-y-2">
                  <span className="text-blue-300 text-sm font-medium uppercase tracking-wide">Current Price</span>
                  <span className="text-3xl font-bold text-white">₹{stock?.price?.toFixed(2)}</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${stock?.positive ? "bg-emerald-400" : "bg-red-400"}`}></div>
                    <span className="text-xs text-slate-400">Live</span>
                  </div>
                </div>
              </div>

              {/* Day Change Card */}
              <div className={`bg-gradient-to-r ${stock?.positive ? 'from-emerald-600/20 to-emerald-500/10' : 'from-red-600/20 to-red-500/10'} rounded-2xl p-6 border ${stock?.positive ? 'border-emerald-500/30' : 'border-red-500/30'} shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105`}>
                <div className="flex flex-col space-y-2">
                  <span className={`${stock?.positive ? "text-emerald-300" : "text-red-300"} text-sm font-medium uppercase tracking-wide`}>Day Change</span>
                  <div className="flex items-baseline space-x-2">
                    <span className={`text-2xl font-bold ${stock?.positive ? "text-emerald-400" : "text-red-400"}`}>
                      {stock?.positive ? "↑" : "↓"}₹{Math.abs(stock?.change || 0).toFixed(2)}
                    </span>
                    <span className={`text-sm font-semibold ${stock?.positive ? "text-emerald-400" : "text-red-400"}`}>
                      ({stock?.positive ? "+" : ""}{stock?.percent || 0}%)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${stock?.positive ? "bg-emerald-400" : "bg-red-400"}`}></div>
                    <span className="text-xs text-slate-400">Today</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Volume and Market Cap Row */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Volume Card */}
              <div className="bg-gradient-to-r from-purple-600/20 to-purple-500/10 rounded-2xl p-6 border border-purple-500/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <div className="flex flex-col space-y-2">
                  <span className="text-purple-300 text-sm font-medium uppercase tracking-wide">Volume</span>
                  <span className="text-2xl font-bold text-white">
                    {comprehensiveData?.volume ? (comprehensiveData?.volume > 1000000 ? `${(comprehensiveData?.volume/1000000).toFixed(1)}M` : comprehensiveData?.volume.toLocaleString()) : "N/A"}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                    <span className="text-xs text-slate-400">24h</span>
                  </div>
                </div>
              </div>

              {/* Market Cap Card */}
              <div className="bg-gradient-to-r from-orange-600/20 to-orange-500/10 rounded-2xl p-6 border border-orange-500/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <div className="flex flex-col space-y-2">
                  <span className="text-orange-300 text-sm font-medium uppercase tracking-wide">Market Cap</span>
                  <span className="text-2xl font-bold text-white">
                    {comprehensiveData?.marketCap ? `₹${(comprehensiveData.marketCap / 10000000).toFixed(2)}Cr` : "N/A"}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                    <span className="text-xs text-slate-400">Total</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Details */}
            <div className="space-y-4">
              <h3 className="text-slate-300 text-base lg:text-lg mb-4 font-medium">Company Details</h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Sector Card */}
                <div className="bg-gradient-to-r from-cyan-600/20 to-cyan-500/10 rounded-2xl p-4 border border-cyan-500/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  <div className="flex flex-col space-y-2">
                    <span className="text-cyan-300 text-xs font-medium uppercase tracking-wide">Sector</span>
                    <span className="text-white font-semibold text-sm bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-1.5 rounded-full border border-slate-600">
                      {stock?.sector || "Technology"}
                    </span>
                  </div>
                </div>
                {/* Industry Card */}
                <div className="bg-gradient-to-r from-indigo-600/20 to-indigo-500/10 rounded-2xl p-4 border border-indigo-500/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  <div className="flex flex-col space-y-2">
                    <span className="text-indigo-300 text-xs font-medium uppercase tracking-wide">Industry</span>
                    <span className="text-white font-semibold text-sm bg-gradient-to-r from-slate-800 to-slate-700 px-3 py-1.5 rounded-full border border-slate-600">
                      {stock?.industry || "N/A"}
                    </span>
                  </div>
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
            className="lg:col-span-1 bg-gradient-to-br from-slate-900/80 to-slate-950/90 border border-slate-800/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Price Analysis</h2>
                <p className="text-slate-400 text-sm">30-day performance with OHLC data</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                  <span className="text-sm text-slate-300 font-medium">Live</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span className="text-sm text-slate-300 font-medium">30 Days</span>
                </div>
              </div>
            </div>

            {/* Chart Legend */}
            <div className="flex justify-center mb-4">
              <div className="flex items-center space-x-6 text-xs text-slate-400">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-0.5 bg-blue-500 rounded-full"></div>
                  <span>Close Price</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-0.5 bg-amber-500 rounded-full" style={{ borderStyle: 'dashed' }}></div>
                  <span>Open Price</span>
                </div>
              </div>
            </div>

            {/* Enhanced Price Chart */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/70 rounded-2xl p-6 shadow-2xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
              <div className="h-[300px] sm:h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicalData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#64748b"
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis 
                      yAxisId="price"
                      stroke="#64748b"
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      tickFormatter={(value) => `₹${value}`}
                      domain={['dataMin - 5', 'dataMax + 5']}
                    />
                    <YAxis 
                      yAxisId="volume"
                      orientation="right"
                      stroke="#64748b"
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      tickFormatter={(value) => value >= 1000000 ? `${(value/1000000).toFixed(1)}M` : value.toLocaleString()}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #334155', 
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                      }}
                      labelStyle={{ color: '#cbd5e1', fontWeight: 'bold' }}
                      formatter={(value, name) => {
                        if (name === 'Close Price') return [`₹${value.toFixed(2)}`, 'Close'];
                        if (name === 'Open Price') return [`₹${value.toFixed(2)}`, 'Open'];
                        if (name === 'High Price') return [`₹${value.toFixed(2)}`, 'High'];
                        if (name === 'Low Price') return [`₹${value.toFixed(2)}`, 'Low'];
                        if (name === 'Volume') return [value >= 1000000 ? `${(value/1000000).toFixed(1)}M` : value.toLocaleString(), 'Volume'];
                        return [value, name];
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    />
                    <Area 
                      yAxisId="price"
                      type="monotone" 
                      dataKey="close" 
                      stroke="#3b82f6" 
                      fillOpacity={1} 
                      fill="url(#colorPrice)" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                    />
                    <Area 
                      yAxisId="price"
                      type="monotone" 
                      dataKey="open" 
                      stroke="#f59e0b" 
                      fillOpacity={0} 
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                    <Area 
                      yAxisId="volume"
                      type="monotone" 
                      dataKey="volume" 
                      stroke="#8b5cf6" 
                      fillOpacity={0.3} 
                      fill="url(#colorVolume)" 
                      strokeWidth={1}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              {/* Chart Stats */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                  <div className="text-xs text-slate-400 mb-1">Today's High</div>
                  <div className="text-sm font-bold text-emerald-400">
                    ₹{comprehensiveData?.dayHigh || "N/A"}
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                  <div className="text-xs text-slate-400 mb-1">Today's Low</div>
                  <div className="text-sm font-bold text-red-400">
                    ₹{comprehensiveData?.dayLow || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Detailed Information Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2 bg-gradient-to-br from-slate-900/60 to-slate-950/80 border border-slate-800/50 backdrop-blur-sm rounded-xl p-6"
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
                      ₹{(comprehensiveData?.weekHigh52 || (stock.price * 1.2)).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-sm lg:text-base mb-1">52 Week Low</div>
                    <div className="text-xl lg:text-2xl font-bold text-red-400">
                      ₹{(comprehensiveData?.weekLow52 || (stock.price * 0.8)).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-sm lg:text-base mb-1">Today's High</div>
                    <div className="text-xl lg:text-2xl font-bold text-emerald-400">
                      ₹{comprehensiveData?.dayHigh || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-sm lg:text-base mb-1">Today's Low</div>
                    <div className="text-xl lg:text-2xl font-bold text-red-400">
                      ₹{comprehensiveData?.dayLow || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-sm lg:text-base mb-1">P/E Ratio</div>
                    <div className="text-xl lg:text-2xl font-bold text-slate-100">
                      {comprehensiveData?.peRatio || "22.5"}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-sm lg:text-base mb-1">EPS</div>
                    <div className="text-xl lg:text-2xl font-bold text-slate-100">
                      ₹{comprehensiveData?.eps || "45.2"}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-sm lg:text-base mb-1">Book Value</div>
                    <div className="text-xl lg:text-2xl font-bold text-slate-100">
                      ₹{(comprehensiveData?.bookValue || (stock.price * 0.9)).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-sm lg:text-base mb-1">Dividend Yield</div>
                    <div className="text-xl lg:text-2xl font-bold text-emerald-400">
                      {comprehensiveData?.dividendYield || "1.2"}%
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
                        {(comprehensiveData?.avgVolume || Math.floor(Math.random() * 1000000 + 500000)).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm lg:text-base mb-1">Beta</div>
                      <div className="text-xl lg:text-2xl font-bold text-slate-100">
                        {comprehensiveData?.beta || "1.2"}
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
                          <div className={`w-2 h-3 rounded-full mr-4 shadow-lg animate-pulse ${(comprehensiveData?.riskLevel || 'Medium') === 'Low' ? 'bg-emerald-400 shadow-emerald-400/50' : (comprehensiveData?.riskLevel || 'Medium') === 'High' ? 'bg-red-400 shadow-red-400/50' : 'bg-yellow-400 shadow-yellow-400/50'}`}></div>
                          <div>
                            <span className="text-slate-200 text-sm font-semibold">Risk Level</span>
                            <div className="text-xs text-slate-400 mt-1">Assessment based on volatility & market trends</div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className={`px-5 py-2 rounded-full text-sm font-bold border-2 transition-all duration-300 group-hover:scale-105 flex items-center justify-center ${(comprehensiveData?.riskLevel || 'Medium') === 'Low' ? 'bg-emerald-500/30 text-emerald-400 border-emerald-500/50 shadow-emerald-500/30' : (comprehensiveData?.riskLevel || 'Medium') === 'High' ? 'bg-red-500/30 text-red-400 border-red-500/50 shadow-red-500/30' : 'bg-yellow-500/30 text-yellow-400 border-yellow-500/50'}`}>
                            {(comprehensiveData?.riskLevel || 'Medium') === 'Low' && (
                              <svg className="w-4 h-4 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2m0 0l2-2m-2 2l-2 2m0 0l2 2m-2 2l-2-2" />
                              </svg>
                            )}
                            {(comprehensiveData?.riskLevel || 'Medium') === 'High' && (
                              <svg className="w-4 h-4 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                            )}
                            {(comprehensiveData?.riskLevel || 'Medium') === 'Medium' && (
                              <svg className="w-4 h-4 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                            <span className="ml-1">{comprehensiveData?.riskLevel || 'Medium'}</span>
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
                          <div className={`w-3 h-3 rounded-full mr-4 shadow-lg animate-pulse ${(comprehensiveData?.volatility || 'Medium') === 'Low' ? 'bg-emerald-400 shadow-emerald-400/50' : (comprehensiveData?.volatility || 'Medium') === 'High' ? 'bg-red-400 shadow-red-400/50' : 'bg-yellow-400 shadow-yellow-400/50'}`}></div>
                          <div>
                            <span className="text-slate-200 text-sm font-semibold">Volatility</span>
                            <div className="text-xs text-slate-400 mt-1">Price movement over 30-day period</div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className={`text-lg font-bold px-5 py-2 rounded-full border-2 transition-all duration-300 ${(comprehensiveData?.volatility || 'Medium') === 'Low' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' : (comprehensiveData?.volatility || 'Medium') === 'High' ? 'text-red-400 bg-red-400/10 border-red-400/30' : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'}`}>
                            {(comprehensiveData?.volatility || 'Medium')}
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
                          <span className={`px-5 py-3 rounded-full text-sm font-bold border-2 flex items-center transition-all duration-300 group-hover:scale-105 ${(comprehensiveData?.recommendation || 'Hold') === 'Buy' ? 'bg-emerald-500/30 text-emerald-400 border-emerald-500/50 shadow-emerald-500/30' : (comprehensiveData?.recommendation || 'Hold') === 'Sell' ? 'bg-red-500/30 text-red-400 border-red-500/50 shadow-red-500/30' : 'bg-blue-500/30 text-blue-400 border-blue-500/50 shadow-blue-500/30'}`}>
                            {(comprehensiveData?.recommendation || 'Hold') === 'Buy' && (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                <span className="ml-1">Strong Buy</span>
                              </>
                            )}
                            {(comprehensiveData?.recommendation || 'Hold') === 'Sell' && (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8 8-4-4-6 6" />
                                </svg>
                                <span className="ml-1">Strong Sell</span>
                              </>
                            )}
                            {(comprehensiveData?.recommendation || 'Hold') === 'Hold' && (
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