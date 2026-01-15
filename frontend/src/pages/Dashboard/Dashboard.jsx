import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useAlert } from "../../context/AlertContext";

import MarketOverview from "../../components/dashboard/MarketOverview";
import IPOSection from "../../components/dashboard/IPOSection";
import SIPSection from "../../components/dashboard/SIPSection";
import NewsSection from "../../components/dashboard/NewsSection";
import GainersLosers from "../../components/dashboard/GainersLosers";
import TransactionHistory from "../../components/dashboard/TransactionHistory";

/* ---------------- ANIMATIONS ---------------- */

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

/* ---------------- COMPONENT ---------------- */

const Dashboard = () => {
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const handleRequireAuth = () => {
    showAlert({
      type: "warning",
      title: "Login Required",
      message: "Please login to buy stocks",
    });
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="
        bg-gradient-to-br from-[#020617] via-[#020617] to-[#020617]
        text-slate-100
        px-6 py-8
        space-y-10
      "
    >
      {/* HEADER */}
      <motion.div variants={item}>
        <h1 className="text-3xl font-semibold tracking-tight">
          Market Dashboard
        </h1>
        <p className="text-slate-400 mt-1 max-w-2xl">
          Practice trading with real market structure using virtual funds.
        </p>
      </motion.div>

      {/* MAIN GRID */}
      <div className="grid lg:grid-cols-4 gap-8">
        {/* LEFT: MARKET, STOCKS, TRANSACTIONS */}
        <div className="lg:col-span-3 space-y-8">
          <motion.section
            variants={item}
            className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6"
          >
            <MarketOverview />
          </motion.section>

          <motion.section
            variants={item}
            className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6"
          >
            <TransactionHistory />
          </motion.section>
        </div>

        {/* RIGHT: SIP, IPO */}
        <div className="lg:col-span-1 space-y-6">
          <SIPSection />
          <IPOSection />
        </div>
      </div>

      {/* GAINERS / LOSERS */}
      <motion.section variants={item}>
        <GainersLosers />
      </motion.section>

      {/* NEWS */}
      <motion.section variants={item}>
        <NewsSection />
      </motion.section>
    </motion.div>
  );
};

export default Dashboard;
