import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAlert } from "../../context/AlertContext";

import MarketIndices from "../../components/dashboard/MarketIndices";
import PopularStocks from "../../components/dashboard/PopularStocks";
import SMEStocks from "../../components/dashboard/SMEStocks";
import IPOSection from "../../components/dashboard/IPOSection";
import SIPSection from "../../components/dashboard/SIPSection";
import NewsSection from "../../components/dashboard/NewsSection";
import GainersLosers from "../../components/dashboard/GainersLosers";
import TransactionHistory from "../../components/dashboard/TransactionHistory";
import MarketClosedDisclaimer from "../../components/dashboard/MarketClosedDisclaimer";

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
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      // Use IST time for consistency
      const now = new Date();
      const istTime = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
      );
      setCurrentDateTime(istTime);
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date) => {
    const options = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    const dateString = date.toLocaleDateString('en-IN', options);
    const timeString = date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    return `${dateString} ${timeString}`;
  };

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
        px-4 sm:px-6 lg:px-8 py-6 lg:py-8
        space-y-8 lg:space-y-10
        min-h-screen
      "
    >
      {/* MARKET CLOSED DISCLAIMER - Above everything */}
      <MarketClosedDisclaimer currentDateTime={currentDateTime} />

      {/* HEADER */}
      <motion.div variants={item} className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">
            Market Dashboard
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl">
            Practice trading with real market structure using virtual funds.
          </p>
        </div>
      </motion.div>

      {/* MAIN GRID - Responsive Layout */}
      <div className="space-y-6 lg:space-y-8">
        {/* Market Indices */}
        <motion.section
          variants={item}
          className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-6"
        >
          <MarketIndices />
        </motion.section>

        {/* Popular Stocks */}
        <motion.section
          variants={item}
          className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-6"
        >
          <PopularStocks />
        </motion.section>

        {/* SME Stocks */}
        <motion.section
          variants={item}
          className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-6"
        >
          <SMEStocks />
        </motion.section>

        {/* IPO Section */}
        <motion.section
          variants={item}
          className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-6"
        >
          <IPOSection />
        </motion.section>

        {/* Transaction History */}
        <motion.section
          variants={item}
          className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-6"
        >
          <TransactionHistory />
        </motion.section>

        {/* SIP Section */}
        <div>
          <SIPSection />
        </div>
      </div>

      {/* GAINERS / LOSERS - Full width on all screens */}
      <motion.section
        variants={item}
        className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-6"
      >
        <GainersLosers />
      </motion.section>

      {/* NEWS - Full width on all screens */}
      <motion.section
        variants={item}
        className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-6"
      >
        <NewsSection />
      </motion.section>
    </motion.div>
  );
};

export default Dashboard;
