import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAlert } from "../../context/AlertContext";
import { FaHome, FaChartLine, FaHandHoldingUsd, FaBriefcase } from "react-icons/fa";
import logo from "../../assets/KeTRALogo.png";

/* ================= NAVBAR ================= */
const HomeIcon = () => (
  <FaHome className="w-5 h-5 text-slate-300" />
);

const MarketIcon = () => (
  <FaChartLine className="w-5 h-5 text-slate-300" />

);

const IPOIcon = () => (
  <FaHandHoldingUsd className="w-5 h-5 text-slate-300" />

);

const PortfolioIcon = () => (
  <FaBriefcase className="w-5 h-5 text-slate-300" />

);

const Navbar = ({ onAuthOpen }) => {
  const { user, logout } = useAuth();
  const { showAlert } = useAlert();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    showAlert({
      type: "success",
      title: "Logout Successful",
      message: "You have been logged out successfully."
    });
    logout();
  };

  return (
    <>
      {/* ================= DESKTOP NAVBAR ================= */}
      <nav className="hidden md:block sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto h-14 px-6 flex items-center justify-between">
          {/* LEFT */}
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-20 overflow-visible">
              <img
                src={logo}
                alt="keTRA"
                className="absolute -top-2 left-1/2 -translate-x-1/2 w-15 h-16 object-contain"
              />
            </div>
            <span className="text-lg font-semibold tracking-wide">
              ke<span className="text-sky-400">TRA</span>
            </span>
          </div>

          {/* CENTER */}
          <div className="flex items-center gap-8 text-sm ">
            <NavItem label="Dashboard" to="/" active={isActive("/")} />
            <NavItem label="Markets" to="/markets" active={isActive("/markets")} />
            <NavItem label="IPO" to="/ipo" active={isActive("/ipo")} />
            {user && (<NavItem label="Portfolio" to="/portfolio" active={isActive("/portfolio")} />)}
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3">
            {user && (
              <button
                onClick={() => navigate("/profile")}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 transition flex items-center justify-center"
                title="Profile"
              >
                <svg
    className="w-5 h-5 text-slate-300"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="7" r="4" />
    <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
  </svg>
              </button>
            )}

            <div className="flex items-center gap-3">
  {user ? (
    <>
      {/* Logout */}
      <button
        onClick={handleLogout}
        className="px-4 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-sm transition"
      >
        Logout
      </button>
    </>
  ) : (
    <>
      {/* Login */}
      <button
        onClick={() => onAuthOpen("login")}
        className="px-4 py-1.5 rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm transition"
      >
        Login
      </button>

      {/* Create Account */}
      <button
        onClick={() => onAuthOpen("register")}
        className="px-4 py-1.5 rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition"
      >
        Create account
      </button>
    </>
  )}
</div>

              
            
          </div>
        </div>
      </nav>

      {/* ================= MOBILE TOP NAV ================= */}
      <nav className="md:hidden sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800">
        <div className="h-14 px-4 flex items-center justify-between">
          {/* LEFT - Logo + Name */}
          <div className="flex items-center gap-2">
            <div className="relative h-10 w-20 overflow-visible">
              <img
                src={logo}
                alt="keTRA"
                className="absolute -top-2 left-1/2 -translate-x-1/2 w-15 h-16 object-contain"
              />
            </div>
            <span className="text-lg font-semibold tracking-wide">
              ke<span className="text-sky-400">TRA</span>
            </span>
          </div>

          {/* RIGHT - User Profile/Login */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Profile Button */}
                <button
                  onClick={() => navigate("/profile")}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 transition flex items-center justify-center"
                  title="Profile"
                >
                  <svg
                    className="w-4 h-4 text-slate-300"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="7" r="4" />
                    <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
                  </svg>
                </button>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-xs transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* Login Button */}
                <button
                  onClick={() => onAuthOpen("login")}
                  className="px-3 py-1 rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs transition"
                >
                  Login
                </button>

                {/* Register Button */}
                <button
                  onClick={() => onAuthOpen("register")}
                  className="px-3 py-1 rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium transition"
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ================= MOBILE BOTTOM NAV ================= */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950 border-t border-slate-800">
        <div className="flex justify-around items-center py-2">
          <MobileItem to="/" label="Home" icon={<HomeIcon />} active={isActive("/")} />
          <MobileItem to="/markets" label="Markets" icon={<MarketIcon />} active={isActive("/markets")} />
          <MobileItem to="/ipo" label="IPO" icon={<IPOIcon />} active={isActive("/ipo")} />
          <div
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                e.stopPropagation();
                showAlert({
                  type: "warning",
                  title: "Login Required",
                  message: "Please login to access your portfolio",
                });
                navigate("/")
              }
            }}
          >
            <MobileItem
              to="/portfolio"
              label="Portfolio"
              icon={<PortfolioIcon />}
              active={isActive("/portfolio")}
            />
          </div>
        </div>
      </div>
    </>
  );
};

