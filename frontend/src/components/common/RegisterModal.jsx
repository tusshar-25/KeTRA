import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useAlert } from "../../context/AlertContext";
import logo from "../../assets/KeTRALogo.png";

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: 32,
    transition: { duration: 0.2 },
  },
};

const RegisterModal = ({ open, onClose, switchToLogin }) => {
  const { register } = useAuth();
  const { showAlert } = useAlert();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  // 🔒 Lock background scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(form.name, form.email, form.password);
      showAlert({
        type: "success",
        title: "Registration Successful",
        message: "Welcome to keTRA! Your account has been created."
      });
      onClose();
    } catch (err) {
      showAlert({
        type: "error",
        title: "Registration Failed",
        message: err.response?.data?.message || "Registration failed"
      });
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-center justify-center"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        {/* BACKDROP */}
        <div
          onClick={onClose}
          className="absolute inset-4  backdrop-blur-sm"
        />

        {/* MODAL CARD */}
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="
            relative z-10 w-full max-w-md mx-4
            bg-[#0f172a]
            border border-slate-700/60
            rounded-2xl
            p-7
            shadow-[0_25px_80px_-30px_rgba(0,0,0,0.9)]
          "
        >
          {/* CLOSE BUTTON */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* HEADER */}
          <div className="mb-6 text-center">
            <div className="flex items-center justify-center gap-3">
              <img
                src={logo}
                alt="keTRA logo"
                className="w-10 h-10 object-contain"
              />
              <h2 className="text-xl font-semibold">
                Join <span className="text-sky-400">keTRA</span>
              </h2>
            </div>
            <p className="text-sm text-slate-400 mt-2">
              Create your free account
            </p>
          </div>

          {/* VALUE POINTS */}
          <div className="text-sm text-slate-400 space-y-1 mb-6 leading-relaxed">
            <p>• Practice with virtual ₹4,00,000</p>
            <p>• Learn stocks, IPOs & market flow</p>
            <p>• Educational only · No gambling</p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Full name"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              className="
                w-full px-5 py-2.5 rounded-full
                bg-[#020617]
                border border-slate-700
                focus:outline-none
                focus:ring-1 focus:ring-sky-400/50
              "
              required
            />

            <input
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              className="
                w-full px-5 py-2.5 rounded-full
                bg-[#020617]
                border border-slate-700
                focus:outline-none
                focus:ring-1 focus:ring-sky-400/50
              "
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              className="
                w-full px-5 py-2.5 rounded-full
                bg-[#020617]
                border border-slate-700
                focus:outline-none
                focus:ring-1 focus:ring-sky-400/50
              "
              required
            />

            <button
              type="submit"
              className="
                w-full py-2.5 rounded-xl font-medium
                bg-gradient-to-r from-sky-500 to-indigo-500
                hover:from-sky-400 hover:to-indigo-400
                text-slate-900
              "
            >
              Create account
            </button>
          </form>

          {/* SWITCH */}
          <p className="mt-5 text-sm text-slate-400 text-center">
            Already have an account?{" "}
            <button
              type="button"
              onClick={switchToLogin}
              className="text-sky-400 hover:underline"
            >
              Login
            </button>
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RegisterModal;
