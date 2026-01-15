import { useEffect, useState } from "react";
import Card from "../components/common/Card";
import Loader from "../components/common/Loader";
import { getTransactions } from "../services/transactionService";

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

const Transactions = () => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    getTransactions()
      .then((res) => {
        setTransactions(res.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredTransactions =
    filter === "ALL"
      ? transactions
      : transactions.filter((tx) => tx.type === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <Card>
          <Loader text="Loading transactions..." />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            Transaction History
          </h1>
          <p className="text-slate-400">
            View and filter all your trading transactions
          </p>
        </div>

        <Card>
          {/* FILTERS */}
          <div className="flex gap-2 mb-6">
            {["ALL", "BUY", "SELL", "IPO"].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                  filter === type
                    ? "bg-sky-500/20 text-sky-400 border-sky-500/40"
                    : "bg-slate-900/40 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                {type}
                {type !== "ALL" && (
                  <span className="ml-2 text-xs opacity-70">
                    ({transactions.filter((tx) => tx.type === type).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* TRANSACTIONS LIST */}
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">
                No transactions found.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx._id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-6 py-4 hover:bg-slate-900/60 transition"
                >
                  {/* LEFT */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="text-base font-medium text-slate-200">
                        {tx.symbol || "IPO"}
                      </p>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          badgeStyles[tx.type]
                        }`}
                      >
                        {tx.type}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">
                      {formatDate(tx.createdAt)}
                    </p>
                  </div>

                  {/* RIGHT */}
                  <div className="text-right">
                    <p className="text-base font-medium text-white">
                      ₹{tx.amount.toLocaleString()}
                    </p>
                    {tx.quantity && (
                      <p className="text-sm text-slate-400">
                        Qty: {tx.quantity}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SUMMARY */}
          {transactions.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-800">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">
                    {transactions.length}
                  </p>
                  <p className="text-xs text-slate-400">Total Transactions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-400">
                    {transactions.filter((tx) => tx.type === "BUY").length}
                  </p>
                  <p className="text-xs text-slate-400">Buy Orders</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-400">
                    {transactions.filter((tx) => tx.type === "SELL").length}
                  </p>
                  <p className="text-xs text-slate-400">Sell Orders</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-400">
                    {transactions.filter((tx) => tx.type === "IPO").length}
                  </p>
                  <p className="text-xs text-slate-400">IPO Applications</p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Transactions;