/* ================= HELPERS ================= */

const NavItem = ({ label, to, active }) => (
  <Link
    to={to}
    className={`
       relative
       bg-slate-950/90 backdrop-blur-xl
       border rounded-full border-slate-950
       hover:bg-slate-800/20
       hover:rounded-lg
       hover:drop-shadow-[0_0_8px_rgba(5,10,23,0.4)]
       hover:scale-105
       transition-all duration-300 ease-out
       group
        ${active ? "text-slate-100" : "text-slate-400 hover:text-slate-200"}
    `}
  >
    {/* MULTI-LAYER BACKGROUND FOR ACTIVE STATE */}
    

    {/* ICON WITH ENHANCED EFFECTS */}
    <span
        className={`transition-all duration-300 relative z-10 ${
          active ? "scale-110 " : "group-hover:scale-105"
        }`}
      >
        {label}
      </span>

    {/* DESKTOP-STYLE HOVER LINE */}
    {active && (
      <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-sky-400" />
      )}

    {/* ENHANCED HOVER LINE FOR NON-ACTIVE */}
    {!active && (
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent transition-all duration-300 ease-out group-hover:w-5" />
      )}

    {/* ACTIVE STATE PULSE EFFECT */}
    {active && (
      <div className="absolute inset-0 rounded-xl animate-pulse bg-sky-400/5" />
      )}
  </Link>
);

const MobileItem = ({ to, label, icon, active }) => {
  return (
    <Link
      to={to}
      className={`
        relative flex flex-col items-center justify-center gap-1 px-3 py-2
        transition-all duration-300 ease-out z-50
        hover:bg-slate-800/20
        hover:rounded-lg
        group
        ${active ? "text-sky-400" : "text-slate-400"}
      `}
    >
      {/* MULTI-LAYER BACKGROUND FOR ACTIVE STATE */}
      {active && (
        <>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-sky-400/15 via-sky-400/5 to-transparent" />
          <div className="absolute inset-0 rounded-xl border border-sky-400/20" />
          <div className="absolute inset-0 rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.15)]" />
        </>
      )}

      {/* ICON WITH ENHANCED EFFECTS */}
      <span
        className={`transition-all duration-300 relative z-10 ${
          active ? "scale-110 drop-shadow-[0_0_8px_rgba(56_189_248_0.6)]" : "group-hover:scale-105"
        }`}
      >
        {icon}
      </span>

      {/* LABEL WITH IMPROVED TYPOGRAPHY */}
      <span
        className={`text-[8px] font-bold tracking-wide transition-all duration-300 relative z-10 ${
          active ? "text-sky-100" : "group-hover:text-slate-200"
        }`}
      >
        {label}
      </span>

      {/* ENHANCED HOVER LINE */}
      <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent transition-all duration-300 ease-out ${
        active ? "w-8" : "group-hover:w-5"
      }`} />

      {/* ACTIVE STATE PULSE EFFECT */}
      {active && (
        <div className="absolute inset-0 rounded-xl animate-pulse bg-sky-400/5" />
      )}
    </Link>
  );
};


export default Navbar;
