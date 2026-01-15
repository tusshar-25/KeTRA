import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getIPOs } from "../services/ipoService";
import { useIPO } from "../context/IPOContext";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";
import { isMarketOpen } from "../utils/constants";

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
  const [selectedIPO, setSelectedIPO] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { showAlert } = useAlert();

  const { user } = useAuth();
  const { applyIPO, appliedIPOs } = useIPO();

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

  const handleIPOClick = (ipo) => {
    setSelectedIPO(ipo);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedIPO(null);
  };

  const handleIPOAction = () => {
    if (!user) {
      showAlert({
        type: "warning",
        title: "Login Required",
        message: "Please login to apply for IPOs"
      });
      closeModal();
      return;
    }
    
    if (!isMarketOpen()) {
      showAlert({
        type: "error",
        title: "Market Closed",
        message: "IPO applications are only allowed during market hours (9:15 AM - 3:30 PM)"
      });
      closeModal();
      return;
    }

    applyIPO(selectedIPO, 1);
    closeModal();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">IPOs</h1>
        <p className="text-sm text-slate-400 mt-1">
          Explore open and upcoming public offerings
        </p>
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
              whileHover={{ scale: 1.03 }}
              onClick={() => handleIPOClick(ipo)}
              className="
                will-change-transform
                rounded-xl
                border border-slate-800
                bg-gradient-to-br from-slate-900/60 to-slate-950/80
                p-5
                transition
                hover:border-indigo-500/40
                cursor-pointer
              "
            >
              {/* TITLE + STATUS */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-slate-100 leading-snug">
                  {ipo.name}
                </h3>

                <span
                  className={`
                    shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full
                    ${
                      ipo.status === "open"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : ipo.status === "upcoming"
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        : "bg-slate-500/15 text-slate-400 border border-slate-500/30"
                    }
                  `}
                >
                  {ipo.status.toUpperCase()}
                </span>
              </div>

              {/* DETAILS */}
              <div className="mt-3 space-y-1 text-xs text-slate-400">
                <p>
                  Price Band:{" "}
                  <span className="text-slate-300">
                    {ipo.priceBand}
                  </span>
                </p>
                <p>
                  Lot Size:{" "}
                  <span className="text-slate-300">
                    {ipo.lotSize}
                  </span>
                </p>
                <p>
                  Min Investment:{" "}
                  <span className="text-slate-300">
                    ₹{ipo.minInvestment}
                  </span>
                </p>
                <p>
                  Dates:{" "}
                  <span className="text-slate-300">
                    {ipo.openDate} → {ipo.closeDate}
                  </span>
                </p>
              </div>

              {/* ACTION */}
              {ipo.status === "open" ? (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  disabled={hasApplied(ipo.symbol)}
                  onClick={() => {
                    if (!user) {
                      showAlert({
                        type: "warning",
                        title: "Login Required",
                        message: "Please login to apply for IPOs"
                      });
                      return;
                    }
                    
                    if (!isMarketOpen()) {
                      showAlert({
                        type: "error",
                        title: "Market Closed",
                        message: "IPO applications are only allowed during market hours (9:15 AM - 3:30 PM)"
                      });
                      return;
                    }
                    try {
                      applyIPO(ipo, 1);
                      showAlert({
                        type: "success",
                        title: "Success",
                        message: "IPO applied successfully"
                      });
                    } catch (e) {
                      showAlert({
                        type: "error",
                        title: "Error",
                        message: e.message
                      });
                    }
                  }}
                  className={`
                    mt-4 w-full rounded-lg py-2 text-xs font-semibold transition
                    ${
                      hasApplied(ipo.symbol)
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : "bg-indigo-500/90 hover:bg-indigo-500 text-slate-900"
                    }
                  `}
                >
                  {hasApplied(ipo.symbol)
                    ? "Already Applied"
                    : "Apply Now"}
                </motion.button>
              ) : (
                <button
                  disabled
                  className="
                    mt-4 w-full
                    rounded-lg
                    bg-slate-800
                    text-slate-500
                    text-xs font-medium
                    py-2
                    cursor-not-allowed
                  "
                >
                  Not Available
                </button>
              )}
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* IPO DETAIL MODAL */}
      <AnimatePresence>
        {showModal && selectedIPO && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 rounded-2xl border border-slate-800 max-w-6xl w-full max-h-[95vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* MODAL HEADER */}
              <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      selectedIPO.status === 'open' ? 'bg-emerald-500' :
                      selectedIPO.status === 'upcoming' ? 'bg-amber-500' :
                      'bg-slate-500'
                    }`} />
                    <div>
                      <h2 className="text-2xl font-bold text-slate-100">
                        {selectedIPO.name}
                      </h2>
                      <p className="text-sm text-slate-400 mt-1">
                        {selectedIPO.symbol} • {selectedIPO.sector}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    selectedIPO.status === 'open' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                    selectedIPO.status === 'upcoming' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                    'bg-slate-500/20 text-slate-400 border-slate-500/30'
                  }`}>
                    {selectedIPO.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* MODAL CONTENT */}
              <div className="p-6">
                {/* Key Metrics - More Compact */}
                <div className="grid grid-cols-5 gap-3 mb-6">
                  <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Issue Price</p>
                    <p className="text-lg font-bold text-slate-100">₹{selectedIPO.issuePrice}</p>
                  </div>
                  <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Lot Size</p>
                    <p className="text-lg font-bold text-slate-100">{selectedIPO.lotSize}</p>
                    <p className="text-xs text-slate-400">shares</p>
                  </div>
                  <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Price Band</p>
                    <p className="text-base font-bold text-slate-100">{selectedIPO.priceBand}</p>
                  </div>
                  <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Min Investment</p>
                    <p className="text-lg font-bold text-slate-100">₹{selectedIPO.minInvestment}</p>
                  </div>
                  <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Status</p>
                    <p className="text-base font-bold text-slate-100">{selectedIPO.status.toUpperCase()}</p>
                  </div>
                </div>

                {/* Company Info and Dates Side by Side */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  {/* Company Information */}
                  <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                    <h3 className="text-base font-semibold text-slate-100 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                      Company Information
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <p className="text-sm text-slate-400">Name</p>
                        <p className="font-medium text-slate-100 text-sm">{selectedIPO.name}</p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-sm text-slate-400">Symbol</p>
                        <p className="font-medium text-slate-100 text-sm">{selectedIPO.symbol}</p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-sm text-slate-400">Sector</p>
                        <p className="font-medium text-slate-100 text-sm">{selectedIPO.sector}</p>
                      </div>
                    </div>
                  </div>

                  {/* Important Dates */}
                  <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                    <h3 className="text-base font-semibold text-slate-100 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                      Important Dates
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m0 0h8m0 0v8m0 0h8" />
                            </svg>
                          </div>
                          <p className="text-sm text-slate-400">Open</p>
                        </div>
                        <p className="font-medium text-slate-100 text-sm">{selectedIPO.openDate}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12v8m0 0h8m0 0v8" />
                            </svg>
                          </div>
                          <p className="text-sm text-slate-400">Close</p>
                        </div>
                        <p className="font-medium text-slate-100 text-sm">{selectedIPO.closeDate}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-indigo-500/20 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 3m0 0l-6-6m6 6v6m0 0h6" />
                            </svg>
                          </div>
                          <p className="text-sm text-slate-400">Listing</p>
                        </div>
                        <p className="font-medium text-slate-100 text-sm">{selectedIPO.listingDate}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Subscription Details (if available) - More Compact */}
                {selectedIPO.subscription && (
                  <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                    <h3 className="text-base font-semibold text-slate-100 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      Subscription Details
                    </h3>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="text-center p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <p className="text-xs text-slate-400 mb-1">Retail</p>
                        <p className="text-lg font-bold text-emerald-400">{selectedIPO.subscription.retail}x</p>
                        <p className="text-xs text-slate-400">Individual</p>
                      </div>
                      <div className="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <p className="text-xs text-slate-400 mb-1">QIB</p>
                        <p className="text-lg font-bold text-blue-400">{selectedIPO.subscription.qib}x</p>
                        <p className="text-xs text-slate-400">Institutional</p>
                      </div>
                      <div className="text-center p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <p className="text-xs text-slate-400 mb-1">NII</p>
                        <p className="text-lg font-bold text-amber-400">{selectedIPO.subscription.nii}x</p>
                        <p className="text-xs text-slate-400">Non-Institutional</p>
                      </div>
                      <div className="text-center p-3 bg-slate-700/50 rounded-lg border border-slate-600/50">
                        <p className="text-xs text-slate-400 mb-1">Total</p>
                        <p className="text-lg font-bold text-slate-100">{selectedIPO.subscription.total}x</p>
                        <p className="text-xs text-slate-400">Overall</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* MODAL FOOTER */}
              <div className="flex justify-end p-6 border-t border-slate-800">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                >
                  Close
                </button>
                {selectedIPO.status === 'open' && (
                  <button
                    onClick={handleIPOAction}
                    className="ml-3 px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition"
                  >
                    Apply IPO
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
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
