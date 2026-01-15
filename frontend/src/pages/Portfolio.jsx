import { useState, useEffect } from "react";
import { getPortfolio, getTransactions, buyStock, sellStock } from "../services/marketService";
import { useAuth } from "../context/AuthContext";
import { useTrade } from "../context/TradeContext";
import WalletSummary from "../components/dashboard/WalletSummary";
import IPOAllotmentSection from "../components/portfolio/IPOAllotmentSection";

const Portfolio = () => {
  const { isUserLoggedIn } = useAuth();
  const { wallet, buyStock: tradeBuyStock, sellStock: tradeSellStock } = useTrade();
  const [portfolio, setPortfolio] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("holdings");
  const [selectedStock, setSelectedStock] = useState(null);
  const [orderType, setOrderType] = useState("buy");
  const [quantity, setQuantity] = useState(1);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [portfolioRes, transactionsRes] = await Promise.all([
        getPortfolio(),
        getTransactions()
      ]);
      
      setPortfolio(portfolioRes.data);
      setTransactions(transactionsRes.data.transactions || []);
    } catch (error) {
      console.error("Failed to fetch portfolio data:", error);
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
          price: selectedStock.currentPrice 
        });
      } else {
        await tradeSellStock({ 
          symbol: selectedStock.symbol, 
          quantity, 
          price: selectedStock.currentPrice 
        });
      }
      
      setMessage(`${orderType.toUpperCase()} order placed successfully!`);
      setShowOrderModal(false);
      setSelectedStock(null);
      setQuantity(1);
      
      // Refresh portfolio and transactions after order
      fetchData();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">
            <div className="text-slate-400">Loading portfolio...</div>
          </div>
        </div>
      </div>
    );
  }

  const holdings = Object.entries(portfolio?.portfolio || {})
  .map(([symbol, holding]) => ({
    symbol,
    quantity: holding.quantity,
    avgPrice: holding.avgPrice,
    currentPrice: holding.currentPrice,
    currentValue: holding.currentValue,
    investedValue: holding.investedValue,
    pnl: holding.pnl,
    pnlPercent: holding.pnlPercent
  }))
  .filter(holding => holding.quantity > 0); // Only show holdings with actual shares

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Portfolio</h1>
          <p className="text-slate-400">Track your investments and transaction history</p>
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.includes("success") ? "bg-emerald-900/30 text-emerald-400" : "bg-red-900/30 text-red-400"
          }`}>
            {message}
          </div>
        )}

        {/* Wallet Summary */}
        <div className="mb-8">
          <WalletSummary />
        </div>

        {/* Portfolio Summary */}
        {portfolio && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 border border-slate-800/50 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Total Invested</h3>
              <p className="text-2xl font-bold text-slate-100">
                ₹{portfolio.totalInvested?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
              </p>
            </div>
            <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 border border-slate-800/50 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Current Value</h3>
              <p className="text-2xl font-bold text-slate-100">
                ₹{portfolio.currentValue?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
              </p>
            </div>
            <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 border border-slate-800/50 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Total P&L</h3>
              <p className={`text-2xl font-bold ${portfolio.totalPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {portfolio.totalPnL >= 0 ? "+" : ""}₹{portfolio.totalPnL?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
              </p>
            </div>
            <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 border border-slate-800/50 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Total Returns</h3>
              <p className={`text-2xl font-bold ${portfolio.totalInvested > 0 ? (portfolio.totalPnL / portfolio.totalInvested * 100) >= 0 ? "text-emerald-400" : "text-red-400" : "text-slate-400"}`}>
                {portfolio.totalInvested > 0 ? 
                  (portfolio.totalPnL / portfolio.totalInvested * 100) >= 0 ? "+" : "" : ""
                }{portfolio.totalInvested > 0 ? 
                  ((portfolio.totalPnL / portfolio.totalInvested * 100).toFixed(2)) : "0.00"
                }%
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 border border-slate-800/50 backdrop-blur-sm rounded-xl">
          <div className="border-b border-slate-800/50">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("holdings")}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === "holdings"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-slate-300"
                }`}
              >
                Holdings ({Object.keys(portfolio?.portfolio || {}).length})
              </button>
              <button
                onClick={() => setActiveTab("transactions")}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === "transactions"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-slate-300"
                }`}
              >
                Transactions ({transactions.length})
              </button>
              <button
                onClick={() => setActiveTab("ipo")}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === "ipo"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-slate-300"
                }`}
              >
                IPO Applications
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "holdings" && (
              <div>
                {holdings.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-slate-800/50 bg-gradient-to-br from-slate-900/60 to-slate-950/80 backdrop-blur-sm">
                    <table className="w-full min-w-[600px]">
                      <thead>
                        <tr className="border-b border-slate-800/50 bg-slate-800/30">
                          <th className="text-left py-4 px-4 text-xs font-semibold text-slate-300 uppercase tracking-wider">Symbol</th>
                          <th className="text-right py-4 px-4 text-xs font-semibold text-slate-300 uppercase tracking-wider">Qty</th>
                          <th className="text-right py-4 px-4 text-xs font-semibold text-slate-300 uppercase tracking-wider">Avg Price</th>
                          <th className="text-right py-4 px-4 text-xs font-semibold text-slate-300 uppercase tracking-wider">Current</th>
                          <th className="text-right py-4 px-4 text-xs font-semibold text-slate-300 uppercase tracking-wider">P&L</th>
                          <th className="text-center py-4 px-4 text-xs font-semibold text-slate-300 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {holdings.map((holding, index) => (
                          <tr key={holding.symbol} className={`border-b border-slate-800/30 transition-all duration-300 ${index % 2 === 0 ? 'bg-slate-900/20' : 'bg-slate-800/10'} hover:bg-slate-800/40 hover:shadow-lg`}>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${holding.pnl >= 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                  {holding.symbol.slice(0, 2)}
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-slate-100">{holding.symbol}</div>
                                  <div className="text-xs text-slate-400">Shares</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm font-medium text-slate-100 text-right">{holding.quantity}</div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm font-medium text-slate-100 text-right">₹{holding.avgPrice.toFixed(2)}</div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm font-medium text-slate-100 text-right">₹{holding.currentPrice.toFixed(2)}</div>
                              <div className={`text-xs text-right ${holding.currentPrice >= holding.avgPrice ? 'text-emerald-400' : 'text-red-400'}`}>
                                {holding.currentPrice >= holding.avgPrice ? '▲' : '▼'} {Math.abs(((holding.currentPrice - holding.avgPrice) / holding.avgPrice * 100).toFixed(2))}%
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-right">
                                <div className={`text-sm font-bold ${holding.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {holding.pnl >= 0 ? '+' : ''}₹{holding.pnl.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                                </div>
                                <div className={`text-xs ${holding.pnlPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {holding.pnlPercent >= 0 ? '+' : ''}{holding.pnlPercent.toFixed(1)}%
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => openOrderModal(holding, "buy")}
                                  className="group relative px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-xs font-semibold rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25 border border-emerald-500/30"
                                >
                                  <span className="relative z-10">Buy</span>
                                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </button>
                                <button
                                  onClick={() => openOrderModal(holding, "sell")}
                                  className="group relative px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-red-500/25 border border-red-500/30"
                                >
                                  <span className="relative z-10">Sell</span>
                                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-red-600 to-red-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    No holdings yet. Start by buying some stocks!
                  </div>
                )}
              </div>
            )}

            {activeTab === "transactions" && (
              <div>
                {transactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-800/50">
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Date & Time</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Type</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Symbol</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Quantity</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Price</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((transaction) => (
                          <tr key={transaction.id} className="border-b border-slate-800/30">
                            <td className="py-3 px-4 text-sm text-slate-100">
                              {new Date(transaction.timestamp).toLocaleString("en-IN")}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                transaction.type === "BUY" 
                                  ? "bg-emerald-900/30 text-emerald-400" 
                                  : "bg-red-900/30 text-red-400"
                              }`}>
                                {transaction.type}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm font-medium text-slate-100">{transaction.symbol}</td>
                            <td className="py-3 px-4 text-sm text-right text-slate-100">{transaction.quantity}</td>
                            <td className="py-3 px-4 text-sm text-right text-slate-100">₹{transaction.price.toFixed(2)}</td>
                            <td className="py-3 px-4 text-sm text-right font-medium text-slate-100">₹{transaction.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    No transactions yet. Start trading to see your history!
                  </div>
                )}
              </div>
            )}

            {activeTab === "ipo" && (
              <IPOAllotmentSection />
            )}
          </div>
        </div>

        {/* Order Modal */}
        {showOrderModal && selectedStock && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/50 backdrop-blur-sm rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-slate-100 mb-4">
                {orderType === "buy" ? "Buy" : "Sell"} {selectedStock.symbol}
              </h2>
              
              <div className="mb-4">
                <div className="text-sm text-slate-400 mb-2">Current Price</div>
                <div className="text-2xl font-bold text-slate-100">₹{selectedStock.currentPrice.toFixed(2)}</div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  max={orderType === "sell" ? selectedStock.quantity : undefined}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-100"
                />
                {orderType === "sell" && (
                  <p className="text-xs text-slate-400 mt-1">
                    Available: {selectedStock.quantity} shares
                  </p>
                )}
              </div>

              <div className="mb-6">
                <div className="text-sm text-slate-400 mb-2">Total Amount</div>
                <div className="text-xl font-semibold text-slate-100">
                  ₹{(selectedStock.currentPrice * quantity).toFixed(2)}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleOrder}
                  className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                    orderType === "buy" 
                      ? "bg-emerald-600 hover:bg-emerald-700" 
                      : "bg-red-600 hover:bg-red-700"
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
                  className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
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

export default Portfolio;
