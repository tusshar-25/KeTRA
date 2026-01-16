import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Card from "../common/Card";
import Loader from "../common/Loader";
import { getTransactions } from "../../services/TransactionService";

/* ---------------- HELPERS ---------------- */

const formatDate = (date) =>
  new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const badgeStyles = {
  BUY: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  SELL: "bg-red-500/15 text-red-400 border-red-500/30",
  IPO: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
};

/* ---------------- COMPONENT ---------------- */

const TransactionHistory = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    // Only fetch transactions if user is logged in
    if (!user) return;
    
    console.log(" Fetching transactions...");
    getTransactions()
      .then((res) => {
        console.log(" Transactions response received:", res);
        console.log(" Data structure:", {
          hasData: !!res.data,
          isArray: Array.isArray(res.data),
          dataLength: res.data?.length || 0,
          firstItem: res.data?.[0] || null
        });
        setTransactions(res.data || []);
      })
      .catch((error) => {
        console.error(" Failed to fetch transactions:", error);
        console.error(" Error details:", {
          message: error.message,
          stack: error.stack
        });
        setTransactions([]); // Set empty array on error
      })
      .finally(() => {
        console.log(" Transaction fetch completed");
        setLoading(false);
      });
  }, [user]);

  // Don't show transactions if not logged in
  if (!user) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 border-slate-800/50">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-200 mb-2">
            Transaction History
          </h3>
          <p className="text-sm text-slate-400 text-center max-w-sm mb-6">
            Track your buying, selling, and IPO application history in one place
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/25"
          >
            Login to View Transactions
          </button>
        </div>
      </Card>
    );
  }

  const filteredTransactions =
    filter === "ALL"
      ? transactions
      : transactions.filter((tx) => tx.type === filter);

  if (loading) {
    return (
      <Card>
        <Loader text="Loading transactions..." />
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 border-slate-800/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-100">
              Recent Transactions
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Last 30 days</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-xs text-slate-400">Total</p>
            <p className="text-lg font-bold text-slate-100">
              {filteredTransactions.length}
            </p>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex gap-2 mb-6">
        {[
          { type: "ALL", label: "All",  },
          { type: "BUY", label: "Buy",},
          { type: "SELL", label: "Sell",},
          { type: "IPO", label: "IPO", }
        ].map((item) => (
          <button
            key={item.type}
            onClick={() => setFilter(item.type)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-300 transform hover:scale-105 ${
              filter === item.type
                ? "bg-gradient-to-r from-sky-500 to-sky-600 text-white border-sky-500/50 "
                : "bg-slate-800/60 text-slate-300 border-slate-700/50 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <span className="mr-2">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {/* EMPTY STATE */}
      {filteredTransactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h4 className="text-lg font-semibold text-slate-200 mb-2">
            No transactions found
          </h4>
          <p className="text-sm text-slate-400 text-center max-w-xs">
            {filter === "ALL" 
              ? "You haven't made any transactions yet. Start trading to see your history here."
              : `No ${filter.toLowerCase()} transactions found. Try a different filter.`
            }
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {/* Show only first 3 transactions */}
            {filteredTransactions.slice(0, 3).map((tx, index) => (
              <div
                key={tx._id}
                className="flex items-center justify-between rounded-xl border border-slate-700/50 bg-slate-800/30 px-4 py-4 hover:bg-slate-800/50 transition-all duration-300 hover:border-slate-600/50 hover:shadow-lg"
              >
                {/* LEFT */}
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    tx.type === 'BUY' ? 'bg-emerald-500/20' :
                    tx.type === 'SELL' ? 'bg-red-500/20' :
                    'bg-indigo-500/20'
                  }`}>
                    <svg className={`w-6 h-6 ${
                      tx.type === 'BUY' ? 'text-emerald-400' :
                      tx.type === 'SELL' ? 'text-red-400' :
                      'text-indigo-400'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {tx.type === 'BUY' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                      ) : tx.type === 'SELL' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      )}
                    </svg>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-100">
                      {tx.symbol || "IPO"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(tx.createdAt)}
                    </p>
                  </div>
                </div>

                {/* CENTER */}
                <span
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                    badgeStyles[tx.type]
                  }`}
                >
                  {tx.type}
                </span>

                {/* RIGHT */}
                <div className="text-right">
                  <p className={`text-base font-bold ${
                    tx.type === 'BUY' ? 'text-emerald-400' :
                    tx.type === 'SELL' ? 'text-red-400' :
                    'text-indigo-400'
                  }`}>
                    {tx.type === 'BUY' ? '+' : tx.type === 'SELL' ? '-' : ''}₹{tx.amount.toLocaleString()}
                  </p>
                  {tx.quantity && (
                    <p className="text-xs text-slate-400">
                      {tx.quantity} shares
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* SEE MORE BUTTON */}
          {filteredTransactions.length > 3 && (
            <button
              onClick={() => window.location.href = '/transactions'}
              className="w-full mt-6 py-2 bg-gradient-to-r from-sky-500/20 to-sky-600/20 hover:from-sky-500/30 hover:to-sky-600/30 text-sky-400 hover:text-sky-300 border border-sky-500/30 hover:border-sky-500/50 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-sky-500/30 flex items-center justify-center gap-3"
            >
              <span>View All Transactions</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="bg-sky-500/20 px-2.5 py-1 rounded-full text-xs font-medium border border-sky-500/30">
                {filteredTransactions.length}
              </span>
            </button>
          )}
        </>
      )}
    </Card>
  );
};

export default TransactionHistory;
