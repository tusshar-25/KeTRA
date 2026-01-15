import { useEffect, useState } from "react";
import api from "../services/api";

const Wallet = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/wallet").then(res => setData(res.data));
  }, []);

  if (!data) return <p className="p-6">Loading...</p>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">
        Wallet
      </h1>

      <div className="mb-6 p-4 rounded-xl bg-[#0f172a] border border-slate-800">
        Balance: ₹{data.balance.toLocaleString()}
      </div>

      <h2 className="text-lg font-medium mb-3">
        Recent Transactions
      </h2>

      <div className="space-y-3">
        {data.transactions.map((t) => (
          <div
            key={t._id}
            className="flex justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 text-sm"
          >
            <span>{t.type} {t.symbol}</span>
            <span>
              {t.quantity} × ₹{t.price}
            </span>
            <span
              className={
                t.type === "BUY"
                  ? "text-red-400"
                  : "text-emerald-400"
              }
            >
              ₹{t.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Wallet;
