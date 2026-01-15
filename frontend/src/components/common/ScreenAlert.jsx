import { motion, AnimatePresence } from "framer-motion";
import { useAlert } from "../../context/AlertContext";
import React, { useEffect } from "react";

const colors = {
  success: "from-green-400 to-emerald-500",
  error: "from-red-400 to-rose-500",
  warning: "from-yellow-400 to-orange-500",
  info: "from-sky-400 to-indigo-500",
};

const ScreenAlert = () => {
  const { alert, hideAlert } = useAlert();

  // Auto-close success alerts after 3 seconds
  React.useEffect(() => {
    if (alert?.type === 'success' && alert?.open) {
      const timer = setTimeout(() => {
        hideAlert();
      }, 3000); // 3 seconds

      return () => clearTimeout(timer);
    };
  }, [alert, hideAlert]);

  return (
    <AnimatePresence>
      {alert?.open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            onClick={hideAlert}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Alert Card */}
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 180 }}
            className="relative z-10 w-full max-w-sm mx-4 bg-[#020617] border border-slate-700 rounded-2xl p-6 text-center shadow-xl"
          >
            {/* Icon */}
            <div
              className={`w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-r ${colors[alert.type]} flex items-center justify-center text-slate-900 font-bold text-xl`}
            >
              {alert.type === "success" && "✓"}
              {alert.type === "error" && "✗"}
              {alert.type === "warning" && "⚠"}
              {alert.type === "info" && "ℹ"}
            </div>

            <h3 className="text-lg font-semibold mb-2">
              {alert.title}
            </h3>

            <p className="text-sm text-slate-400 mb-6">
              {alert.message}
            </p>

            <div className="flex gap-3 justify-center">
              {alert.onConfirm && (
                <button
                  onClick={() => {
                    alert.onConfirm();
                    hideAlert();
                  }}
                  className="px-4 py-2 rounded-full bg-sky-500 text-slate-900 text-sm font-medium"
                >
                  Confirm
                </button>
              )}

              <button
                onClick={hideAlert}
                className="px-4 py-2 rounded-full bg-slate-800 text-sm"
              >
                {alert.onConfirm ? "Cancel" : "OK"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScreenAlert;
