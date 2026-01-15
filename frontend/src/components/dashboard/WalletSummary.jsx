import Card from "../common/Card";
import Loader from "../common/Loader";
import useWallet from "../../hooks/useWallet";

const WalletSummary = () => {
  const { wallet, loading } = useWallet();

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 border-slate-800/50 backdrop-blur-sm">
        <Loader text="Loading wallet..." />
      </Card>
    );
  }

  if (!wallet) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 border-slate-800/50 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-200 mb-2">
            Wallet Summary
          </h3>
          <p className="text-sm text-slate-400 text-center max-w-sm mb-6">
            Login to view your wallet balance and investment details
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/25"
          >
            Login to View Wallet
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 border-slate-800/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-100">
              Wallet Summary
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>Portfolio Overview</span>
            </div>
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
          wallet.pnl >= 0 
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {wallet.pnl >= 0 ? '+' : ''}{((wallet.pnl / wallet.invested) * 100).toFixed(2)}%
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
          <p className="text-xs text-slate-400 mb-1">Current Balance</p>
          <p className="text-3xl font-bold text-slate-100">
            ₹{wallet.balance.toLocaleString()}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/50">
            <p className="text-xs text-slate-400 mb-1">Invested</p>
            <p className="text-lg font-semibold text-slate-200">
              ₹{wallet.invested.toLocaleString()}
            </p>
          </div>
          
          <div className={`bg-slate-800/30 rounded-xl p-3 border border-slate-700/50 ${
            wallet.pnl >= 0 ? 'border-emerald-500/30' : 'border-red-500/30'
          }`}>
            <p className="text-xs text-slate-400 mb-1">P/L</p>
            <p className={`text-lg font-semibold ${
              wallet.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {wallet.pnl >= 0 ? '+' : ''}₹{wallet.pnl.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default WalletSummary;
