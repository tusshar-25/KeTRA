import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getIPOs } from "../services/ipoService";
import { useIPO } from "../context/IPOContext";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";
import { isMarketOpen } from "../utils/constants";
import { getMarketStatus } from "../utils/marketStatu";
import EnhancedIPOCard from "../components/ipo/EnhancedIPOCard";

const TABS = ["open", "upcoming", "closed", "applied"];

/* ---------------- ANIMATIONS ---------------- */

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const card = {
  hidden: { opacity: 1, y: 0 },
  show: { opacity: 1, y: 0 },
};

const IPO = () => {
  const [tab, setTab] = useState("open");
  const [ipos, setIpos] = useState([]);
  const [marketStatus, setMarketStatus] = useState(getMarketStatus());
  const { showAlert } = useAlert();

  const { user } = useAuth();
  const { appliedIPOs } = useIPO();

  useEffect(() => {
    // Update market status every minute
    const interval = setInterval(() => {
      setMarketStatus(getMarketStatus());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (tab === "applied") {
      // Show applied IPOs from context
      setIpos(appliedIPOs);
    } else {
      // Fetch IPOs from API for other tabs
      getIPOs(tab)
        .then((res) => setIpos(res.data))
        .catch(() => setIpos([]));
    }
  }, [tab, appliedIPOs]);

  const hasApplied = (symbol) =>
    appliedIPOs.some(
      (i) => i.symbol === symbol && i.status === "applied"
    );

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* HEADER */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">IPOs</h1>
            <p className="text-sm text-slate-400 mt-1">
              Explore open and upcoming public offerings
            </p>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-8">
        {TABS.map((t) => (
          <motion.button
            key={t}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTab(t)}
            className={`
              px-4 py-1.5 rounded-full text-sm font-medium transition
              ${
                tab === t
                  ? "bg-sky-500 text-slate-900"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }
            `}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </motion.button>
        ))}
      </div>

      {/* IPO CARDS */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          variants={container}
          initial="hidden"
          animate="show"
          exit={{ opacity: 0 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {ipos.map((ipo) => (
            <motion.div
              key={ipo.symbol}
              variants={card}
            >
              <EnhancedIPOCard 
                ipo={ipo} 
                onApplySuccess={() => {
                  // Refresh IPOs when application is successful
                  if (tab === "applied") {
                    setIpos(appliedIPOs);
                  }
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* EMPTY STATE */}
      {ipos.length === 0 && (
        <p className="text-sm text-slate-400 mt-6">
          No IPOs found in this category.
        </p>
      )}
    </div>
  );
};

export default IPO;
