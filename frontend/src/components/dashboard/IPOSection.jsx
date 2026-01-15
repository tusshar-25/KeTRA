import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useIPO } from "../../context/IPOContext";
import { useAuth } from "../../context/AuthContext";
import { useAlert } from "../../context/AlertContext";
import { getIPOs } from "../../services/ipoService";
import { useNavigate } from "react-router-dom";

/* ---------------- ANIMATIONS ---------------- */

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const card = {
  hidden: { opacity: 1, y: 0 },
  show: { opacity: 1, y: 0 },
};

/* ---------------- COMPONENT ---------------- */

const IPOSection = () => {
  const [ipos, setIpos] = useState([]);
  const navigate = useNavigate();
  const { applyIPO } = useIPO();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  useEffect(() => {
    getIPOs("open")
      .then((res) => {
        setIpos(res.data.slice(0, 4));
      })
      .catch((err) => {
        showAlert({
          type: "error",
          title: "Fetch Error",
          message: "Failed to load IPO data"
        });
      });
  }, []);

  const handleApply = (ipo) => {    
    if (!user) {
      showAlert({
        type: "warning",
        title: "Login Required",
        message: "Please login to apply for IPOs"
      });
      return;
    }

    if (ipo.status !== "open") {
  showAlert({
    type: "error",
    title: "IPO Closed",
    message: "This IPO is not open for subscription"
  });
  return;
}


    try {
      // ✅ Ensure issuePrice always exists (CRITICAL FIX)
      const issuePrice =
        ipo.issuePrice ||
        Number(String(ipo.priceBand).split("-")[0]);

      applyIPO(
        {
          ...ipo,
          issuePrice,
        },
        1 // lots
      );

      // ✅ Remove duplicate success alert - IPOContext handles it
    } catch (err) {
      showAlert({
        type: "error",
        title: "Error",
        message: err.message || "Failed to apply IPO"
      });
    }
  };

  return (
    <section className="mt-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">
              Open IPOs
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Live Opportunities</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate("/ipo")}
          className="px-4 py-2 bg-gradient-to-r from-sky-500/20 to-sky-600/20 hover:from-sky-500/30 hover:to-sky-600/30 text-sky-400 hover:text-sky-300 border border-sky-500/30 hover:border-sky-500/50 rounded-xl font-medium text-sm transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
        >
          <span>View All</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* EMPTY STATE */}
      {ipos.length === 0 && (
        <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 border-slate-800/50 backdrop-blur-sm rounded-xl p-8">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-200 mb-2">
              No Open IPOs
            </h3>
            <p className="text-sm text-slate-400 text-center max-w-sm">
              No IPOs are currently open for subscription. Check back later for new opportunities.
            </p>
          </div>
        </div>
      )}

      {/* IPO CARDS */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid md:grid-cols-2 gap-4"
      >
        {ipos.map((ipo) => (
          <motion.div
            key={ipo.symbol}
            variants={card}
            whileHover={{ scale: 1.02 }}
            className="
              will-change-transform
              relative
              rounded-xl
              border border-slate-700/50
              bg-gradient-to-br from-slate-900/60 to-slate-950/80
              p-5
              transition-all duration-300
              hover:border-sky-500/40
              hover:shadow-lg hover:shadow-sky-500/10
              backdrop-blur-sm
            "
          >
            {/* TITLE + STATUS */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="font-bold text-slate-100 text-lg leading-snug">
                  {ipo.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {ipo.symbol}
                </p>
              </div>

              <span
                className="
                  shrink-0
                  text-xs font-bold
                  px-3 py-1.5 rounded-full
                  bg-emerald-500/20 text-emerald-400
                  border border-emerald-500/30
                "
              >
                OPEN
              </span>
            </div>

            {/* DETAILS */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-400">Price Band</p>
                <p className="text-sm font-semibold text-slate-200">
                  ₹{ipo.priceBand}
                </p>
              </div>

              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-400">Min Investment</p>
                <p className="text-sm font-semibold text-slate-200">
                  ₹{ipo.minInvestment.toLocaleString()}
                </p>
              </div>

              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-400">Lot Size</p>
                <p className="text-sm font-semibold text-slate-200">
                  {ipo.lotSize || 1} shares
                </p>
              </div>
            </div>

            {/* ACTION */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleApply(ipo)}
              className="
                mt-5 w-full
                rounded-xl
                bg-gradient-to-r from-sky-500 to-sky-600
                hover:from-sky-600 hover:to-sky-700
                text-white
                font-semibold
                py-3
                transition-all duration-300
                hover:shadow-sky-500/40
              "
            >
              Apply Now
            </motion.button>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

export default IPOSection;
