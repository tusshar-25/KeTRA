import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import { useTrade } from "../context/TradeContext";
import { useAlert } from "../context/AlertContext";
import { useAuth } from "../context/AuthContext";
import { isMarketOpen } from "../utils/constants";

const Trade = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const tradeState = location.state || {};
  const { showAlert } = useAlert();
  const { user } = useAuth();

  const { buyStock, sellStock, portfolio } = useTrade();

  const [type, setType] = useState(tradeState.type || "BUY");
  const [symbol, setSymbol] = useState(tradeState.symbol || "");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(tradeState.price || 0);

  const holding = portfolio.find((p) => p.symbol === symbol);
  const maxQty = holding?.quantity || 0;

  // 🔒 FORCE SELL MODE WHEN COMING FROM PORTFOLIO
  useEffect(() => {
    if (tradeState.type === "SELL") {
      setType("SELL");
      setSymbol(tradeState.symbol);
      setPrice(tradeState.price);
    }
  }, [tradeState]);

  const total = quantity * price;

 
  const handleTrade = async () => {
  // 🔒 AUTH CHECK
  if (!user) {
    showAlert({
      type: "warning",
      title: "Login Required",
      message: "Please login to place a trade",
    });
    navigate("/welcome");
    return;
  }

  if (!symbol || !price || !quantity) {
    showAlert({
      type: "warning",
      title: "Missing Information",
      message: "Please fill all fields",
    });
    return;
  }

  if (type === "SELL" && !isMarketOpen()) {
    showAlert({
      type: "error",
      title: "Market Closed",
      message: "Market is currently closed",
    });
    return;
  }

  if (type === "SELL") {
    if (!holding) {
      showAlert({
        type: "error",
        title: "No Holdings",
        message: "You do not own this stock",
      });
      return;
    }
    if (quantity > maxQty) {
      showAlert({
        type: "warning",
        title: "Exceeds Holdings",
        message: `You can sell max ${maxQty} shares`,
      });
      return;
    }
  }

  try {
    if (type === "BUY") {
      await buyStock({ symbol, quantity, price });
    } else {
      await sellStock({ symbol, quantity, price });
    }

    showAlert({
      type: "success",
      title: "Trade Successful",
      message: `${type} order executed successfully`,
    });

    navigate("/portfolio");
  } catch (err) {
    showAlert({
      type: "error",
      title: "Trade Failed",
      message:
        err.response?.data?.message ||
        err.message ||
        "Transaction failed",
    });
  }
};


  return (
    <div className="max-w-md mx-auto p-6">
      <Card>
        <h1 className="text-xl font-semibold mb-4">
          {type === "SELL" ? "Sell Stock" : "Buy Stock"}
        </h1>

        {/* TYPE TOGGLE */}
        <div className="flex gap-2 mb-4">
          {["BUY", "SELL"].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-4 py-1.5 rounded-full text-sm ${
                type === t
                  ? "bg-indigo-500 text-slate-900"
                  : "bg-slate-800 text-slate-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* SYMBOL */}
        <div className="mb-3">
          <label className="text-xs text-slate-400">Stock</label>
          <input
            value={symbol}
            disabled={type === "SELL"}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded"
          />
        </div>

        {/* PRICE */}
        <div className="mb-3">
          <label className="text-xs text-slate-400">Price</label>
          <input
            type="number"
            value={price}
            disabled={type === "SELL"}
            onChange={(e) => setPrice(+e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded opacity-70"
          />
          {type === "SELL" && (
            <p className="text-xs text-slate-400 mt-1">
              Selling at current market price
            </p>
          )}
        </div>

        {/* QUANTITY */}
        <div className="mb-3">
          <label className="text-xs text-slate-400">Quantity</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded"
          />
          {type === "SELL" && (
            <p className="text-xs text-slate-400 mt-1">
              Max sellable: {maxQty}
            </p>
          )}
        </div>

        <div className="text-xs text-slate-400 mb-3">
          Total: ₹{total.toLocaleString()}
        </div>

        <Button
          variant={type === "SELL" ? "danger" : "primary"}
          onClick={handleTrade}
          className="w-full"
        >
          Confirm {type}
        </Button>
      </Card>
    </div>
  );
};

export default Trade;
