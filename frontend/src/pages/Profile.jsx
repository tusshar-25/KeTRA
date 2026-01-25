import { useAuth } from "../context/AuthContext";
import { useTrade } from "../context/TradeContext";
import { useIPO } from "../context/IPOContext";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { getPortfolio } from "../services/marketService";

const Profile = () => {
  const { user } = useAuth();
  const { wallet, portfolio } = useTrade();
  const { appliedIPOs } = useIPO();
  const [portfolioStats, setPortfolioStats] = useState({
    totalValue: 0,
    totalInvested: 0,
    totalReturns: 0,
    returnPercentage: 0,
    stockCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolioStats = async () => {
      try {
        const portfolioRes = await getPortfolio();
        const portfolioData = portfolioRes.data.portfolio || {};
        
        let totalValue = 0;
        let totalInvested = 0;
        let stockCount = 0;

        Object.values(portfolioData).forEach(holding => {
          if (holding.quantity > 0) {
            totalValue += holding.quantity * holding.currentPrice;
            totalInvested += holding.quantity * holding.avgPrice;
            stockCount++;
          }
        });

        const totalReturns = totalValue - totalInvested;
        const returnPercentage = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

        setPortfolioStats({
          totalValue,
          totalInvested,
          totalReturns,
          returnPercentage,
          stockCount
        });
      } catch (error) {
        console.error('Failed to fetch portfolio stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPortfolioStats();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-6 border border-slate-700/50">
            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-100 mb-2">Login Required</h2>
          <p className="text-sm text-slate-400">Please login to view your profile</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-slate-100 mb-2">My Profile</h1>
          <p className="text-slate-400">Manage your account and track your investments</p>
        </motion.div>

        {/* PROFILE HEADER CARD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-3xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-violet-500/5 to-purple-500/5"></div>
          <div className="relative p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* AVATAR */}
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-3xl font-bold text-white shadow-2xl">
                  {user.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 border-4 border-slate-900 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              {/* USER INFO */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-slate-100 mb-1">{user.name}</h2>
                <p className="text-slate-400 mb-4">{user.email}</p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold">
                    {user.role?.toUpperCase()}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                    VERIFIED
                  </span>
                  <span className="px-3 py-1 rounded-full bg-slate-700/50 text-slate-300 border border-slate-600/50 text-xs font-semibold">
                    ACTIVE
                  </span>
                </div>
              </div>

              {/* QUICK STATS */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-100">₹{wallet.balance?.toLocaleString()}</p>
                  <p className="text-xs text-slate-400">Available Balance</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-100">{portfolioStats.stockCount}</p>
                  <p className="text-xs text-slate-400">Stocks Owned</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* FINANCIAL OVERVIEW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* WALLET CARD */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs text-emerald-400 font-semibold">+12.5%</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-1">Wallet Balance</h3>
            <p className="text-3xl font-bold text-emerald-400 mb-2">₹{wallet.balance?.toLocaleString()}</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Invested</span>
                <span className="text-slate-200">₹{wallet.invested?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Blocked (IPO)</span>
                <span className="text-slate-200">₹{wallet.blocked?.toLocaleString()}</span>
              </div>
            </div>
          </motion.div>

          {/* PORTFOLIO VALUE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className={`text-xs font-semibold ${portfolioStats.returnPercentage >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {portfolioStats.returnPercentage >= 0 ? '+' : ''}{portfolioStats.returnPercentage.toFixed(2)}%
              </span>
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-1">Portfolio Value</h3>
            <p className="text-3xl font-bold text-blue-400 mb-2">₹{portfolioStats.totalValue.toLocaleString()}</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Invested</span>
                <span className="text-slate-200">₹{portfolioStats.totalInvested.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Returns</span>
                <span className={`font-semibold ${portfolioStats.totalReturns >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ₹{portfolioStats.totalReturns.toLocaleString()}
                </span>
              </div>
            </div>
          </motion.div>

          {/* IPO APPLICATIONS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xs text-purple-400 font-semibold">ACTIVE</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-1">IPO Applications</h3>
            <p className="text-3xl font-bold text-purple-400 mb-2">{appliedIPOs.length}</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Applied</span>
                <span className="text-slate-200">{appliedIPOs.filter(ipo => ipo.status === 'applied').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Allotted</span>
                <span className="text-slate-200">{appliedIPOs.filter(ipo => ipo.status === 'allotted').length}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ACCOUNT SETTINGS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-xl p-6"
        >
          <h3 className="text-xl font-semibold text-slate-100 mb-6">Account Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                <div className="px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-100">
                  {user.name}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                <div className="px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-100">
                  {user.email}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Account Type</label>
                <div className="px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-100 capitalize">
                  {user.role} Account
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Member Since</label>
                <div className="px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-100">
                  {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* FOOTER */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center py-8 border-t border-slate-800/50"
        >
          <p className="text-sm text-slate-400">
            Account created and managed through keTRA Trading Platform
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Last login: {new Date().toLocaleString()}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
