import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "../assets/KeTRALogo.png";

const Welcome = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/");
    }, 5500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#020617] via-[#020617] to-[#020617] text-slate-100 flex items-center justify-center">

      {/* BACKGROUND GRADIENT */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#020617] to-[#020617]" />

      {/* ORBIT RING */}
      <motion.div
        className="absolute w-[1px] h-[590px] rounded-full border border-sky-500/10"
        animate={{ rotate: 520 }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      />

      {/* INNER GLOW */}
      <div className="absolute w-[420px] h-[420px] rounded-full bg-sky-400/5 blur-3xl" />

      {/* CENTER CONTENT */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative z-10 flex flex-col items-center text-center px-6"
      >
        {/* LOGO */}
        <motion.img
          src={logo}
          alt="keTRA logo"
          className="w-32 h-32 object-contain drop-shadow-[0_0_40px_rgba(56,189,248,0.35)]"
          initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />

        {/* NAME */}
        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-6 text-5xl md:text-6xl font-semibold tracking-wide"
        >
          ke<span className="text-sky-400/80">TRA</span>
        </motion.h1>

        {/* SUBTITLE */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-3 text-sm tracking-[0.3em] uppercase text-slate-500"
        >
          Key to Trading
        </motion.p>

        {/* DESCRIPTION */}
        <motion.p
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="mt-6 max-w-xl text-base md:text-lg text-slate-500 leading-relaxed"
        >
          A simulation platform to understand markets, IPOs, and trading logic —
          using virtual money, real discipline, and zero risk.
        </motion.p>

        {/* SYSTEM STATUS */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.4 }}
          className="mt-12 flex flex-col items-center gap-4"
        >
          {/* scan line */}
          <div className="relative w-48 h-[2px] bg-slate-700 overflow-hidden rounded">
            <motion.div
              className="absolute inset-y-0 w-1/3 bg-sky-400"
              animate={{ x: ["-99%", "300%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", times: [0, 0.5, 1] }}
            />
          </div>

          <p className="text-xs tracking-widest text-slate-500 uppercase">
            Initializing Market View
          </p>
        </motion.div>

        {/* SKIP */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.6 }}
          onClick={() => navigate("/")}
          className="mt-10 text-sm text-slate-400 hover:text-slate-200 underline underline-offset-4"
        >
          Skip intro
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Welcome;
