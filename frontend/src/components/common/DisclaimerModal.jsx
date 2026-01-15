import { motion, AnimatePresence } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

const DisclaimerModal = ({ open, onAccept }) => {
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* BACKDROP */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* MODAL */}
        <motion.div
          initial={{ scale: 0.85, y: 60, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.85, y: 60, opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="
            relative z-10 w-full max-w-xl mx-4
            bg-[#0f172a]
            border border-slate-700/60
            rounded-2xl
            p-8
            shadow-[0_30px_60px_-25px_rgba(0,0,0,0.9)]
          "
        >
          {/* TOP GLOW */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-sky-400/30 to-transparent" />

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
          >
            {/* HEADER */}
            <motion.h2
              variants={item}
              className="text-2xl font-semibold mb-2"
            >
              ⚠️ Before You Continue
            </motion.h2>

            <motion.p
              variants={item}
              className="text-sm text-slate-400 mb-6"
            >
              Please read this carefully. This is important.
            </motion.p>

            {/* CONTENT */}
            <motion.div
              variants={item}
              className="space-y-4 text-sm text-slate-400 leading-relaxed"
            >
              <p>
                <span className="text-slate-200 font-medium">keTRA</span> is a
                <strong> stock market learning & simulation platform</strong>.
                Everything you see here is designed to help you understand how
                markets work — not to trade real money.
              </p>

              <ul className="space-y-2">
                <li>• 💰 All money used is <strong>virtual</strong></li>
                <li>• 🚫 No real financial transactions occur</li>
                <li>• 🎲 This platform does <strong>not promote gambling</strong></li>
                <li>• 📊 Market data may be <strong>delayed or simulated</strong></li>
                <li>• 📚 This is <strong>not financial advice</strong></li>
              </ul>

              <p>
                By continuing, you confirm that you understand keTRA is meant
                strictly for <strong>educational purposes</strong>.
              </p>
            </motion.div>

            {/* ACTION */}
            <motion.button
              variants={item}
              onClick={onAccept}
              className="
                mt-8 w-full py-3 rounded-md font-medium
                bg-gradient-to-r from-sky-500 to-indigo-500
                hover:from-sky-400 hover:to-indigo-400
                text-slate-900
                transition
              "
            >
              I Understand & Agree
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DisclaimerModal;
