import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import logo from "../assets/KeTRALogo.png";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#020617] text-slate-100 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center max-w-md"
      >
        {/* Logo */}
        <motion.img
          src={logo}
          alt="keTRA"
          className="w-20 mx-auto mb-6 opacity-90"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        />

        {/* 404 */}
        <h1 className="text-6xl font-bold tracking-tight text-sky-400">
          404
        </h1>

        {/* Message */}
        <p className="mt-4 text-lg text-slate-300">
          The page you’re looking for doesn’t exist.
        </p>

        <p className="mt-2 text-sm text-slate-500">
          It may have been moved, deleted, or never existed.
        </p>

        {/* Action */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate("/")}
          className="
            mt-8 px-6 py-2 rounded-full
            bg-gradient-to-r from-sky-500 to-indigo-500
            text-slate-900 font-medium
          "
        >
          Go back to Dashboard
        </motion.button>
      </motion.div>
    </div>
  );
};

export default NotFound;
