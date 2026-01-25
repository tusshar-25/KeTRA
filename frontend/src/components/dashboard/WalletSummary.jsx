import Card from "../common/Card";
import Loader from "../common/Loader";
import useWallet from "../../hooks/useWallet";
import usePortfolio from "../../hooks/usePortfolio";

const WalletSummary = () => {
  const { wallet, loading } = useWallet();
  const portfolio = usePortfolio();

  if (loading || portfolio.loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 border-slate-800/50 backdrop-blur-sm">
        <Loader text="Loading wallet data..." />
      </Card>
    );
  }

  if (!wallet) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 border-slate-800/50 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 003-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-200 mb-2">
            Wallet Summary
          </h3>
          <p className="text-sm text-slate-400 text-center max-w-sm mb-6">
            Login to view your wallet balance and investment details
          </p>
        </div>
      </Card>
    );
  }

  // Calculate P&L relative to ₹400,000 baseline
  const baselineAmount = 400000;
  const currentWalletBalance = wallet.balance || 0;
  const totalInvested = portfolio.invested || 0;
  const currentValue = portfolio.currentValue || 0;
  const portfolioPnL = portfolio.pnl || 0;
  
  const difference = currentWalletBalance - baselineAmount;
  const isProfit = currentWalletBalance > baselineAmount;
  const profitLossAmount = Math.abs(difference);
  const percentage = (profitLossAmount / baselineAmount) * 100;
  const portfolioPercentage = totalInvested > 0 ? (portfolioPnL / totalInvested) * 100 : 0;

  return (
    <Card className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 border-slate-800/50 backdrop-blur-sm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-100">
                Financial Overview
              </h3>
              <p className="text-sm text-slate-400">
                {isProfit ? 'Profitable' : 'Loss'} Trading • {portfolio.holdings?.length || 0} Holdings
              </p>
            </div>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
            isProfit 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {isProfit ? '+' : ''}{percentage.toFixed(2)}% Total Return
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Current Balance */}
          <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400">Current Balance</p>
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-100">
              ₹{currentWalletBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className={`text-xs mt-1 ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
              {isProfit ? '+' : '-'}₹{profitLossAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} vs baseline
            </p>
          </div>

          {/* Total Invested */}
          <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400">Total Invested</p>
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-100">
              ₹{totalInvested.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Across {portfolio.holdings?.length || 0} positions
            </p>
          </div>

          {/* Current Value */}
          <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400">Portfolio Value</p>
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-100">
              ₹{currentValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className={`text-xs mt-1 ${portfolioPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {portfolioPnL >= 0 ? '+' : ''}₹{Math.abs(portfolioPnL).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} P&L
            </p>
          </div>

          {/* Overall P&L */}
          <div className={`bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 ${
            isProfit ? 'border-emerald-500/30' : 'border-red-500/30'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400">Overall P&L</p>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                isProfit ? 'bg-emerald-500/20' : 'bg-red-500/20'
              }`}>
                <svg className={`w-3 h-3 ${isProfit ? 'text-emerald-400' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isProfit ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
                </svg>
              </div>
            </div>
            <p className={`text-2xl font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
              {isProfit ? '+' : '-'}₹{profitLossAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {isProfit ? '+' : ''}{percentage.toFixed(2)}% from ₹400,000
            </p>
          </div>
        </div>

        {/* Additional Details */}
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-slate-400">Available Cash</p>
              <p className="text-sm font-semibold text-slate-200">
                ₹{(currentWalletBalance - totalInvested).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Portfolio P&L</p>
              <p className={`text-sm font-semibold ${portfolioPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {portfolioPnL >= 0 ? '+' : ''}{portfolioPercentage.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Return</p>
              <p className={`text-sm font-semibold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                {isProfit ? '+' : ''}{percentage.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Risk Level</p>
              <p className="text-sm font-semibold text-slate-200">
                {totalInvested > 350000 ? 'High' : totalInvested > 200000 ? 'Medium' : 'Low'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default WalletSummary;
